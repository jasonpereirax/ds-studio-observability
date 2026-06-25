import { cors, supabaseRequest } from "./_supabase.js";

function enc(value) {
  return encodeURIComponent(String(value ?? ""));
}

function slugify(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function str(value, limit = 2000) {
  if (value === undefined || value === null) return null;
  return String(value).slice(0, limit);
}

function textMatch(html, pattern) {
  const match = String(html || "").match(pattern);
  return match?.[1] ? match[1].replace(/\s+/g, " ").trim() : null;
}

function countMatches(html, pattern) {
  return Array.from(String(html || "").matchAll(pattern)).length;
}

function attrValue(tag, name) {
  const match = String(tag || "").match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match?.[1] || null;
}

function inferJourney(path) {
  const value = String(path || "").toLowerCase();
  if (value.includes("checkout") || value.includes("cart") || value.includes("payment") || value.includes("carrinho") || value.includes("finalizar-compra")) return "Checkout";
  if (value.includes("login") || value.includes("account") || value.includes("register") || value.includes("minha-conta") || value.includes("cadastro")) return "Authentication";
  if (value.includes("product") || value.includes("produto")) return "Product Detail";
  if (value.includes("support") || value.includes("help") || value.includes("faq") || value.includes("contato")) return "Support";
  if (value === "/" || value === "") return "Home";
  return "General";
}

function parseComponents(html) {
  const map = new Map();
  const tags = Array.from(String(html || "").matchAll(/<[^>]+data-ds-component=["'][^"']+["'][^>]*>/gi)).map((match) => match[0]);

  tags.forEach((tag) => {
    const name = attrValue(tag, "data-ds-component");
    if (!name) return;

    const version = attrValue(tag, "data-ds-version");
    const variant = attrValue(tag, "data-ds-variant");
    const token = attrValue(tag, "data-ds-token");
    const key = [name, version || "", variant || "", token || ""].join("|");
    const current = map.get(key) || { name, version, variant, token, count: 0 };
    current.count += 1;
    map.set(key, current);
  });

  return Array.from(map.values());
}

function readinessScore({ dsComponentCount, trackedComponentCount, buttonCount, formCount }) {
  const interactive = buttonCount + formCount;
  const coverage = interactive ? Math.min(1, (dsComponentCount + trackedComponentCount * 0.35) / Math.max(1, interactive)) : dsComponentCount > 0 ? 1 : 0;
  const breadth = Math.min(1, dsComponentCount / 12);
  return Math.round((coverage * 70) + (breadth * 30));
}

function readinessLabel(score) {
  if (score >= 75) return "high";
  if (score >= 35) return "medium";
  return "low";
}

async function optionalSupabaseRequest(path, options = {}, fallback = null) {
  try {
    return await supabaseRequest(path, options);
  } catch (error) {
    console.warn("[coverage-check optional]", path, error.message);
    return fallback;
  }
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DSStudioObservability/1.0 (+https://ds-studio-observability.vercel.app)"
      }
    });
    const html = await response.text();
    return { response, html };
  } finally {
    clearTimeout(timeout);
  }
}

function getTargets(body, monitoredUrls) {
  if (Array.isArray(body.urls) && body.urls.length) {
    return body.urls.map((item) => typeof item === "string" ? { url: item } : item).filter((item) => item.url);
  }

  if (body.url) return [{ url: body.url, systemId: body.systemId, systemName: body.systemName, environment: body.environment }];

  return monitoredUrls.map((item) => ({
    url: item.url,
    systemId: item.system_id,
    systemName: item.system_id,
    environment: item.environment,
    monitoredUrlId: item.id
  }));
}

