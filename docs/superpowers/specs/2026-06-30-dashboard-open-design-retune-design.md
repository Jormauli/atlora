# Atlora Dashboard Open Design Retune

## Goal

Unify the signed-in Atlora dashboard with the public home and authentication visual direction without changing the dashboard workflow.

The dashboard should read as the same product as the current open design: neutral black and graphite surfaces, white foreground text, restrained borders, and small spectral accents. The change is visual and ergonomic, not architectural.

The finished result must hold online, not only in a local desktop preview. Production or preview validation must cover PC, mobile, and intermediate responsive widths so the user sees one coherent Atlora product across signed-out entry, authentication, dashboard, and secondary signed-in pages.

## Selected Direction

Use direction B from the review mockup: retune the existing dashboard layout and components to the open design palette.

This is the lowest-cost path because the current dashboard already supports the core user job: scan saved cards, search, filter by observation view, sort, open details, and create new material. There is no evidence yet that the information architecture is the blocker. The visible problem is that the signed-in product still carries the older dark-green system while the public and auth surfaces have moved toward a black, gray, and white Atlora identity.

## Visual Contract

The dominant palette is:

- Page base: near black, aligned with the public spectral surface.
- Panels and cards: neutral graphite surfaces.
- Borders: neutral gray, visible but quiet.
- Primary text: off-white.
- Secondary text: warm or neutral gray.
- Accents: mineral blue `#4f6f8f`, amber `#b48745`, and brick red `#9a554b`, used sparingly for role/category signals, status details, and destructive states where appropriate.

The old pale-green action color and green-tinted surfaces should not remain the dominant dashboard signal. Green may appear only if it is tied to a content-view tone and presented as a small accent, not as the overall product theme.

## Scope

Retune these signed-in surfaces together:

- `DashboardWorkspace`: page background, sidebar, header, search controls, sort controls, and primary new-card action.
- `RoleFilterBar`: keep single-select behavior, but move from large color-dominant circles to neutral controls with small spectral or content-view signals.
- `KnowledgeCard`: keep fixed card dimensions and opening behavior, but use neutral surfaces and borders. Category or perspective tone should appear as a small marker or top edge, not as the entire card identity.
- `CardDetailModal`: keep the reader animation, delete flow, edit link, and source link. Retune the panel, section blocks, tags, and footer actions to the same neutral system.
- `AppShellClient`: align shared signed-in shell pages such as `/new`, `/usage`, and `/settings` so they do not feel like a different application from `/dashboard`.
- Existing local recent-observation title fix: preserve two-line scanning and native title tooltip.

## Out of Scope

- Changes to routes, authentication, database schema, card data shape, or API contracts.
- Changes to WeChat ingestion, Cloud Run, Cloud Tasks, LLM orchestration, or generated card validation.
- Reworking dashboard information architecture, navigation model, card density, or modal interaction model.
- Adding a new design-system package or broad component abstraction before the visual retune proves the need.
- Adding decorative hero elements, marketing content, or heavy animation to signed-in working surfaces.

## Component Behavior

Dashboard behavior remains unchanged:

- Search query state is shared between the sidebar and toolbar inputs.
- Role filtering remains single-select plus `all`.
- Sort remains newest or oldest.
- Opening a card still derives the origin rectangle for the reader transition.
- Deleting a card still removes it from local visible state after a successful API response.
- Language switching remains global and available.

The retune must preserve responsive behavior. Desktop keeps the current left sidebar. Mobile and smaller widths must not introduce horizontal overflow or text overlap.

Responsive states are part of the visual contract, not a secondary polish pass:

- PC width must keep the full signed-in workspace visually aligned with the public open design.
- Mobile width must remain a first-class layout, not a compressed desktop afterthought.
- Intermediate widths must not show a mixed state where some surfaces use the open design and others retain the old green dashboard treatment.
- Shared controls such as language switching, new-card actions, search, sort, role filters, cards, and modals must preserve one palette and spacing rhythm as they wrap or collapse.

## Accessibility And Readability

- Text contrast must remain readable on every retuned surface.
- Focus rings must be visible against near-black backgrounds.
- Buttons and links must keep clear hover and focus states.
- Text inside buttons, segmented controls, selects, badges, and icon-label actions must be visually centered and balanced in both Chinese and English.
- Controls must use stable height, padding, line-height, and flex alignment so labels do not sit high, low, or off-center after language changes.
- Recent observation titles allow two-line scanning and expose the full title through the `title` attribute.
- Fixed-height dashboard cards must not resize when hovered, focused, or populated with long translated text.
- Long labels must wrap, truncate, or resize according to the control type instead of clipping, overlapping icons, or shifting adjacent controls.

## Testing

Add focused structural tests that lock the visual contract without snapshotting implementation noise:

- Dashboard/source tests should assert the presence of the spectral accent values and neutral graphite surface values.
- Tests should prevent reintroducing the old green-dominant action/surface treatment as the primary dashboard styling.
- Existing tests for single-select role filtering, local card deletion, language switch exposure, localized labels, and two-line recent titles must continue to pass.
- Modal tests should continue to cover the delete flow, edit link, and source behavior.
- Browser QA must catch visual alignment defects that source tests cannot prove, including button text not being vertically centered, segmented-control labels drifting from center, icon-label pairs looking unbalanced, and wrapped labels colliding with neighboring UI.

## Verification

Run:

- `npm test -- src/components/dashboard-workspace.test.ts src/components/dashboard/card-detail-modal.test.ts src/app/shell-design.test.ts`
- `npx tsc --noEmit`

Then verify locally in the browser:

- `/dashboard` at PC, mobile, and at least one intermediate responsive width.
- `/new`, `/usage`, and `/settings` at PC and mobile widths for shared shell consistency.
- Card detail modal open, close, edit, source, and delete-confirm states.
- Chinese and English UI text for overflow in controls and cards.

Before treating the work as ready for release, verify the same visual contract on an online preview or production-equivalent deployment:

- PC viewport: dashboard, new-material page, and card detail modal all use the open design palette without old green-dominant surfaces.
- Mobile viewport: dashboard, navigation access, filters, card list, and detail modal remain usable and visually consistent.
- Responsive transition widths: resizing between mobile and desktop does not expose broken spacing, horizontal overflow, clipped controls, or mixed old/new visual systems.
- Component alignment: buttons, language/segmented controls, selects, search inputs, cards, badges, and modal action rows have centered text, balanced icon spacing, and no visibly off-center labels.
- Chinese and English UI both remain readable online.

Production deployment remains a separate approval decision, but local-only visual checks are not sufficient for final acceptance.
