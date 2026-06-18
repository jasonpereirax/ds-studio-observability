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

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const systems = await supabaseRequest("observability_systems?select=*&order=last_seen_at.desc", { method: "GET" });
    const events = await supabaseRequest("observability_page_events?select=*&order=created_at.desc&limit=1000", { method: "GET" });

    const enriched = systems.map((system) => {
      const systemEvents = events.filter((event) => event.system_id === system.id);
      const pageMap = new Map();

      systemEvents.forEach((event) => {
        if (!pageMap.has(event.path)) {
          pageMap.set(event.path, { ...event, display_title: displayTitle(event) });
        }
      });

      const pages = Array.from(pageMap.values());
      const journeys = Array.from(new Set(systemEvents.map((event) => event.journey).filter(Boolean)));
      const latestEvent = systemEvents[0] || null;
      const latestUrl = safeUrl(latestEvent?.url || pages[0]?.url || "");
      const totalDsComponents = pages.reduce((sum, page) => sum + Number(page.ds_component_count || 0), 0);
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
        pages,
        recentEvents: systemEvents.slice(0, 20)
      };
    });

    return res.status(200).json({ systems: enriched });
  } catch (error) {
    console.error("[systems]", error);
    return res.status(500).json({ error: "Failed to load systems", detail: error.message });
  }
}
