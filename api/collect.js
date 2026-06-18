import { cors, supabaseRequest } from "./_supabase.js";

function inferJourney(path) {
  const value = String(path || "").toLowerCase();
  if (value.includes("checkout") || value.includes("cart") || value.includes("payment") || value.includes("carrinho") || value.includes("finalizar-compra")) return "Checkout";
  if (value.includes("login") || value.includes("account") || value.includes("register") || value.includes("minha-conta") || value.includes("cadastro")) return "Authentication";
  if (value.includes("product") || value.includes("produto")) return "Product Detail";
  if (value.includes("support") || value.includes("help") || value.includes("faq") || value.includes("contato")) return "Support";
  if (value === "/" || value === "") return "Home";
  return "General";
}

function str(value) {
  if (value === undefined || value === null) return null;
  return String(value).slice(0, 2000);
}

function int(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function createDebtItems(body, pageEventId) {
  const items = [];
  const systemId = body.systemId;
  const path = str(body.path) || "/";

  if ((int(body.dsComponentCount) || 0) === 0) {
    items.push({
      system_id: systemId,
      page_event_id: pageEventId,
      page_path: path,
      type: "no_ds_components",
      severity: "high",
      title: "No DS components detected",
      description: "This page is connected, but no data-ds-component markers were found.",
      value: 0
    });
  }

  if ((int(body.untrackedButtonCount) || 0) > 0) {
    items.push({
      system_id: systemId,
      page_event_id: pageEventId,
      page_path: path,
      type: "untracked_buttons",
      severity: "medium",
      title: "Untracked interactive buttons",
      description: "Buttons or button-like elements exist without DS instrumentation.",
      value: int(body.untrackedButtonCount) || 0
    });
  }

  if ((int(body.untrackedFormCount) || 0) > 0) {
    items.push({
      system_id: systemId,
      page_event_id: pageEventId,
      page_path: path,
      type: "untracked_forms",
      severity: "high",
      title: "Untracked forms",
      description: "Forms exist without DS instrumentation. This may affect critical journeys.",
      value: int(body.untrackedFormCount) || 0
    });
  }

  return items;
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
    const title = str(body.pageTitle || body.title || body.h1 || body.ogTitle || body.documentTitle || body.path);

    await supabaseRequest("observability_systems", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: systemId,
        name: systemName,
        public_key: publicKey,
        connected: true,
        last_seen_at: now
      })
    });

    const eventResponse = await supabaseRequest("observability_page_events", {
      method: "POST",
      body: JSON.stringify({
        system_id: systemId,
        path: str(body.path) || "/",
        url: str(body.url) || "",
        title,
        journey,
        referrer: str(body.referrer),
        session_id: str(body.sessionId),
        user_agent: str(body.userAgent || req.headers["user-agent"]),
        created_at: body.timestamp || now,

        hostname: str(body.hostname),
        origin: str(body.origin),
        page_title: str(body.pageTitle || body.title),
        document_title: str(body.documentTitle),
        meta_title: str(body.metaTitle),
        og_title: str(body.ogTitle),
        twitter_title: str(body.twitterTitle),
        h1: str(body.h1),
        canonical_url: str(body.canonicalUrl),
        meta_description: str(body.metaDescription),
        og_type: str(body.ogType),
        language: str(body.language),
        script_version: str(body.version),
        environment: str(body.environment || "production"),

        heading_count: int(body.headingCount) || 0,
        button_count: int(body.buttonCount) || 0,
        link_count: int(body.linkCount) || 0,
        form_count: int(body.formCount) || 0,
        image_count: int(body.imageCount) || 0,
        section_count: int(body.sectionCount) || 0,
        input_count: int(body.inputCount) || 0,
        ds_component_count: int(body.dsComponentCount) || 0,
        tracked_component_count: int(body.trackedComponentCount) || 0,
        untracked_button_count: int(body.untrackedButtonCount) || 0,
        untracked_form_count: int(body.untrackedFormCount) || 0,
        ds_readiness: str(body.dsReadiness || "low"),

        viewport_width: int(body.viewportWidth),
        viewport_height: int(body.viewportHeight),
        device_type: str(body.deviceType),
        load_time_ms: int(body.loadTimeMs),
        dom_ready_time_ms: int(body.domReadyTimeMs),
        navigation_type: str(body.navigationType)
      })
    });

    const event = eventResponse?.[0] || null;
    const pageEventId = event?.id || null;

    const components = Array.isArray(body.components) ? body.components : [];
    const usageRows = components
      .filter((component) => component && component.name)
      .map((component) => ({
        system_id: systemId,
        page_event_id: pageEventId,
        page_path: str(body.path) || "/",
        page_url: str(body.url) || "",
        journey,
        component_name: str(component.name),
        component_version: str(component.version),
        component_variant: str(component.variant),
        component_token: str(component.token),
        count: int(component.count) || 1,
        created_at: body.timestamp || now
      }));

    if (usageRows.length) {
      await supabaseRequest("observability_component_usage", {
        method: "POST",
        body: JSON.stringify(usageRows)
      });
    }

    const debtRows = createDebtItems(body, pageEventId);
    if (debtRows.length) {
      await supabaseRequest("observability_design_debt", {
        method: "POST",
        body: JSON.stringify(debtRows)
      });
    }

    return res.status(200).json({
      ok: true,
      connected: true,
      systemId,
      journey,
      title,
      components: usageRows.length,
      debt: debtRows.length,
      event
    });
  } catch (error) {
    console.error("[collect]", error);
    return res.status(500).json({ error: "Failed to collect event", detail: error.message });
  }
}
