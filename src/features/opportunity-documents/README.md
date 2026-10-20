# Opportunity Documents

## Integration Point

The documents drawer opens from a deal row in the existing **Cơ hội & Hợp đồng** tab (Tab 2) of `src/pages/Customer360Dashboard.tsx`. It reuses the shared `Drawer`, `Button`, `EmptyState`, and `LoadingSkeleton` components and does not add a route or sidebar item.

`opportunityId` is the `deal.id` value already loaded by Customer 360.

## Files

- `components/OpportunityDocumentsDrawer.tsx`: Drawer UI with drag-and-drop multiple file uploader, document listing, metadata display, loading, empty, error/retry states, and permission-aware download action.
- `hooks/useOpportunityDocuments.ts`: Custom hook managing document lifecycle, multi-file upload processing, isolated per-file error handling, download triggers, and typed states.
- `services/OpportunityDocumentsService.ts`: Isolated service adapter with `MockOpportunityDocumentsService` and unconfigured API placeholder (`UnconfiguredOpportunityDocumentsApiService`).
- `mocks/opportunityDocuments.mock.ts`: In-memory session store (`Map<string, IMockDocumentRecord>`) with initial seeds for `deal-101` and explicit mock mode warning text.
- `types/OpportunityDocuments.types.ts`: Strict TypeScript interfaces, error code types, upload result DTOs, and constants (no `any`).
- `utils/opportunityDocuments.ts`: Pure functions for size validation (20 MB), extension whitelisting, timestamp formatting (vi-VN), size formatting, and error normalization.
- `styles/OpportunityDocumentsDrawer.module.css`: Token-based CSS Module supporting Light/Dark themes and responsive layout down to 360px.
- `index.ts`: Public exports for the feature module.
- Integration change: `src/pages/Customer360Dashboard.tsx` adds a "Tài liệu" button per deal row opening the drawer; no sidebar, router, or backend files are changed.

## Assumptions & Rules

- **Maximum file size:** **20 × 1024 × 1024 bytes** (20 MB) per file. This is a Frontend-enforced rule until Backend confirms the multipart limit.
- **Allowed extensions:** `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.png`, `.jpg`, `.jpeg`.
- **Download authorization:** Controlled via `document.canDownload` from service and `hasPermission('manage_deals')` from `useAuthorization`. It is **not** a guarantee of security; true authorization and data scoping must be enforced by Backend.
- **Independent multi-file uploads:** If one file is oversized or fails validation, other valid files in the same batch are still processed and added successfully.

## Mock Mode

`USE_MOCK_OPPORTUNITY_DOCUMENTS` in `services/OpportunityDocumentsService.ts` defaults to `true` because no opportunity-document API was found in the Frontend survey.

- Files live in memory for the current browser session only.
- They are not written to `localStorage`, disk, or Backend.
- Download uses a temporary `blob:` object URL created at click time, then immediately revoked.
- Filename tokens for testing error states:
  - `network-error`: simulates simulated network error.
  - `forbidden`: simulates 403 Forbidden rejection.
  - Prefix `restricted-`: sets `canDownload: false` to test restricted UI.

The drawer always displays:

> MOCK MODE — dữ liệu giả, không đại diện cho dữ liệu thật của team. Tệp không được lưu trên Backend.

Set `USE_MOCK_OPPORTUNITY_DOCUMENTS = false` only after a Backend contract exists. The non-mock adapter refuses to invent fake endpoints.

## Validation

- `npm run typecheck` — passed with 0 errors.
- `npm run build` — passed.
- Theme validation: Dark mode (`[data-theme='dark']`) and Light mode tokens tested.
- Viewport validation: Responsive down to 360px via CSS flex/grid and media queries.
