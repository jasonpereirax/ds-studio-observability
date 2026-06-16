(function () {
  function slugify(value) {
    return String(value || "").toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function inferJourney(path) {
    var value = String(path || "").toLowerCase();
    if (value.includes("checkout") || value.includes("cart") || value.includes("payment") || value.includes("carrinho") || value.includes("finalizar-compra")) return "Checkout";
    if (value.includes("login") || value.includes("account") || value.includes("register") || value.includes("minha-conta") || value.includes("cadastro")) return "Authentication";
    if (value.includes("product") || value.includes("produto")) return "Product Detail";
    if (value.includes("support") || value.includes("help") || value.includes("faq") || value.includes("contato")) return "Support";
    if (value === "/" || value === "") return "Home";
    return "General";
  }

  function getSessionId() {
    try {
      var key = "ds-studio-session-id";
      var id = sessionStorage.getItem(key);
      if (!id) {
        id = "session_" + Math.random().toString(16).slice(2) + "_" + Date.now();
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (error) {
      return "session_unavailable";
    }
  }

  function init(options) {
    var config = options || {};
    var hostname = window.location.hostname || "unknown-host";
    var origin = window.location.origin || "";
    var systemId = config.systemId || slugify(hostname);
    var systemName = config.systemName || hostname.replace(/^www\./, "");
    var endpoint = config.endpoint || "https://YOUR-OBSERVABILITY-DOMAIN.vercel.app/api/collect";

    var payload = {
      systemId: systemId,
      systemName: systemName,
      publicKey: config.publicKey || null,
      journey: config.journey || inferJourney(location.pathname),
      path: location.pathname,
      url: location.href,
      origin: origin,
      hostname: hostname,
      title: document.title || location.pathname,
      referrer: document.referrer || null,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      status: "connected"
    };

    try {
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json", "x-ds-public-key": config.publicKey || "" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {
        if (config.debug) console.warn("[DS Studio Connect] Failed to send heartbeat.");
      });
    } catch (error) {
      if (config.debug) console.warn("[DS Studio Connect] Error:", error);
    }

    window.__DS_STUDIO_CONNECT__ = { status: "connected", payload: payload, ping: function () { init(config); } };
    if (config.debug) console.log("[DS Studio Connect] heartbeat", payload);
  }

  window.DSStudioConnect = { init: init };
})();