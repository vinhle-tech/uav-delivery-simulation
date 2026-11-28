# Phase 3 — Day 2 Authentication regression

Record actual observed results. Do not replace NOT RUN until verified locally.

| Suite | Expected | Actual |
|---|---|---|
| Simulation Core | 22/22 | NOT RUN |
| Device State + Flight Sync | 22/22 | NOT RUN |
| Database constraints | 2/2 | NOT RUN |
| Password + Auth DB + Auth Service + JWT + Middleware + Socket Auth | 29/29 | NOT RUN |
| Auth Client | 8/8 | NOT RUN |
| Auth business regression (includes Mission Flow and socket events) | 12/12 groups | NOT RUN |
| Auth API OPERATOR | 7/7 groups | NOT RUN |
| Auth API ADMIN | 7/7 groups | NOT RUN |
| Protected API OPERATOR | 7/7 groups | NOT RUN |
| Protected API ADMIN | 7/7 groups | NOT RUN |
| Migration rerun | SKIP / PASS | NOT RUN |
| Client build | PASS | NOT RUN |
| MQTT + ESP32 online | PASS | NOT RUN |
| Authenticated delivery | PASS | NOT RUN |
| Low battery before start / in flight | PASS | NOT RUN |
| Loss of Wokwi heartbeat | PASS | NOT RUN |
| Logout and independent browser tabs | PASS | NOT RUN |
| Token refresh during session | PASS | NOT RUN |

## Known limitations
- Local development only. No production hardening or device-side JWT.
- Memory-only browser tokens: reload requires login, closing a tab does not revoke server session.
- UAV-01 Flight Sync memory and PostgreSQL business mission remain distinct; legacy business order stays ASSIGNED after completion.
- UAV-02 local simulation state is not persistent across unmount.
- New regression is an authenticated replacement workflow, not identical old test coverage.

## Evidence and issues
Record date, test outcomes and error codes only. Never record raw tokens, credentials or .env contents.
