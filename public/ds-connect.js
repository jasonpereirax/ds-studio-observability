(function () {
  var VERSION = "0.4.0-component-usage";

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function text(selector) {
    var el = document.querySelector(selector);
    return el && el.textContent ? el.textContent.replace(/\s+/g, " ").trim() : null;
  }

  function attr(selector, name) {
    var el = document.querySelector(selector);
    return el ? el.getAttribute(name) : null;
  }

  function cleanTitle(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+[–|-]\s+.+$/, "")
      .trim();
  }

  function getPageMetadata() {
    var documentTitle = document.title || "";
    var ogTitle = attr('meta[property="og:title"]', "content");
    var twitterTitle = attr('meta[name="twitter:title"]', "content");
    var metaTitle = attr('meta[name="title"]', "content");
    var h1 = text("main h1") || text("article h1") || text("h1");
    var canonicalUrl = attr('link[rel="canonical"]', "href");
    var metaDescription = attr('meta[name="description"]', "content");
    var ogType = attr('meta[property="og:type"]', "content");

    var resolvedTitle =
      cleanTitle(h1) ||
      cleanTitle(ogTitle) ||
      cleanTitle(twitterTitle) ||
      cleanTitle(metaTitle) ||
      cleanTitle(documentTitle) ||
      location.pathname;

    return {
      title: resolvedTitle,
      pageTitle: resolvedTitle,
      documentTitle: documentTitle || null,
      metaTitle: metaTitle || null,
      ogTitle: ogTitle || null,
      twitterTitle: twitterTitle || null,
      h1: h1 || null,
      canonicalUrl: canonicalUrl || null,
      metaDescription: metaDescription || null,
      ogType: ogType || null,
      language: document.documentElement.getAttribute("lang") || null
    };
  }

  function getComponentUsage() {
    var nodes = Array.from(document.querySelectorAll("[data-ds-component]"));
    var map = {};

    nodes.forEach(function (el) {
      var name = el.getAttribute("data-ds-component");
      if (!name) return;

      var version = el.getAttribute("data-ds-version") || null;
      var variant = el.getAttribute("data-ds-variant") || null;
      var token = el.getAttribute("data-ds-token") || null;
      var key = [name, version || "", variant || "", token || ""].join("|");

      if (!map[key]) {
        map[key] = {
          name: name,
          version: version,
          variant: variant,
          token: token,
          count: 0
        };
      }

      map[key].count += 1;
    });

    return Object.keys(map).map(function (key) {
      return map[key];
    });
  }

  function getPageStructure(components) {
    var dsComponents = document.querySelectorAll("[data-ds-component]");
    var tracked = document.querySelectorAll("[data-ds-component], [data-component], [data-testid]");
    var buttons = Array.from(document.querySelectorAll("button, [role='button'], a.button, .button, .btn"));
    var forms = Array.from(document.querySelectorAll("form"));
    var untrackedButtons = buttons.filter(function (el) {
      return !el.closest("[data-ds-component]") && !el.hasAttribute("data-ds-component");
    });
    var untrackedForms = forms.filter(function (el) {
      return !el.closest("[data-ds-component]") && !el.hasAttribute("data-ds-component");
    });

    var dsComponentCount = dsComponents.length;
    var trackedComponentCount = tracked.length;
    var dsReadiness = "low";

    if (dsComponentCount >= 10 || components.length >= 6) {
      dsReadiness = "high";
    } else if (dsComponentCount > 0 || trackedComponentCount >= 5 || components.length > 0) {
      dsReadiness = "medium";
    }

    return {
      headingCount: document.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      buttonCount: buttons.length,
      linkCount: document.querySelectorAll("a[href]").length,
      formCount: forms.length,
      imageCount: document.querySelectorAll("img,picture,svg").length,
      sectionCount: document.querySelectorAll("main,section,article,aside,nav,header,footer").length,
      inputCount: document.querySelectorAll("input,select,textarea").length,
      dsComponentCount: dsComponentCount,
      trackedComponentCount: trackedComponentCount,
      untrackedButtonCount: untrackedButtons.length,
      untrackedFormCount: untrackedForms.length,
      dsReadiness: dsReadiness
    };
  }

  function getPerformanceData() {
    var nav = null;
    try { nav = performance.getEntriesByType("navigation")[0]; } catch (error) {}

    if (!nav) {
      return { loadTimeMs: null, domReadyTimeMs: null, navigationType: null };
    }

    return {
      loadTimeMs: Math.round(nav.loadEventEnd || nav.duration || 0),
      domReadyTimeMs: Math.round(nav.domContentLoadedEventEnd || 0),
      navigationType: nav.type || null
    };
  }

  function getDeviceData() {
    var width = window.innerWidth || document.documentElement.clientWidth || null;
    var height = window.innerHeight || document.documentElement.clientHeight || null;
    var deviceType = "desktop";

    if (width && width < 768) deviceType = "mobile";
    else if (width && width < 1100) deviceType = "tablet";

    return { viewportWidth: width, viewportHeight: height, deviceType: deviceType };
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

  function send(config) {
    config = config || {};

    var components = getComponentUsage();
    var metadata = getPageMetadata();
    var structure = getPageStructure(components);
    var performanceData = getPerformanceData();
    var device = getDeviceData();
    var hostname = window.location.hostname || "unknown-host";
    var systemId = config.systemId || slugify(hostname);
    var systemName = config.systemName || hostname.replace(/^www\./, "");
    var endpoint = config.endpoint || "https://YOUR-OBSERVABILITY-DOMAIN.vercel.app/api/collect";

    var payload = {
      version: VERSION,
      systemId: systemId,
      systemName: systemName,
      publicKey: config.publicKey || null,
      environment: config.environment || "production",
      journey: config.journey || inferJourney(location.pathname),
      path: location.pathname,
      url: location.href,
      origin: window.location.origin || "",
      hostname: hostname,
      referrer: document.referrer || null,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      status: "connected",

      title: metadata.title,
      pageTitle: metadata.pageTitle,
      documentTitle: metadata.documentTitle,
      metaTitle: metadata.metaTitle,
      ogTitle: metadata.ogTitle,
      twitterTitle: metadata.twitterTitle,
      h1: metadata.h1,
      canonicalUrl: metadata.canonicalUrl,
      metaDescription: metadata.metaDescription,
      ogType: metadata.ogType,
      language: metadata.language,

      headingCount: structure.headingCount,
      buttonCount: structure.buttonCount,
      linkCount: structure.linkCount,
      formCount: structure.formCount,
      imageCount: structure.imageCount,
      sectionCount: structure.sectionCount,
      inputCount: structure.inputCount,
      dsComponentCount: structure.dsComponentCount,
      trackedComponentCount: structure.trackedComponentCount,
      untrackedButtonCount: structure.untrackedButtonCount,
      untrackedFormCount: structure.untrackedFormCount,
      dsReadiness: structure.dsReadiness,

      components: components,

      viewportWidth: device.viewportWidth,
      viewportHeight: device.viewportHeight,
      deviceType: device.deviceType,
      loadTimeMs: performanceData.loadTimeMs,
      domReadyTimeMs: performanceData.domReadyTimeMs,
      navigationType: performanceData.navigationType
    };

    try {
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-ds-public-key": config.publicKey || ""
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {
        if (config.debug) console.warn("[DS Studio Connect] Failed to send heartbeat.");
      });
    } catch (error) {
      if (config.debug) console.warn("[DS Studio Connect] Error:", error);
    }

    window.__DS_STUDIO_CONNECT__ = {
      status: "connected",
      version: VERSION,
      payload: payload,
      ping: function () { send(config); }
    };

    if (config.debug) console.log("[DS Studio Connect] heartbeat", payload);
  }

  function init(options) {
    var config = options || {};
    var delay = typeof config.delay === "number" ? config.delay : 900;

    function run() {
      window.setTimeout(function () { send(config); }, delay);
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }
  }

  window.DSStudioConnect = { init: init, version: VERSION };
})();
