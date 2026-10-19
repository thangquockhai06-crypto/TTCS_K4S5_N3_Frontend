# Opportunity Search & Filter

## Integration

The filters are integrated into the existing Deal Kanban page at
`src/pages/DealPipelinePage.tsx`. The page is registered at `/opportunities` in
`src/routes/AppRoutes.tsx` and linked from the dashboard quick-access modules;
no sidebar item or separate Opportunity CRUD module is added.

The existing `DealPipeline` component, shared `SearchBar`, `Drawer`, `Button`,
and the application theme tokens are reused.

## Supported filters

- Sales stage
- Minimum and maximum opportunity value
- Expected close-date range
- Product
- Opportunity owner
- Apply, clear individual active conditions, and reset all advanced conditions
- Named saved filters, scoped to the signed-in user in this browser

Invalid negative/non-numeric values, minimums above maximums, malformed dates,
and start dates after end dates are rejected before applying.

## Data and persistence limitations

The existing Kanban page reads `INITIAL_DEALS` from `CRMDataContext`; it is a
fixed frontend demo dataset, not a backend Opportunity API response. This page
therefore displays the warning:

> DEVELOPMENT MOCK DATA — Dữ liệu giả lập, không phải dữ liệu thực từ hệ thống

Product associations in `mocks/opportunityProducts.mock.ts` are illustrative
demo-only mappings. They must not be treated as real CRM associations.

The backend exposes `GET /opportunities` with `search` and `stage` parameters,
but its response does not contain product identifiers and the endpoint does
not advertise pagination or value/date/owner filters. The existing Kanban cards
also expect fields absent from the Opportunity response. This feature does not
call that API, does not load an unbounded response for client-side filtering,
and does not fall back to mock data on API errors. Real-data integration needs
a confirmed paginated API response that contains the necessary owner, product,
close-date, customer-display, and Kanban-stage information.

Saved filters use `localStorage` under a key namespaced by the authenticated
user ID. They remain only in the current browser profile, are not synchronized
across devices, and are not stored on the backend. Storage errors are shown in
the filter drawer.

## Verification

The repository currently defines `npm run typecheck` and `npm run build`.
There is no frontend lint or automated test script configured in
`package.json`.
