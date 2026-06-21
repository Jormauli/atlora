# Public Home and Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a concise public Atlora home page for invited testers and align login and registration with the dark Atlora visual system.

**Architecture:** Keep the root page as a server component that checks the current session and redirects authenticated users. Render a focused client-side public home for unauthenticated users, and share authentication layout through a presentational `AuthFrame` while leaving login and registration requests independent.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Node test runner, existing language provider.

---

### Task 1: Lock the public entry and authentication contracts with tests

**Files:**
- Create: `src/app/public-entry.test.ts`
- Modify: `src/lib/language.test.ts`

- [ ] **Step 1: Write the failing structural tests**

Add assertions that `src/app/page.tsx` renders `PublicHome` for guests while retaining the dashboard redirect, that the home component contains `/register` and `/login` actions, and that login and registration import `AuthFrame` without `bg-white`.

```ts
test("public entry introduces Atlora before registration", () => {
  const rootPage = readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
  const publicHome = readFileSync(path.join(root, "src/components/public-home.tsx"), "utf8");
  assert.ok(rootPage.includes("redirect(\"/dashboard\")"));
  assert.ok(rootPage.includes("<PublicHome />"));
  assert.ok(publicHome.includes('href="/register"'));
  assert.ok(publicHome.includes('href="/login"'));
});

test("authentication pages share the dark Atlora frame", () => {
  for (const file of ["src/app/login/page.tsx", "src/app/register/page.tsx"]) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.ok(source.includes("AuthFrame"));
    assert.ok(!source.includes("bg-white"));
  }
});
```

- [ ] **Step 2: Add failing language contract assertions**

Assert that both dictionaries expose `publicHome` strings and authentication pending labels.

```ts
assert.equal(uiCopy.zh.publicHome.primaryAction, "开始体验");
assert.equal(uiCopy.en.publicHome.primaryAction, "Start Exploring");
assert.equal(uiCopy.zh.auth.registering, "注册中...");
assert.equal(uiCopy.en.auth.loggingIn, "Logging in...");
```

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: FAIL because `PublicHome`, `AuthFrame`, and the new copy do not exist.

### Task 2: Implement the public home and localized copy

**Files:**
- Create: `src/components/public-home.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/language.ts`

- [ ] **Step 1: Add localized public-home and pending-state copy**

Add one matching `publicHome` object to each language dictionary with eyebrow, headline, description, three capability labels/details, primary action, secondary action, and login navigation text. Add `loggingIn` and `registering` to each `auth` object.

- [ ] **Step 2: Render the approved one-screen public home**

Implement a client component that consumes `useLanguage`, renders the brand header and `LanguageToggle`, uses direct links to `/register` and `/login`, and displays a CSS-only planet/orbit composition. Keep the content constrained to the first desktop viewport and allow natural vertical flow on mobile.

- [ ] **Step 3: Preserve authenticated root behavior**

Replace the guest login redirect with:

```tsx
const user = await getCurrentUser();
if (user) redirect("/dashboard");
return <PublicHome />;
```

- [ ] **Step 4: Run the focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts`

Expected: public-entry and language tests PASS except authentication-frame assertions pending Task 3.

### Task 3: Implement the shared dark authentication frame

**Files:**
- Create: `src/components/auth-frame.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`

- [ ] **Step 1: Create the shared presentational frame**

Render the Atlora brand linked to `/`, a return-home action, `LanguageToggle`, a dark centered panel, an eyebrow, a title, and child form content. Keep a single-column layout at all breakpoints.

- [ ] **Step 2: Migrate login without changing its API contract**

Use `AuthFrame`, style `Input` instances with dark surfaces, track `isSubmitting`, disable the button during submission, and display `copy.auth.loggingIn` while pending. Retain POST `/api/auth/login` and the `/dashboard` redirect.

- [ ] **Step 3: Migrate registration without changing its API contract**

Use the same frame and dark inputs, add the pending state with `copy.auth.registering`, retain POST `/api/auth/register`, preserve parsed server errors, and keep the `/onboarding` redirect.

- [ ] **Step 4: Run focused tests**

Run: `npx tsx --test src/app/public-entry.test.ts src/lib/language.test.ts src/app/shell-design.test.ts`

Expected: PASS.

### Task 4: Verify behavior and deliver the local preview

**Files:**
- No additional source files expected.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Build the production application**

Run: `npm run build`

Expected: exit code 0 with `/`, `/login`, and `/register` built successfully.

- [ ] **Step 3: Start the local production server**

Run: `npm start -- -p 3000`. If port 3000 is occupied by an obsolete Atlora process, stop that process and start the newly built version on 3000; otherwise use the next available port.

- [ ] **Step 4: Verify in the browser**

Check the guest home, login, and registration routes in Chinese and English at desktop and mobile viewport sizes. Confirm both actions navigate correctly, no white authentication surface remains, pending buttons prevent repeated submission, and authenticated `/` redirects to `/dashboard`.

- [ ] **Step 5: Report the preview URL without pushing**

Leave the verified local server running and provide its URL. Do not push the implementation until the user approves the preview.
