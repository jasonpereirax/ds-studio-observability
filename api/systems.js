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

function debtWeight(item) {
  if (item.severity === "high") return 25;
  if (item.severity === "medium") return 12;
  return 5;
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

    const effectiveComponentRows = inventory.length ? inventory : usage;
    const effectiveDebt = findings.length ? findings.map((item) => ({ ...item, created_at: item.last_seen_at || item.first_seen_at })) : debt;
    const globalComponents = groupByComponent(effectiveComponentRows);

    const enriched = systems.map((system) => {
      const systemEvents = events.filter((event) => event.system_id === system.id);
      const systemCurrentPages = currentPages.filter((page) => page.system_id === system.id);
      const systemUsage = effectiveComponentRows.filter((item) => item.system_id === system.id);
      const systemDebt = effectiveDebt.filter((item) => item.system_id === system.id);
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
        pages,
        recentEvents: systemEvents.slice(0, 20)
      };
    });

    return res.status(200).json({
      systems: enriched,
      registry,
      globalComponents,
      designDebt: effectiveDebt,
      scores: {
        adoptionScore: average(enriched.map((system) => system.adoptionScore || 0)),
        readinessScore: average(enriched.map((system) => system.readinessScore || 0)),
        debtScore: average(enriched.map((system) => system.debtScore || 0)),
        confidenceScore: average(enriched.map((system) => system.confidenceScore || 0))
      }
    });
  } catch (error) {
    console.error("[systems]", error);
    return res.status(500).json({ error: "Failed to load systems", detail: error.message });
  }
}
