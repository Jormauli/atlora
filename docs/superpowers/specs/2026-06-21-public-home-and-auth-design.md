# Atlora Public Home and Authentication Design

## Goal

Give invited MVP testers enough context to understand Atlora before registration, while keeping the path into the product short. Align login and registration with the existing dark Atlora visual system.

## Audience

The public entry point targets invited test users. It is not a full marketing website and does not need pricing, testimonials, long-form product education, or multiple content sections.

## Access Flow

- An unauthenticated visitor opening `/` sees the public introduction page.
- The primary call to action, `Start exploring`, links to `/register`.
- The secondary call to action and top navigation login link go to `/login`.
- An authenticated visitor opening `/` is redirected to `/dashboard`.
- Successful registration continues to `/onboarding`.
- Successful login continues to `/dashboard`.

## Public Home

The page uses the approved one-screen product explanation layout.

Content hierarchy:

1. Brand: `Atlora / Knowledge Starfield`.
2. Headline: turn what the user reads into knowledge that belongs to them.
3. Supporting copy: accept links, text, and images, then extract summaries, claims, evidence, and actions.
4. Three capability summaries: multi-source capture, structured extraction, and role-based action.
5. Primary registration action and secondary login action.

The visual treatment uses the current dark green-black palette, restrained borders, and a lightweight planet and orbit composition. It must not add a remote image dependency, animation framework, or heavy client-side effect.

The first viewport must contain the complete proposition and both actions on common desktop and mobile sizes. The page may reflow vertically on mobile but must not require reading a long marketing page before registration.

## Authentication Pages

Login and registration use the approved centered dark form layout.

- A shared authentication frame owns the brand link, language switch, dark page background, panel styling, and return-to-home action.
- Login and registration keep separate forms and existing API behavior.
- Inputs use a dark surface with visible focus, placeholder, and error states.
- The primary action uses the existing pale green accent.
- The desktop and mobile layout remains a single column.
- Login and registration link to each other below the form.
- Submit controls show a pending state and prevent repeat submission.
- Errors remain inside the form and must not cause major layout movement.

## Language Behavior

The public home and authentication pages use the existing root `LanguageProvider` and persisted language preference.

- Interface copy switches globally between Chinese and English.
- The language switch remains available on the public home, login, and registration pages.
- User-generated content is unaffected.
- Internal routing and authentication behavior do not depend on the selected language.

## Component Boundaries

- The root page performs the current-user check and renders either a redirect or the public home.
- A public-home client component consumes localized copy and renders the approved layout.
- A shared authentication frame provides visual structure only and does not own form submission.
- Login and registration pages retain their own request, validation, error, and redirect logic.
- Localized copy is added to the existing language dictionary rather than embedded in page components.

## Compatibility

No database, Prisma schema, API contract, session format, onboarding behavior, or deployment environment variable changes are required. The change must remain compatible with the current Vercel and Neon deployment.

## Verification

- Unit or structural tests cover public-home actions, localized copy, and shared authentication styling.
- Existing authentication behavior remains covered by the current test suite.
- `npm test` and `npm run build` must pass.
- Browser verification covers `/`, `/login`, and `/register` in Chinese and English.
- Browser verification covers desktop and mobile layouts, focus states, pending states, and error visibility.
- An authenticated request to `/` must redirect to `/dashboard`.

## Out of Scope

- Pricing, testimonials, blog content, analytics dashboards, invitation-code enforcement, social login, password reset, email verification, and animated 3D starfields.
- Changes to card generation, onboarding choices, dashboard behavior, or content translation.
