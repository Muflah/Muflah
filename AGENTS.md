# Analytics Tracking — Mixpanel

This project uses Mixpanel as its only product analytics tool.

## Implementation

- Platform: static website
- SDK: Mixpanel Browser JavaScript SDK loaded from `https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js`
- Initialization: `assets/js/mixpanel.js`
- Project token: stored in `assets/js/mixpanel.js` as a public browser token
- Consent: initialization is delayed until the visitor chooses “Allow analytics”; consent state is stored in local storage
- Identity: anonymous tracking only; this site has no authentication flow, so do not add `identify`, `people.set`, or `reset` without a stable account ID and an approved identity plan

## Tracking plan

| Event | Trigger | Properties |
| --- | --- | --- |
| `analytics_consent_granted` | Visitor opts into analytics | none |
| Mixpanel automatic page-view event | Mixpanel automatic page view tracking after consent | Mixpanel defaults |
| `meeting_booking_clicked` | Visitor clicks a Calendly CTA | `link_url`, `placement` (`hero` or `contact`) |
| `resume_viewed` | Visitor clicks the resume link | `link_url` |
| `friink_link_clicked` | Visitor clicks the Friink project link | `link_url` |

Use snake_case names, stable event meanings, and flat properties. Add new events in `assets/js/mixpanel.js` and document them in this table before shipping.
