import { cors, supabaseRequest } from "./_supabase.js";

function inferJourney(path) {
  const value = String(path || "").toLowerCase();
  if (value.includes("checkout") || value.includes("cart") || value.includes("payment") || value.includes("carrinho") || value.includes("finalizar-compra")) return "Checkout";
  if (value.includes("login") || value.includes("account") || value.includes("register") || value.includes("minha-conta") || value.includes("cadastro")) return "Authentication";
  if (value.includes("product") || value.includes("produto")) return "Product Detail";
  if (value.includes("support") || value.includes("help") || value.includes("faq") || value.includes("contato")) return "Support";
  return "General";
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const systemId = String(body.systemId || "").trim();
    const systemName = String(body.systemName || systemId || "Unknown system").trim();
    const publicKey = String(body.publicKey || req.headers["x-ds-public-key"] || "").trim();
    if (!systemId) return res.status(400).json({ error: "systemId is required" });
    const now = new Date().toISOString();
    const journey = body.journey || inferJourney(body.path || body.url);

    await supabaseRequest("observability_systems", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ id: systemId, name: systemName, public_key: publicKey, connected: true, last_seen_at: now })
    });

    const event = await supabaseRequest("observability_page_events", {
      method: "POST",
      body: JSON.stringify({
        system_id: systemId,
        path: body.path || "/",
        url: body.url || "",
        title: body.title || null,
        journey,
        referrer: body.referrer || null,
        session_id: body.sessionId || null,
        user_agent: body.userAgent || req.headers["user-agent"] || null,
        created_at: body.timestamp || now
      })
    });

    return res.status(200).json({ ok: true, connected: true, systemId, journey, event: event?.[0] || null });
  } catch (error) {
    console.error("[collect]", error);
    return res.status(500).json({ error: "Failed to collect event", detail: error.message });
  }
}
