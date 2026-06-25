import { cors, supabaseRequest } from "./_supabase.js";

async function optionalSupabaseRequest(path, options = {}, fallback = []) {
  try {
    return await supabaseRequest(path, options);
  } catch (error) {
    console.warn("[systems optional]", path, error.message);
    return fallback;
  }
}

function safeUrl(value) {
  try { return new URL(value); } catch { return null; }
}

function displayTitle(event) {
  return event?.page_title || event?.h1 || event?.og_title || event?.document_title || event?.title || event?.path || "Untitled page";
}

function readinessScore(value) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function readinessPercent(page) {
  if (Number.isFinite(Number(page?.readiness_score))) return Number(page.readiness_score);
  const ds = Number(page?.ds_component_count || 0);
  const tracked = Number(page?.tracked_component_count || 0);
  const buttons = Number(page?.button_count || 0);
  const forms = Number(page?.form_count || 0);
  const interactive = buttons + forms;
  const coverage = interactive ? Math.min(1, (ds + tracked * 0.35) / Math.max(1, interactive)) : ds > 0 ? 1 : 0;
  const breadth = Math.min(1, ds / 12);
  return Math.round((coverage * 70) + (breadth * 30));
}

function average(items) {
  return items.length ? Math.round(items.reduce((sum, item) => sum + item, 0) / items.length) : 0;
}

function timestamp(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function earliest(values) {
  const sorted = values.filter(Boolean).sort((a, b) => timestamp(a) - timestamp(b));
  return sorted[0] || null;
}

function latest(values) {
  const sorted = values.filter(Boolean).sort((a, b) => timestamp(b) - timestamp(a));
  return sorted[0] || null;
}

function slugify(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function canonicalProjectKey(system) {
  const host = system.sourceHost || safeUrl(system.sourceUrl || "")?.hostname || null;
  const origin = system.sourceOrigin || null;
  return origin || host || system.id;
}

function debtWeight(item) {
  if (item.severity === "high") return 25;
  if (item.severity === "medium") return 12;
  return 5;
}

function mergeComponentUsage(groups) {
  const map = new Map();

  groups.flat().forEach((component) => {
    const current = map.get(component.name) || {
      name: component.name,
      count: 0,
      pages: new Set(),
      systems: new Set(),
      variants: new Set(),
      versions: new Set()
    };

    current.count += Number(component.count || 0);
    (component.pages || []).forEach((page) => current.pages.add(page));
    (component.systems || []).forEach((system) => current.systems.add(system));
    (component.variants || []).forEach((variant) => current.variants.add(variant));
    (component.versions || []).forEach((version) => current.versions.add(version));

    map.set(component.name, current);
  });

  return Array.from(map.values()).map((item) => ({
    name: item.name,
    count: item.count,
    pages: Array.from(item.pages),
    systems: Array.from(item.systems),
    variants: Array.from(item.variants),
    versions: Array.from(item.versions)
  })).sort((a, b) => b.count - a.count);
}

function mergePages(groups) {
  const map = new Map();

  groups.flat().forEach((page) => {
    const key = `${page.environment || "production"}:${page.path}`;
    const current = map.get(key);
    if (!current || timestamp(page.last_seen_at || page.created_at) > timestamp(current.last_seen_at || current.created_at)) {
      map.set(key, page);
    }
  });

  return Array.from(map.values()).sort((a, b) => timestamp(b.last_seen_at || b.created_at) - timestamp(a.last_seen_at || a.created_at));
}

function groupByComponent(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const key = row.component_name;
    const current = map.get(key) || {
      name: key,
      count: 0,
      pages: new Set(),
      systems: new Set(),
      variants: new Set(),
      versions: new Set()
    };

    current.count += Number(row.count || 0);
    current.pages.add(row.page_path);
    current.systems.add(row.system_id);
    if (row.component_variant) current.variants.add(row.component_variant);
    if (row.component_version) current.versions.add(row.component_version);

    map.set(key, current);
  });

  return Array.from(map.values()).map((item) => ({
    name: item.name,
    count: item.count,
    pages: Array.from(item.pages),
    systems: Array.from(item.systems),
    variants: Array.from(item.variants),
    versions: Array.from(item.versions)
  })).sort((a, b) => b.count - a.count);
}

