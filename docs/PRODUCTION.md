# Production Readiness

This repository is a strong application foundation, but its local defaults are not a substitute for production infrastructure. Complete and record each decision below before deployment.

## Identity and secrets

- Generate a unique high-entropy `AUTH_SECRET` per environment.
- Remove or rotate the seeded administrator password before any shared deployment.
- Store model keys, OAuth secrets, and database credentials in the platform secret manager.
- Register exact HTTPS OAuth callback URLs for every environment.
- Restrict trusted hosts and redirects to owned origins.
- Establish a documented key and secret rotation process.

## Database and migrations

- Replace SQLite before horizontal scaling or other concurrent production workloads.
- Select a managed database supported by the deployment runtime and update the Prisma datasource deliberately.
- Convert and test migrations against a production-like copy of data.
- Back up the database, define retention, and test restoration.
- Review indexes against actual query and ordering paths.
- Run migrations as a controlled release step, not opportunistically from every application instance.

## Distributed runtime

- Replace the in-memory rate limiter with a shared store before running multiple instances.
- Validate that session revocation and activity updates remain consistent under concurrency.
- Configure request, response, and upstream-model timeouts.
- Set body-size and streaming limits at the application and proxy layers.
- Verify that the deployment runtime supports every Node.js dependency used for PDF, Word, authentication, Prisma, and model streaming.

## Application security

- Enforce HTTPS and secure cookies.
- Add a Content Security Policy tailored to the final hosting and OAuth requirements.
- Keep security headers in `next.config.ts` and validate them at the edge.
- Review authorization for every new route and service.
- Log administrative and destructive actions with actor, target, outcome, and timestamp.
- Avoid logging prompts, model responses, tokens, credentials, password material, or unnecessary personal data.
- Run dependency, secret, and source scanning in CI.
- Define data retention and deletion policies for chats, identities, sessions, and audit records.

## Reliability and observability

- Add structured server logs with request correlation IDs.
- Monitor authentication failures, rejected authorizations, model latency/errors, route error rates, and database saturation.
- Add health and readiness checks appropriate to the hosting platform.
- Define alerts, incident ownership, escalation, rollback, and status communication.
- Test degraded behavior when the model provider, OAuth provider, or database is unavailable.

## Delivery pipeline

At minimum, CI should install from the lockfile and run:

```bash
npm run db:generate
npm run typecheck
npm run lint
npm run test
npm run build
```

Use protected environments for migrations and deployment. Build one immutable artifact, promote that artifact between environments, and keep production secrets out of build logs.

## Release checklist

- [ ] Product configuration and metadata are final.
- [ ] Default credentials are removed or rotated.
- [ ] Production database and migrations are tested.
- [ ] Shared rate limiting is configured.
- [ ] OAuth origins and callbacks are exact.
- [ ] HTTPS, cookies, trusted hosts, CSP, and security headers are verified.
- [ ] Backups and restore procedures are tested.
- [ ] Logs, metrics, alerts, and incident ownership are active.
- [ ] Privacy, retention, deletion, and audit requirements are documented.
- [ ] Typecheck, lint, tests, build, and smoke tests pass.
- [ ] Rollback steps are rehearsed.

Security, compliance, availability, and privacy requirements vary by organization and jurisdiction. Have the appropriate internal owners review the final system rather than treating this checklist as certification.
