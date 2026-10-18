# Opportunity Change History

## Integration point

The history drawer opens from a deal row in the existing **Cơ hội & Hợp đồng** tab of `src/pages/Customer360Dashboard.tsx`. It reuses the shared Drawer and does not add a route or sidebar item.

## Files

- `components/OpportunityHistoryDrawer.tsx`: drawer UI, date/field filters, loading, empty, error and retry states.
- `hooks/useOpportunityHistory.ts`: request lifecycle and typed state.
- `services/OpportunityHistoryService.ts`: isolated mock service adapter.
- `types/OpportunityHistory.types.ts`: entry and filter types.
- `utils/opportunityHistory.ts`: chronological sorting, filtering and value formatting.
- `styles/OpportunityHistoryDrawer.module.css`: responsive, token-based styles.
- `index.ts`: exports the integration component.
- Integration change: `src/pages/Customer360Dashboard.tsx` adds a per-deal action to open the drawer; no router, sidebar, or backend files are changed.

## API and mock mode

The repository currently has `GET /api/v1/audit-logs`, but it cannot filter by `target_id`; there is no verified opportunity-history endpoint, and deal updates are not verified to write audit records. The feature therefore does **not** call that system-wide endpoint and is currently wired explicitly to `MockOpportunityHistoryService` in `services/OpportunityHistoryService.ts`.

The drawer always displays:

> DEVELOPMENT MOCK DATA — Dữ liệu giả lập, không phải lịch sử thực tế từ hệ thống.

The displayed entries are illustrative fixtures attached to the selected opportunity ID for UI development. They do not represent actual recorded changes. There is no production/API mode or automatic fallback: a real integration must be explicitly added when the backend contract and audit-write behavior are confirmed.

## Validation

Validation run from `frontend/`:

- `npm run typecheck` — passed.
- `npm run build` — passed; Vite reported a bundle-size warning for a minified chunk larger than 500 kB.
- Focused utility smoke check — passed for chronological ordering, null/blank values, missing timestamps, currency, and stage labels.

Browser smoke validation used a Playwright-intercepted Customer 360 fixture because the local backend returned 404 for `/customers/cust-01/360`. It verified the history drawer, actor and before/after values, newest-first ordering, field/date filters, empty-filter state, dark theme, and layout at 360px and 1440px. The request-error/retry branch was not triggered because the mock adapter does not intentionally fail.

No automated test or lint script is currently defined in `package.json`.

## Known limitations

- History is mock-only; field values, actors, and timestamps are not fetched from or persisted by the backend.
- Retry and request-error handling are implemented, but the mock adapter does not intentionally fail.
- No actual opportunity-specific audit authorization or data scope can be confirmed until the backend provides a scoped history API.
