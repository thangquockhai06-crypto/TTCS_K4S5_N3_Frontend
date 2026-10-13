# Lead Routing Configuration

Authenticated route: `/lead-routing-configuration`. The route is available to sales managers, team leaders, and existing admin/director roles. Lead assignment controls are limited to users with an existing leadership role and `manage_deals` permission.

## Current implementation

The frontend repository does not contain a lead-routing rules API or a manual-assignment queue API contract. This feature therefore uses a separate development-only in-memory mock service in `services/LeadRoutingService.ts`. The mock is selected only in Vite development mode, where the UI displays this warning:

> DEVELOPMENT MOCK DATA — No real lead assignment is being executed.

Rules, their priority, status changes, and manual assignments are simulated in browser memory and are lost when the page is reloaded. The sample queue, timing, and assignment outcomes are not production statistics. No background matching, Round Robin execution, server persistence, or five-minute SLA is operational. The five-minute target is a display/triage aid computed from a valid `receivedAt` value; it is not an SLA guarantee. Production builds do not use mock data; they show an explicit unavailable/API integration error until production API contracts are connected.

Master-data options reuse the existing customer-industry samples, user/team types, available team groups, and active sales-user seed records. Region options reflect the geographic groups already represented in the frontend. Replace these sample sources with the authorized production master-data APIs when those contracts are available.

## Integration and API work needed

The feature exports its page and public model types from `index.ts`. `routes/AppRoutes.tsx` registers the authenticated route and `components/layout/Sidebar.tsx` exposes a manager-visible navigation item.

To connect production data, replace the mock adapter with documented API contracts for listing/upserting rules, toggling rules, persisting/retrieving priority order, fetching the manual-assignment queue and its statuses/reasons/timestamps, and manually assigning a lead. Use the existing `axiosInstance` and standard response/error handling. Provide authorized region, industry, team, and employee data as part of those contracts or from existing master-data APIs. Do not enable this mock adapter as a production fallback.
