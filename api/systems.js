import { cors, supabaseRequest } from "./_supabase.js";

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

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const systems = await supabaseRequest("observability_systems?select=*&order=last_seen_at.desc", { method: "GET" });
    const events = await supabaseRequest("observability_page_events?select=*&order=created_at.desc&limit=1000", { method: "GET" });
    const usage = await supabaseRequest("observability_component_usage?select=*&order=created_at.desc&limit=2000", { method: "GET" });
    const debt = await supabaseRequest("observability_design_debt?select=*&order=created_at.desc&limit=1000", { method: "GET" });
    const registry = await supabaseRequest("observability_component_registry?select=*&order=name.asc", { method: "GET" });

    const globalComponents = groupByComponent(usage);

    const enriched = systems.map((system) => {
      const systemEvents = events.filter((event) => event.system_id === system.id);
      const systemUsage = usage.filter((item) => item.system_id === system.id);
      const systemDebt = debt.filter((item) => item.system_id === system.id);
      const componentUsage = groupByComponent(systemUsage);
      const pageMap = new Map();

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
      const journeys = Array.from(new Set(systemEvents.map((event) => event.journey).filter(Boolean)));
      const latestEvent = systemEvents[0] || null;
      const latestUrl = safeUrl(latestEvent?.url || pages[0]?.url || "");
      const totalDsComponents = componentUsage.reduce((sum, item) => sum + item.count, 0);
      const totalTrackedComponents = pages.reduce((sum, page) => sum + Number(page.tracked_component_count || 0), 0);
      const averageReadiness = pages.length
        ? pages.reduce((sum, page) => sum + readinessScore(page.ds_readiness), 0) / pages.length
        : 0;

      const dsReadiness = averageReadiness >= 2.5 ? "high" : averageReadiness >= 1.5 ? "medium" : "low";

      return {
        ...system,
        sourceHost: latestEvent?.hostname || latestUrl?.hostname || null,
        sourceOrigin: latestEvent?.origin || latestUrl?.origin || null,
        sourceUrl: latestEvent?.url || null,
        lastPage: latestEvent?.path || null,
        lastTitle: displayTitle(latestEvent),
        lastDocumentTitle: latestEvent?.document_title || null,
        lastH1: latestEvent?.h1 || null,
        lastCanonicalUrl: latestEvent?.canonical_url || null,
        lastJourney: latestEvent?.journey || null,
        lastReferrer: latestEvent?.referrer || null,
        environment: latestEvent?.environment || "production",
        scriptVersion: latestEvent?.script_version || null,
        deviceType: latestEvent?.device_type || null,
        viewport: latestEvent?.viewport_width ? `${latestEvent.viewport_width}×${latestEvent.viewport_height || "?"}` : null,
        loadTimeMs: latestEvent?.load_time_ms || null,
        activePages: pages.length,
        journeys: journeys.length,
        totalDsComponents,
        totalTrackedComponents,
        dsReadiness,
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
      designDebt: debt
    });
  } catch (error) {
    console.error("[systems]", error);
    return res.status(500).json({ error: "Failed to load systems", detail: error.message });
  }
}
