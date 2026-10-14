(() => {
  const MIXPANEL_TOKEN = "a3a7311474fc0c6026d88f512ebbc0a4";
  const CONSENT_KEY = "muflah-analytics-consent";
  const consentBanner = document.getElementById("analytics-consent");

  const readConsent = () => {
    try {
      return window.localStorage.getItem(CONSENT_KEY);
    } catch (_) {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (_) {
      // Analytics still works for this visit when browser storage is unavailable.
    }
  };

  const loadMixpanel = () => {
    if (window.mixpanel) return Promise.resolve(window.mixpanel);

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
      script.async = true;
      script.onload = () => {
        window.mixpanel.init(MIXPANEL_TOKEN, {
          track_pageview: true,
          persistence: "localStorage",
          autocapture: false
        });
        resolve(window.mixpanel);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const trackClicks = (mixpanel) => {
    document.querySelectorAll("[data-mixpanel-event]").forEach((element) => {
      element.addEventListener("click", () => {
        const properties = { link_url: element.href };
        if (element.dataset.mixpanelPlacement) properties.placement = element.dataset.mixpanelPlacement;
        mixpanel.track(element.dataset.mixpanelEvent, properties);
      });
    });
  };

  const enableAnalytics = () => {
    saveConsent("granted");
    consentBanner.hidden = true;
    loadMixpanel().then((mixpanel) => {
      mixpanel.track("analytics_consent_granted");
      trackClicks(mixpanel);
    }).catch(() => {});
  };

  const disableAnalytics = () => {
    saveConsent("denied");
    consentBanner.hidden = true;
  };

  window.addEventListener("muflah-analytics-consent", (event) => {
    if (event.detail === "granted") enableAnalytics();
    if (event.detail === "denied") disableAnalytics();
  });

  const consent = readConsent();
  if (consent === "granted") {
    loadMixpanel().then(trackClicks).catch(() => {});
  } else if (consent !== "denied") {
    consentBanner.hidden = false;
  }
})();