async function checkTarget(target) {
  const now = new Date().toISOString();
  const parsed = new URL(target.url);
  const systemId = str(target.systemId) || slugify(parsed.hostname);
  const systemName = str(target.systemName) || parsed.hostname.replace(/^www\./, "");
  const environment = str(target.environment || "production");
  const path = parsed.pathname || "/";
  const journey = target.journey || inferJourney(path);

  await supabaseRequest("observability_systems", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: systemId,
      name: systemName,
      connected: true,
      last_seen_at: now
    })
  });

  const monitoredResponse = await supabaseRequest("observability_monitored_urls?on_conflict=system_id,url,environment", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: target.monitoredUrlId || undefined,
      system_id: systemId,
      url: target.url,
      environment,
      active: true
    })
  });
  const monitoredUrl = monitoredResponse?.[0] || null;

  let status = "ok";
  let httpStatus = null;
  let html = "";
  let error = null;

  try {
    const result = await fetchHtml(target.url);
    httpStatus = result.response.status;
    html = result.html;
    if (!result.response.ok) status = "http_error";
  } catch (err) {
    status = err?.name === "AbortError" ? "timeout" : "fetch_error";
    error = err?.message || "Failed to fetch URL";
  }

  const components = parseComponents(html);
  const snippetDetected = /ds-connect\.js|DSStudioConnect|__DS_STUDIO_CONNECT__/i.test(html);
  const trackerDetected = /DSStudioConnect\.init|__DS_STUDIO_CONNECT__/i.test(html);
  const snippetVersion = textMatch(html, /VERSION\s*=\s*["']([^"']+)["']/i);
  const title = textMatch(html, /<title[^>]*>([^<]+)<\/title>/i) || path;
  const h1 = textMatch(html, /<h1[^>]*>(.*?)<\/h1>/is);
  const canonicalUrl = textMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const language = textMatch(html, /<html[^>]+lang=["']([^"']+)["']/i);
  const headingCount = countMatches(html, /<h[1-6][\s>]/gi);
  const buttonCount = countMatches(html, /<button[\s>]|role=["']button["']/gi);
  const linkCount = countMatches(html, /<a\s[^>]*href=/gi);
  const formCount = countMatches(html, /<form[\s>]/gi);
  const imageCount = countMatches(html, /<img[\s>]|<picture[\s>]|<svg[\s>]/gi);
  const sectionCount = countMatches(html, /<(main|section|article|aside|nav|header|footer)[\s>]/gi);
  const inputCount = countMatches(html, /<(input|select|textarea)[\s>]/gi);
  const dsComponentCount = components.reduce((sum, component) => sum + component.count, 0);
  const trackedComponentCount = countMatches(html, /data-ds-component=|data-component=|data-testid=/gi);
  const untrackedButtonCount = Math.max(0, buttonCount - dsComponentCount);
  const untrackedFormCount = formCount && dsComponentCount === 0 ? formCount : 0;
  const score = readinessScore({ dsComponentCount, trackedComponentCount, buttonCount, formCount });
  const confidenceScore = Math.min(100, 45 + (snippetDetected ? 25 : 0) + (title ? 10 : 0) + (headingCount ? 10 : 0) + (components.length ? 10 : 0));

  if (status === "ok" && !snippetDetected) status = "missing_snippet";

  const checkResponse = await optionalSupabaseRequest("observability_coverage_checks", {
    method: "POST",
    body: JSON.stringify({
      monitored_url_id: monitoredUrl?.id || null,
      system_id: systemId,
      url: target.url,
      path,
      environment,
      status,
      http_status: httpStatus,
      snippet_detected: snippetDetected,
      tracker_detected: trackerDetected,
      snippet_version: snippetVersion,
      component_count: dsComponentCount,
      readiness_score: score,
      confidence_score: confidenceScore,
      error,
      checked_at: now
    })
  });
  const check = checkResponse?.[0] || null;

  await optionalSupabaseRequest("observability_monitored_urls?on_conflict=system_id,url,environment", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: monitoredUrl?.id,
      system_id: systemId,
      url: target.url,
      environment,
      active: true,
      last_checked_at: now,
      last_status: status,
      last_error: error
    })
  });

  await optionalSupabaseRequest("observability_pages?on_conflict=system_id,path,environment", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      system_id: systemId,
      path,
      url: target.url,
      title,
      display_title: h1 || title,
      journey,
      hostname: parsed.hostname,
      origin: parsed.origin,
      environment,
      page_title: title,
      document_title: title,
      h1,
      canonical_url: canonicalUrl,
      language,
      script_version: snippetVersion,
      heading_count: headingCount,
      button_count: buttonCount,
      link_count: linkCount,
      form_count: formCount,
      image_count: imageCount,
      section_count: sectionCount,
      input_count: inputCount,
      ds_component_count: dsComponentCount,
      tracked_component_count: trackedComponentCount,
      untracked_button_count: untrackedButtonCount,
      untracked_form_count: untrackedFormCount,
      ds_readiness: readinessLabel(score),
      readiness_score: score,
      confidence_score: confidenceScore,
      last_signal_source: "coverage-check",
      coverage_status: status,
      coverage_checked_at: now,
      snippet_detected: snippetDetected,
      monitored_url_id: monitoredUrl?.id || null,
      last_seen_at: now
    })
  });

  await optionalSupabaseRequest(`observability_component_inventory?system_id=eq.${enc(systemId)}&page_path=eq.${enc(path)}&environment=eq.${enc(environment)}`, {
    method: "DELETE"
  });

  if (components.length) {
    await optionalSupabaseRequest("observability_component_inventory?on_conflict=system_id,page_path,environment,component_name,component_version,component_variant,component_token", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(components.map((component) => ({
        system_id: systemId,
        page_path: path,
        page_url: target.url,
        environment,
        journey,
        component_name: str(component.name),
        component_version: str(component.version),
        component_variant: str(component.variant),
        component_token: str(component.token),
        count: component.count,
        last_signal_source: "coverage-check",
        last_seen_at: now
      })))
    });
  }

  return {
    ok: status === "ok",
    status,
    systemId,
    url: target.url,
    path,
    snippetDetected,
    trackerDetected,
    componentCount: dsComponentCount,
    readinessScore: score,
    confidenceScore,
    checkId: check?.id || null
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });

  try {
    const monitorKey = process.env.OBSERVABILITY_MONITOR_KEY;
    const providedKey = req.headers["x-ds-monitor-key"] || req.query?.key;
    if (monitorKey && providedKey !== monitorKey) return res.status(403).json({ error: "Invalid monitor key" });

    const body = req.method === "POST"
      ? typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}
      : {};
    const monitoredUrls = await optionalSupabaseRequest("observability_monitored_urls?select=*&active=eq.true&order=last_checked_at.asc.nullsfirst&limit=25", { method: "GET" }, []);
    const targets = getTargets(body, monitoredUrls);

    if (!targets.length) {
      return res.status(200).json({ ok: true, checked: 0, results: [] });
    }

    const results = [];
    for (const target of targets.slice(0, 25)) {
      try {
        results.push(await checkTarget(target));
      } catch (error) {
        results.push({ ok: false, url: target.url, status: "check_failed", error: error.message });
      }
    }

    return res.status(200).json({ ok: true, checked: results.length, results });
  } catch (error) {
    console.error("[coverage-check]", error);
    return res.status(500).json({ error: "Failed to run coverage check", detail: error.message });
  }
}
