(() => {
  const MIXPANEL_TOKEN = "a3a7311474fc0c6026d88f512ebbc0a4";
  const CONSENT_COOKIE = "muflah_analytics_consent";
  const CONSENT_STORAGE_KEY = "muflah-analytics-consent";
  const consentBanner = document.getElementById("analytics-consent");
  let mixpanelSdkPromise;

  const hideConsentBanner = () => {
    consentBanner.hidden = true;
    consentBanner.style.setProperty("display", "none", "important");
  };

  const readCookie = () => {
    const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${CONSENT_COOKIE}=`));
    return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
  };

  const saveCookie = (value) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
  };

  const readConsent = () => {
    const cookieConsent = readCookie();
    if (cookieConsent) return cookieConsent;
    try {
      return window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (_) {
      return null;
    }
  };

  const saveConsent = (value) => {
    saveCookie(value);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch (_) {
      // The consent cookie is sufficient when browser storage is unavailable.
    }
  };

  const loadMixpanel = () => {
    if (mixpanelSdkPromise) return mixpanelSdkPromise;

    mixpanelSdkPromise = new Promise((resolve, reject) => {
      const mixpanel = window.mixpanel = window.mixpanel || [];
      mixpanel._i = mixpanel._i || [];
      mixpanel.__SV = mixpanel.__SV || 1.2;
      mixpanel.init = mixpanel.init || ((token, config, name) => {
        mixpanel._i.push([token, config, name]);
      });

      const script = document.createElement("script");
      script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
      script.async = true;
      script.onload = () => {
        try {
          window.mixpanel.init(MIXPANEL_TOKEN, {
            track_pageview: true,
            persistence: "localStorage",
            autocapture: false
          });
          if (typeof window.mixpanel.track !== "function") {
            throw new Error("Mixpanel SDK loaded without exposing track()");
          }
          resolve(window.mixpanel);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return mixpanelSdkPromise;
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
    hideConsentBanner();
    loadMixpanel().then((mixpanel) => {
      mixpanel.track("analytics_consent_granted");
      trackClicks(mixpanel);
    }).catch((error) => console.error("Mixpanel initialization failed:", error));
  };

  const disableAnalytics = () => {
    saveConsent("denied");
    hideConsentBanner();
  };

  window.addEventListener("muflah-analytics-consent", (event) => {
    if (event.detail === "granted") enableAnalytics();
    if (event.detail === "denied") disableAnalytics();
  });

  const consent = readConsent();
  if (consent === "granted") {
    loadMixpanel().then(trackClicks).catch((error) => console.error("Mixpanel initialization failed:", error));
  } else if (consent !== "denied") {
    consentBanner.hidden = false;
  }
})();
