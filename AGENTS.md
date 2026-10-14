# Analytics Tracking — Mixpanel

This project uses Mixpanel as its only product analytics tool.

## Implementation

- Platform: static website
- SDK: Mixpanel Browser JavaScript SDK loaded from `https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js`
- Initialization: inline standard Mixpanel snippet in `index.html`
- Project token: stored in the inline browser snippet in `index.html` as a public browser token
- Project region: EU; events use `https://api-eu.mixpanel.com`
- Consent: no custom consent gate is implemented; this is the standard Mixpanel setup for experimentation
- Identity: anonymous tracking only; this site has no authentication flow, so do not add `identify`, `people.set`, or `reset` without a stable account ID and an approved identity plan

## Tracking plan

| Event | Trigger | Properties |
| --- | --- | --- |
| Mixpanel autocapture events | Mixpanel captures page and interaction activity | Mixpanel defaults |

Use snake_case names, stable event meanings, and flat properties. If explicit custom events are added later, document them in this table before shipping.