function createScoreReasons({ pages, systemDebt, componentUsage }) {
  const reasons = [];
  const lowPages = pages.filter((page) => (page.ds_readiness || "low") === "low").length;
  const highDebt = systemDebt.filter((item) => item.severity === "high").length;
  const components = componentUsage.length;

  if (lowPages) reasons.push(`${lowPages} page(s) with low DS readiness`);
  if (highDebt) reasons.push(`${highDebt} high severity finding(s)`);
  if (!components) reasons.push("No DS components detected yet");
  if (!reasons.length) reasons.push("Current pages have usable DS coverage and no active critical findings");

  return reasons;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const systems = await supabaseRequest("observability_systems?select=*&order=last_seen_at.desc", { method: "GET" });
    const events = await supabaseRequest("observability_page_events?select=*&order=created_at.desc&limit=1000", { method: "GET" });
    const usage = await supabaseRequest("observability_component_usage?select=*&order=created_at.desc&limit=2000", { method: "GET" });
    const debt = await optionalSupabaseRequest("observability_design_debt?select=*&order=created_at.desc&limit=1000", { method: "GET" });
    const registry = await supabaseRequest("observability_component_registry?select=*&order=name.asc", { method: "GET" });
    const currentPages = await optionalSupabaseRequest("observability_pages?select=*&order=last_seen_at.desc&limit=2000", { method: "GET" });
    const inventory = await optionalSupabaseRequest("observability_component_inventory?select=*&order=last_seen_at.desc&limit=4000", { method: "GET" });
    const findings = await optionalSupabaseRequest("observability_findings?select=*&active=eq.true&order=last_seen_at.desc&limit=2000", { method: "GET" });
    const monitoredUrls = await optionalSupabaseRequest("observability_monitored_urls?select=*&order=last_checked_at.desc.nullslast&limit=2000", { method: "GET" });
    const coverageChecks = await optionalSupabaseRequest("observability_coverage_checks?select=*&order=checked_at.desc&limit=2000", { method: "GET" });

    const effectiveComponentRows = inventory.length ? inventory : usage;
    const effectiveDebt = findings.length ? findings.map((item) => ({ ...item, created_at: item.last_seen_at || item.first_seen_at })) : debt;
    const globalComponents = groupByComponent(effectiveComponentRows);

    const enriched = systems.map((system) => {
      const systemEvents = events.filter((event) => event.system_id === system.id);
      const systemCurrentPages = currentPages.filter((page) => page.system_id === system.id);
      const systemUsage = effectiveComponentRows.filter((item) => item.system_id === system.id);
      const systemDebt = effectiveDebt.filter((item) => item.system_id === system.id);
      const systemMonitoredUrls = monitoredUrls.filter((item) => item.system_id === system.id);
      const systemCoverageChecks = coverageChecks.filter((item) => item.system_id === system.id);
      const componentUsage = groupByComponent(systemUsage);
      const pageMap = new Map();

      systemCurrentPages.forEach((page) => {
        const pageUsage = systemUsage.filter((item) => (item.page_path || item.path) === page.path);
        const pageDebt = systemDebt.filter((item) => item.page_path === page.path);

        pageMap.set(page.path, {
          ...page,
          id: page.last_event_id || page.id,
          created_at: page.last_seen_at || page.created_at,
          display_title: page.display_title || displayTitle(page),
          components: groupByComponent(pageUsage),
          debt: pageDebt
        });
      });

      systemEvents.forEach((event) => {
        if (!pageMap.has(event.path)) {
          const pageUsage = systemUsage.filter((item) => item.page_path === event.path);
          const pageDebt = systemDebt.filter((item) => item.page_path === event.path);

          pageMap.set(event.path, {
            ...event,
            display_title: displayTitle(event),
            components: groupByComponent(pageUsage),
            debt: pageDebt
          });
        }
      });

      const pages = Array.from(pageMap.values());
      const journeys = Array.from(new Set([...systemEvents, ...pages].map((event) => event.journey).filter(Boolean)));
      const latestEvent = systemEvents[0] || null;
      const latestPage = pages[0] || null;
      const latestUrl = safeUrl(latestEvent?.url || latestPage?.url || "");
      const totalDsComponents = componentUsage.reduce((sum, item) => sum + item.count, 0);
      const totalTrackedComponents = pages.reduce((sum, page) => sum + Number(page.tracked_component_count || 0), 0);
      const averageReadiness = pages.length
        ? pages.reduce((sum, page) => sum + readinessScore(page.ds_readiness), 0) / pages.length
        : 0;

      const dsReadiness = averageReadiness >= 2.5 ? "high" : averageReadiness >= 1.5 ? "medium" : "low";
      const readiness = average(pages.map(readinessPercent));
      const debtScore = Math.max(0, 100 - systemDebt.reduce((sum, item) => sum + debtWeight(item), 0));
      const impactScore = Math.min(100, componentUsage.reduce((sum, item) => sum + (item.pages.length * item.systems.length * 4), 0));
      const confidenceScore = average(pages.map((page) => Number(page.confidence_score || 0)).filter(Boolean));
      const adoptionScore = Math.round((readiness * 0.55) + (debtScore * 0.25) + (confidenceScore * 0.2));
      const scoreReasons = createScoreReasons({ pages, systemDebt, componentUsage });

      return {
        ...system,
        sourceHost: latestPage?.hostname || latestEvent?.hostname || latestUrl?.hostname || null,
        sourceOrigin: latestPage?.origin || latestEvent?.origin || latestUrl?.origin || null,
        sourceUrl: latestPage?.url || latestEvent?.url || null,
        lastPage: latestPage?.path || latestEvent?.path || null,
        lastTitle: displayTitle(latestPage || latestEvent),
        lastDocumentTitle: latestPage?.document_title || latestEvent?.document_title || null,
        lastH1: latestPage?.h1 || latestEvent?.h1 || null,
        lastCanonicalUrl: latestPage?.canonical_url || latestEvent?.canonical_url || null,
        lastJourney: latestPage?.journey || latestEvent?.journey || null,
        lastReferrer: latestEvent?.referrer || null,
        environment: latestPage?.environment || latestEvent?.environment || "production",
        scriptVersion: latestPage?.script_version || latestEvent?.script_version || null,
        deviceType: latestPage?.device_type || latestEvent?.device_type || null,
        viewport: latestPage?.viewport_width ? `${latestPage.viewport_width}×${latestPage.viewport_height || "?"}` : latestEvent?.viewport_width ? `${latestEvent.viewport_width}×${latestEvent.viewport_height || "?"}` : null,
        loadTimeMs: latestPage?.load_time_ms || latestEvent?.load_time_ms || null,
        activePages: pages.length,
        journeys: journeys.length,
        totalDsComponents,
        totalTrackedComponents,
        dsReadiness,
        readinessScore: readiness,
        debtScore,
        impactScore,
        confidenceScore,
        adoptionScore,
        scoreReasons,
        componentUsage,
        designDebt: systemDebt,
        monitoredUrls: systemMonitoredUrls,
        coverageChecks: systemCoverageChecks.slice(0, 20),
        pages,
        recentEvents: systemEvents.slice(0, 20)
      };
    });
    const activeWindowMinutes = Number(process.env.OBSERVABILITY_ACTIVE_WINDOW_MINUTES || 5);
    const activeAfter = Date.now() - (Number.isFinite(activeWindowMinutes) ? activeWindowMinutes : 5) * 60 * 1000;
    const groups = new Map();

    enriched.forEach((system) => {
      const key = canonicalProjectKey(system);
      const current = groups.get(key) || [];
      current.push(system);
      groups.set(key, current);
    });

    const canonicalSystems = Array.from(groups.entries()).map(([key, group]) => {
      const sorted = [...group].sort((a, b) => timestamp(b.last_seen_at) - timestamp(a.last_seen_at));
      const primary = sorted[0];
      const pages = mergePages(group.map((system) => system.pages || []));
      const componentUsage = mergeComponentUsage(group.map((system) => system.componentUsage || []));
      const designDebt = group.flatMap((system) => system.designDebt || []);
      const recentEvents = group.flatMap((system) => system.recentEvents || [])
        .sort((a, b) => timestamp(b.created_at) - timestamp(a.created_at))
        .slice(0, 30);
      const monitoredUrls = group.flatMap((system) => system.monitoredUrls || [])
        .sort((a, b) => timestamp(b.last_checked_at) - timestamp(a.last_checked_at));
      const coverageChecks = group.flatMap((system) => system.coverageChecks || [])
        .sort((a, b) => timestamp(b.checked_at) - timestamp(a.checked_at))
        .slice(0, 30);
      const journeys = Array.from(new Set(pages.map((page) => page.journey).filter(Boolean)));
      const firstSeen = earliest(group.map((system) => system.first_seen_at));
      const lastSeen = latest(group.map((system) => system.last_seen_at));
      const isCurrentlyConnected = timestamp(lastSeen) >= activeAfter;
      const readiness = average(pages.map(readinessPercent));
      const debtScore = Math.max(0, 100 - designDebt.reduce((sum, item) => sum + debtWeight(item), 0));
      const confidenceScore = average(pages.map((page) => Number(page.confidence_score || 0)).filter(Boolean));
      const adoptionScore = Math.round((readiness * 0.55) + (debtScore * 0.25) + (confidenceScore * 0.2));
      const averageReadiness = pages.length
        ? pages.reduce((sum, page) => sum + readinessScore(page.ds_readiness), 0) / pages.length
        : 0;
      const dsReadiness = averageReadiness >= 2.5 ? "high" : averageReadiness >= 1.5 ? "medium" : "low";
      const scoreReasons = createScoreReasons({ pages, systemDebt: designDebt, componentUsage });
      const sourceHost = primary.sourceHost || safeUrl(primary.sourceUrl || "")?.hostname || slugify(key);
      const displayName = sourceHost || primary.name;
      const monitoredCount = monitoredUrls.length || pages.filter((page) => page.coverage_checked_at).length;
      const coverageOk = pages.filter((page) => page.coverage_status === "ok" || page.snippet_detected).length;
      const missingSnippet = pages.filter((page) => page.coverage_status === "missing_snippet").length;
      const latestCoverageCheckAt = latest([
        ...coverageChecks.map((check) => check.checked_at),
        ...pages.map((page) => page.coverage_checked_at)
      ]);

      return {
        ...primary,
        id: `project-${slugify(key)}`,
        rawSystemIds: group.map((system) => system.id),
        name: displayName,
        canonicalKey: key,
        aliases: group.map((system) => ({
          id: system.id,
          name: system.name,
          publicKey: system.public_key,
          firstSeenAt: system.first_seen_at,
          lastSeenAt: system.last_seen_at,
          active: timestamp(system.last_seen_at) >= activeAfter
        })),
        aliasCount: group.length,
        connected: isCurrentlyConnected,
        isCurrentlyConnected,
        monitoredUrlCount: monitoredCount,
        coverageOk,
        missingSnippet,
        latestCoverageCheckAt,
        activeWindowMinutes,
        first_seen_at: firstSeen || primary.first_seen_at,
        last_seen_at: lastSeen || primary.last_seen_at,
        sourceHost,
        sourceOrigin: primary.sourceOrigin || (primary.sourceUrl ? safeUrl(primary.sourceUrl)?.origin : null),
        activePages: pages.length,
        journeys: journeys.length,
        totalDsComponents: componentUsage.reduce((sum, item) => sum + item.count, 0),
        totalTrackedComponents: pages.reduce((sum, page) => sum + Number(page.tracked_component_count || 0), 0),
        dsReadiness,
        readinessScore: readiness,
        debtScore,
        confidenceScore,
        adoptionScore,
        impactScore: Math.min(100, componentUsage.reduce((sum, item) => sum + (item.pages.length * item.systems.length * 4), 0)),
        scoreReasons,
        componentUsage,
        designDebt,
        monitoredUrls,
        coverageChecks,
        pages,
        recentEvents
      };
    }).sort((a, b) => timestamp(b.last_seen_at) - timestamp(a.last_seen_at));

    const activeSystems = canonicalSystems.filter((system) => system.isCurrentlyConnected);

    return res.status(200).json({
      systems: canonicalSystems,
      activeSystems,
      registry,
      globalComponents,
      designDebt: effectiveDebt,
      coverage: {
        monitoredUrls: monitoredUrls.length,
        latestChecks: coverageChecks.slice(0, 50),
        ok: coverageChecks.filter((check) => check.status === "ok").length,
        missingSnippet: coverageChecks.filter((check) => check.status === "missing_snippet").length
      },
      scores: {
        adoptionScore: average(activeSystems.map((system) => system.adoptionScore || 0)),
        readinessScore: average(activeSystems.map((system) => system.readinessScore || 0)),
        debtScore: average(activeSystems.map((system) => system.debtScore || 0)),
        confidenceScore: average(activeSystems.map((system) => system.confidenceScore || 0))
      }
    });
  } catch (error) {
    console.error("[systems]", error);
    return res.status(500).json({ error: "Failed to load systems", detail: error.message });
  }
}
