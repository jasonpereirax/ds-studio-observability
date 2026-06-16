import { cors, supabaseRequest } from "./_supabase.js";

function safeUrl(value) {
  try { return new URL(value); } catch { return null; }
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
      systemEvents.forEach((event) => { if (!pageMap.has(event.path)) pageMap.set(event.path, event); });

      const pages = Array.from(pageMap.values());
      const journeys = Array.from(new Set(systemEvents.map((event) => event.journey).filter(Boolean)));
      const latestEvent = systemEvents[0] || null;
      const latestUrl = safeUrl(latestEvent?.url || pages[0]?.url || "");

      return {
        ...system,
        sourceHost: latestUrl?.hostname || null,
        sourceOrigin: latestUrl?.origin || null,
        sourceUrl: latestEvent?.url || null,
        lastPage: latestEvent?.path || null,
        lastTitle: latestEvent?.title || null,
        lastJourney: latestEvent?.journey || null,
        lastReferrer: latestEvent?.referrer || null,
        activePages: pages.length,
        journeys: journeys.length,
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