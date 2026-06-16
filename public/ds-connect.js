(function () {
  function inferJourney(path) {
    var value = String(path || "").toLowerCase();
    if (value.includes("checkout") || value.includes("cart") || value.includes("payment") || value.includes("carrinho") || value.includes("finalizar-compra")) return "Checkout";
    if (value.includes("login") || value.includes("account") || value.includes("register") || value.includes("minha-conta") || value.includes("cadastro")) return "Authentication";
    if (value.includes("product") || value.includes("produto")) return "Product Detail";
    if (value.includes("support") || value.includes("help") || value.includes("faq") || value.includes("contato")) return "Support";
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
    } catch (error) { return "session_unavailable"; }
  }
  function init(options) {
    var config = options || {};
    var endpoint = config.endpoint || "https://YOUR-OBSERVABILITY-DOMAIN.vercel.app/api/collect";
    var payload = {
      systemId: config.systemId || "unknown-system",
      systemName: config.systemName || document.location.hostname,
      publicKey: config.publicKey || null,
      journey: config.journey || inferJourney(location.pathname),
      path: location.pathname,
      url: location.href,
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
        headers: {"Content-Type": "application/json", "x-ds-public-key": config.publicKey || ""},
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () { if (config.debug) console.warn("[DS Studio Connect] Failed to send heartbeat."); });
    } catch (error) { if (config.debug) console.warn("[DS Studio Connect] Error:", error); }
    window.__DS_STUDIO_CONNECT__ = { status: "connected", payload: payload, ping: function () { init(config); } };
  }
  window.DSStudioConnect = { init: init };
})();