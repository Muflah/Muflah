# Authentication Implementation Instructions

These instructions apply to work inside `auth/`. This is a standalone experiment for a reusable authentication and session system, not authentication for the root website.

## Scope

- Keep the reusable core independent of any one product, website, framework, or analytics provider.
- Keep product-specific adapters and integrations separate from the core authentication and session logic.
- Treat the initial scope in `README.md` as the baseline: risk-based OTP, login and signup, account switching, multi-session support, JWTs, and domain-wide cookies from the `auth` subdomain.
- Treat this as a self-hosted service built on Better Auth, not as a library copied into each product.
- Keep the Better Auth integration boundary separate from the reusable implementation and policy boundary.
- Keep the initial Better Auth baseline limited to email/password signup and login until the next module is explicitly scoped.
- Expose language-agnostic HTTP/JSON contracts; do not make product clients depend on internal Better Auth routes.
- Keep the direct-access interface server-rendered and minimal; do not turn it into a product dashboard or duplicate product UI.
- Prefer unversioned, additive API evolution. Introduce a versioned route only for an unavoidable breaking change.
- Design every deployment for rolling-release compatibility: old and new instances, schemas, cookies, JWT claims, and API clients may overlap during rollout.
- Do not expand the first version into social login, federation, product authorization, billing, or organization management without updating the documented scope first.
- Treat roles, permissions, memberships, and policy checks as application-owned concerns; do not add product authorization claims or policy storage to the auth service.
- Update `README.md` when architecture, setup, or security behavior changes.
- Update `CHANGELOG.md` for every user-visible or security-relevant change.

## Security

- Never commit credentials, private keys, access tokens, session secrets, or real user data.
- Treat all redirect URLs, callback parameters, tokens, and user-provided fields as untrusted input.
- Treat parent-domain cookies as a deliberate trust-boundary decision; only approved subdomains may rely on them.
- Use secure, expiring sessions and avoid storing sensitive tokens in browser-readable storage unless the approved design explicitly requires it.
- Keep JWT claims minimal, define key rotation before production use, and document access-token expiry and revocation behavior.
- Enforce OTP expiry, one-time use, retry limits, resend limits, and abuse controls independently of risk scoring.
- Preserve compatibility during rolling releases with expand-and-contract database migrations and additive contract changes.
- Keep authentication forms accessible, responsive, and safe for users without client-side JavaScript where practical.
- Do not weaken authentication or authorization checks to make local development easier.
- Document security-sensitive assumptions and provider-specific behavior before implementation.

## Analytics and identity

The root project uses Mixpanel for anonymous website analytics. Do not couple this reusable experiment to Mixpanel or any other product analytics provider. If a future product adds analytics, it must integrate through an explicit adapter and follow that product's approved identity plan.

## Verification

Before considering an auth change complete, verify the affected success and failure paths, session expiry behavior, redirect handling, and secret/configuration hygiene.

