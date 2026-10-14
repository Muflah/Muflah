(() => {
  const MIXPANEL_TOKEN = "a3a7311474fc0c6026d88f512ebbc0a4";
  const CONSENT_KEY = "muflah-analytics-consent";
  const consentBanner = document.getElementById("analytics-consent");

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
    localStorage.setItem(CONSENT_KEY, "granted");
    consentBanner.hidden = true;
    loadMixpanel().then((mixpanel) => {
      mixpanel.track("analytics_consent_granted");
      trackClicks(mixpanel);
    }).catch(() => {});
  };

  const disableAnalytics = () => {
    localStorage.setItem(CONSENT_KEY, "denied");
    consentBanner.hidden = true;
  };

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === "granted") {
    loadMixpanel().then(trackClicks).catch(() => {});
  } else if (consent !== "denied") {
    consentBanner.hidden = false;
    document.getElementById("analytics-accept").addEventListener("click", enableAnalytics);
    document.getElementById("analytics-reject").addEventListener("click", disableAnalytics);
  }
})();
