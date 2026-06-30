# Atlora Dashboard Open Design Retune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retune the signed-in Atlora dashboard and shared controls to the open design visual system while preserving the current dashboard workflow.

**Architecture:** Keep the current React component boundaries and data flow. Use focused structural tests to lock the palette, alignment, and responsive contract, then update existing Tailwind class strings in the dashboard, modal, language toggles, app shell, and secondary signed-in pages. Browser verification covers PC, mobile, and intermediate widths locally and again on an online preview or production-equivalent deployment before release.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Node test runner, Playwright or in-app browser for visual QA.

---

### Task 1: Lock The Visual Contract With Failing Tests

**Files:**
- Modify: `src/components/dashboard-workspace.test.ts`
- Modify: `src/components/dashboard/card-detail-modal.test.ts`
- Modify: `src/app/shell-design.test.ts`
- Modify: `src/app/public-entry.test.ts`

- [ ] **Step 1: Add failing dashboard palette and alignment tests**

Add these tests to `src/components/dashboard-workspace.test.ts` after the existing recent-title test:

```ts
test("dashboard uses the open design spectral palette instead of the old green-dominant treatment", () => {
  assert.ok(source.includes("bg-[#111111]"));
  assert.ok(source.includes("border-[#2f2f2f]"));
  assert.ok(source.includes("#4f6f8f"));
  assert.ok(source.includes("#b48745"));
  assert.ok(source.includes("#9a554b"));
  assert.ok(!source.includes("bg-[#101412] text-[#f4f1e8]"));
  assert.ok(!source.includes("bg-[#d9e7c6] px-3 text-sm font-medium text-[#172018]"));
});

test("dashboard controls use stable centered alignment for bilingual labels", () => {
  assert.ok(source.includes("items-center justify-center"));
  assert.ok(source.includes("leading-none"));
  assert.ok(source.includes("min-w-0"));
  assert.ok(source.includes("truncate"));
  assert.ok(!source.includes("px-3 py-2 text-sm transition ${tab === item"));
});
```

- [ ] **Step 2: Add failing role-filter contract assertions**

Extend the existing `"dashboard localizes view labels without changing filter ids"` test in `src/components/dashboard-workspace.test.ts`:

```ts
  assert.ok(roleFilterSource.includes("roleToneClass"));
  assert.ok(roleFilterSource.includes("border-[#2f2f2f]"));
  assert.ok(roleFilterSource.includes("bg-[#171717]"));
  assert.ok(roleFilterSource.includes("items-center justify-center"));
  assert.ok(!roleFilterSource.includes("rounded-full border text-sm font-medium"));
```

- [ ] **Step 3: Add failing modal visual-contract test**

Add this test to `src/components/dashboard/card-detail-modal.test.ts`:

```ts
test("card detail modal follows the neutral open design reader surface", () => {
  assert.ok(modalSource.includes("bg-[#171717]"));
  assert.ok(modalSource.includes("border-[#2f2f2f]"));
  assert.ok(modalSource.includes("#4f6f8f"));
  assert.ok(modalSource.includes("#b48745"));
  assert.ok(modalSource.includes("#9a554b"));
  assert.ok(modalSource.includes("items-center justify-center"));
  assert.ok(!modalSource.includes("bg-[#171d1a]"));
  assert.ok(!modalSource.includes("bg-[#d9e7c6] px-5 py-2 text-sm font-medium text-[#172018]"));
});
```

- [ ] **Step 4: Add failing shared shell and secondary page tests**

Update `src/app/shell-design.test.ts`:

```ts
test("shared app shell uses the open design neutral spectral surface", () => {
  const serverShell = readFileSync(path.join(root, "src/components/app-shell.tsx"), "utf8");
  const clientShell = readFileSync(path.join(root, "src/components/app-shell-client.tsx"), "utf8");

  assert.ok(serverShell.includes("AppShellClient"));
  assert.ok(clientShell.includes("spectral-surface"));
  assert.ok(clientShell.includes("bg-[#111111]"));
  assert.ok(clientShell.includes("border-[#2f2f2f]"));
  assert.ok(clientShell.includes("Atlora"));
  assert.ok(!clientShell.includes("starfield-surface"));
  assert.ok(!clientShell.includes("bg-[#101412]"));
});
```

Then update the secondary-page test assertions:

```ts
    assert.ok(source.includes("border-[#2f2f2f]"));
    assert.ok(source.includes("bg-[#171717]"));
    assert.ok(!source.includes("border-[#354039]"));
```

- [ ] **Step 5: Add failing language-toggle alignment test**

Add this test to `src/app/public-entry.test.ts` after the existing language-provider test:

```ts
test("language toggles keep labels visually centered across public and signed-in surfaces", () => {
  const languageProvider = readFileSync(path.join(root, "src/components/language-provider.tsx"), "utf8");

  assert.ok(languageProvider.includes("items-center justify-center"));
  assert.ok(languageProvider.includes("leading-none"));
  assert.ok(languageProvider.includes("min-w-[2.5rem]"));
  assert.ok(languageProvider.includes("bg-[#e7e7e3] text-[#111111]"));
  assert.ok(languageProvider.includes("border-[#3a3a3a] bg-[#111111]"));
  assert.ok(!languageProvider.includes("bg-[#d9e7c6] text-[#172018]"));
});
```

- [ ] **Step 6: Run focused tests and verify RED**

Run:

```bash
npm test -- src/components/dashboard-workspace.test.ts src/components/dashboard/card-detail-modal.test.ts src/app/shell-design.test.ts src/app/public-entry.test.ts
```

Expected: FAIL because current components still use the old green-tinted dashboard shell, pale-green actions, and language toggle classes without the new alignment contract.

### Task 2: Retune Shared Language Controls And App Shell

**Files:**
- Modify: `src/components/language-provider.tsx`
- Modify: `src/components/app-shell-client.tsx`
- Modify: `src/components/dashboard/sidebar-link.tsx`

- [ ] **Step 1: Update language toggle class strings**

In `LanguageToggle` and `LocaleLanguageToggle`, use the same control structure:

```tsx
<div className="inline-flex items-center rounded-md border border-[#3a3a3a] bg-[#111111] p-0.5 text-xs text-[#b4b4b1]">
```

For each toggle button/link, replace the existing `h-7 rounded px-2 ...` class with:

```tsx
className={`inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded px-2 leading-none ${
  language === item ? "bg-[#e7e7e3] text-[#111111]" : "text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
}`}
```

For `LocaleLanguageToggle`, use `locale === "zh"` and `locale === "en"` in the same active class expression.

- [ ] **Step 2: Update app shell neutral surfaces**

In `src/components/app-shell-client.tsx`, change the root and shell classes:

```tsx
<div className="min-h-screen bg-[#111111] text-[#f3f3f1]">
  <header className="border-b border-[#2f2f2f] bg-[#151515]/95">
```

Change muted text values to `text-[#b4b4b1]` or `text-[#8f8f8a]`, and make navigation links centered:

```tsx
className="inline-flex items-center rounded-md px-3 py-2 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white"
```

Change the main surface:

```tsx
<main className="spectral-surface min-h-[calc(100vh-73px)] px-4 py-8">
```

- [ ] **Step 3: Update sidebar link alignment**

In `src/components/dashboard/sidebar-link.tsx`, change the link class to:

```tsx
className={`flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white ${active ? "bg-white/[0.08] text-[#f3f3f1]" : ""}`}
```

Change badge classes to:

```tsx
className="ml-auto inline-flex min-w-6 items-center justify-center rounded bg-[#242424] px-1.5 text-xs leading-5 text-[#b4b4b1]"
```

Change shortcut classes to:

```tsx
className="ml-auto text-xs leading-none text-[#8f8f8a]"
```

- [ ] **Step 4: Run shared tests and verify partial GREEN**

Run:

```bash
npm test -- src/app/public-entry.test.ts src/app/shell-design.test.ts
```

Expected: language-toggle assertions pass. Shell test may still fail until secondary pages are retuned in Task 5.

### Task 3: Retune Dashboard Workspace, Cards, And Role Filters

**Files:**
- Modify: `src/components/dashboard-workspace.tsx`
- Modify: `src/components/dashboard/knowledge-card.tsx`
- Modify: `src/components/dashboard/role-filter-bar.tsx`

- [ ] **Step 1: Update dashboard page, sidebar, header, and toolbar**

In `src/components/dashboard-workspace.tsx`, change the root surface:

```tsx
<div className="min-h-screen bg-[#111111] text-[#f3f3f1]">
```

Change main to:

```tsx
<main className="spectral-surface min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
```

Change the new-card button to a centered neutral primary action:

```tsx
className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#4f6f8f] bg-[#e7e7e3] px-3 text-sm font-medium leading-none text-[#111111] hover:bg-white"
```

Change sidebar surface and search controls to neutral values:

```tsx
<aside className="hidden w-64 shrink-0 border-r border-[#2f2f2f] bg-[#151515] px-3 py-4 lg:block">
```

```tsx
<div className="mt-3 flex items-center rounded-md border border-[#2f2f2f] bg-[#111111] px-2 py-1.5 text-sm text-[#d8d8d5]">
```

For the recent-observation button, preserve the existing two-line fix and use:

```tsx
className="line-clamp-2 min-h-[2.75rem] w-full rounded-md px-2 py-1.5 text-left text-xs leading-5 text-[#b4b4b1] break-words hover:bg-white/[0.06] hover:text-white"
```

For empty state and toolbar controls, use `border-[#2f2f2f]`, `bg-[#171717]`, `text-[#b4b4b1]`, `placeholder:text-[#767672]`, and focus rings `focus:ring-[#4f6f8f]`.

- [ ] **Step 2: Update knowledge card neutral treatment**

In `src/components/dashboard/knowledge-card.tsx`, change the card body shell to:

```tsx
className={`flex h-full flex-col overflow-hidden rounded-md border bg-[#171717] p-4 shadow-[0_1px_0_rgba(0,0,0,0.22)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(0,0,0,0.3)] group-focus-visible:ring-2 group-focus-visible:ring-[#4f6f8f] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#111111] ${accent.card}`}
```

Change tag pills to:

```tsx
className="max-w-[96px] truncate rounded border border-[#2f2f2f] bg-[#242424] px-2 py-0.5 text-xs text-[#b4b4b1]"
```

Change action icon to:

```tsx
className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#3a3a3a] text-[#b4b4b1] group-hover:bg-[#242424] group-hover:text-white"
```

Replace `viewAccentClasses` with neutral card borders plus small spectral hover accents:

```ts
function viewAccentClasses(tone: string) {
  const classes: Record<string, { card: string; text: string }> = {
    amber: { card: "border-[#2f2f2f] border-t-[#b48745] group-hover:border-t-[#b48745]", text: "text-[#d7b56d]" },
    sky: { card: "border-[#2f2f2f] border-t-[#4f6f8f] group-hover:border-t-[#4f6f8f]", text: "text-[#8fb1d1]" },
    emerald: { card: "border-[#2f2f2f] border-t-[#5f8f72] group-hover:border-t-[#5f8f72]", text: "text-[#9cc8a6]" },
    violet: { card: "border-[#2f2f2f] border-t-[#8f7db8] group-hover:border-t-[#8f7db8]", text: "text-[#c4b7e6]" },
    blue: { card: "border-[#2f2f2f] border-t-[#4f6f8f] group-hover:border-t-[#4f6f8f]", text: "text-[#9eb8d5]" },
    indigo: { card: "border-[#2f2f2f] border-t-[#7480b8] group-hover:border-t-[#7480b8]", text: "text-[#b9c3f2]" },
    rose: { card: "border-[#2f2f2f] border-t-[#9a554b] group-hover:border-t-[#9a554b]", text: "text-[#d79a92]" },
    slate: { card: "border-[#2f2f2f] border-t-[#8f8f8a] group-hover:border-t-[#8f8f8a]", text: "text-[#b4b4b1]" }
  };
  return classes[tone] ?? classes.slate;
}
```

- [ ] **Step 3: Update role filter controls**

In `src/components/dashboard/role-filter-bar.tsx`, change the outer section to:

```tsx
<section className="mt-6 border-b border-[#2f2f2f] pb-5">
```

Change each role button to:

```tsx
className="group flex min-w-[82px] flex-col items-center gap-2 rounded-md p-1 text-xs text-[#b4b4b1] hover:bg-white/[0.05]"
```

Replace `roleCircleClass` with `roleToneClass`:

```ts
function roleToneClass(tone: string, active: boolean) {
  const classes: Record<string, string> = {
    slate: "after:bg-[#8f8f8a]",
    emerald: "after:bg-[#5f8f72]",
    amber: "after:bg-[#b48745]",
    indigo: "after:bg-[#7480b8]",
    stone: "after:bg-[#8f8f8a]",
    sky: "after:bg-[#4f6f8f]",
    rose: "after:bg-[#9a554b]"
  };
  return `relative flex h-12 w-12 items-center justify-center rounded-md border border-[#2f2f2f] bg-[#171717] text-sm font-medium leading-none text-[#f3f3f1] transition after:absolute after:bottom-1 after:h-1 after:w-5 after:rounded-full ${classes[tone] ?? classes.slate} ${
    active ? "ring-2 ring-[#e7e7e3] ring-offset-2 ring-offset-[#111111]" : ""
  }`;
}
```

Update the JSX to call `roleToneClass(...)`.

- [ ] **Step 4: Run dashboard tests and verify GREEN**

Run:

```bash
npm test -- src/components/dashboard-workspace.test.ts
```

Expected: PASS.

### Task 4: Retune Card Detail Modal

**Files:**
- Modify: `src/components/dashboard/card-detail-modal.tsx`

- [ ] **Step 1: Update reader shell and sections**

Change modal article and header surfaces:

```tsx
className="reader-panel-transition fixed max-h-[88vh] overflow-y-auto overscroll-contain rounded-[10px] border border-[#2f2f2f] bg-[#171717] p-0 text-[#f3f3f1] shadow-2xl"
```

```tsx
<div className="border-b border-[#2f2f2f] bg-[#151515] px-5 py-4">
```

Change summary/key point/insight blocks to `border-[#2f2f2f] bg-[#111111] text-[#d8d8d5]`.

- [ ] **Step 2: Update modal tags and actions**

Use neutral tag pills:

```tsx
className="rounded border border-[#2f2f2f] bg-[#242424] px-2 py-1 text-xs text-[#b4b4b1]"
```

Use a centered neutral close button:

```tsx
className="inline-flex items-center justify-center rounded-md border border-[#4f6f8f] bg-[#e7e7e3] px-5 py-2 text-sm font-medium leading-none text-[#111111] hover:bg-white"
```

Use a centered edit link:

```tsx
className="inline-flex items-center justify-center rounded-md border border-[#3a3a3a] px-5 py-2 text-sm leading-none text-[#d8d8d5] hover:bg-white/[0.06]"
```

Keep destructive controls red, but ensure they are centered:

```tsx
className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6b3b3b] px-5 py-2 text-sm leading-none text-[#f0c8c8] hover:bg-[#261717]"
```

- [ ] **Step 3: Run modal tests and verify GREEN**

Run:

```bash
npm test -- src/components/dashboard/card-detail-modal.test.ts
```

Expected: PASS.

### Task 5: Retune New, Usage, And Settings Secondary Surfaces

**Files:**
- Modify: `src/app/new/page.tsx`
- Modify: `src/components/usage-content.tsx`
- Modify: `src/components/settings-content.tsx`

- [ ] **Step 1: Retune new-material page controls**

In `src/app/new/page.tsx`, update the form panel to:

```tsx
<div className="mt-6 rounded-md border border-[#2f2f2f] bg-[#171717] p-5 shadow-[0_1px_0_rgba(0,0,0,0.22)]">
```

Change tab buttons to centered icon-label controls:

```tsx
className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm leading-none transition ${
  tab === item ? "border-[#4f6f8f] bg-[#e7e7e3] text-[#111111]" : "border-[#2f2f2f] bg-[#111111] text-[#d8d8d5] hover:bg-white/[0.06]"
}`}
```

Change `Select`, `Input`, `Textarea`, loading panels, progress tracks, and progress fills to neutral `border-[#2f2f2f] bg-[#111111] text-[#f3f3f1] focus:ring-[#4f6f8f]`, with progress fill `bg-[#4f6f8f]`.

- [ ] **Step 2: Retune usage page**

In `src/components/usage-content.tsx`, replace old green surface values:

```tsx
border-[#354039] -> border-[#2f2f2f]
bg-[#171d1a] -> bg-[#171717]
bg-[#101412] -> bg-[#111111]
text-[#f4f1e8] -> text-[#f3f3f1]
text-[#b9b1a3] -> text-[#b4b4b1]
text-[#9ba79d] -> text-[#8f8f8a]
bg-[#d9e7c6] -> bg-[#4f6f8f]
```

Preserve warning and critical colors because they are semantic status colors.

- [ ] **Step 3: Retune settings page**

Apply the same replacements in `src/components/settings-content.tsx`. For the remaining quota badge, use:

```tsx
className="inline-flex items-center justify-center rounded-full border border-[#2f2f2f] px-3 py-1 text-sm leading-none text-[#d8d8d5]"
```

- [ ] **Step 4: Run shell tests and verify GREEN**

Run:

```bash
npm test -- src/app/shell-design.test.ts
```

Expected: PASS.

### Task 6: Full Local Verification

**Files:**
- No source files expected unless verification exposes a defect.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/components/dashboard-workspace.test.ts src/components/dashboard/card-detail-modal.test.ts src/app/shell-design.test.ts src/app/public-entry.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type checking**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3: Run the broader test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Browser QA locally**

Start the app:

```bash
npm run dev -- --port 3000
```

If port 3000 is occupied, use the next available port and record it.

Verify:

- `/zh` and `/en`: language segmented controls have vertically centered labels matching the screenshot concern.
- `/dashboard`: PC width around 1440 px, mobile width around 390 px, and an intermediate width around 768 px.
- `/dashboard`: sidebar, header, language control, new-card button, filters, toolbar, cards, empty state, and detail modal use one neutral/spectral system.
- `/new`: tab buttons, form controls, loading progress, and link-ingestion progress are centered and visually consistent.
- `/usage` and `/settings`: shell, cards, badges, tables, and quota bars match the same signed-in palette.
- Chinese and English: no button text sits high, low, clipped, or overlapped.

### Task 7: Online Preview Or Production-Equivalent Validation

**Files:**
- No source files expected unless online validation exposes a defect.

- [ ] **Step 1: Decide deployment target**

Use an online preview or production-equivalent deployment. Do not treat local-only screenshots as final acceptance.

- [ ] **Step 2: Validate PC online**

Open the online URL at PC width. Verify `/dashboard`, `/new`, `/usage`, `/settings`, and the card detail modal use the same open design palette and have no old green-dominant surfaces.

- [ ] **Step 3: Validate mobile online**

Open the online URL at mobile width. Verify dashboard navigation access, filters, card list, new-material forms, and card detail modal are usable and visually consistent.

- [ ] **Step 4: Validate responsive transition widths online**

Resize through intermediate widths. Verify there is no horizontal overflow, clipped controls, broken spacing, or mixed old/new visual systems.

- [ ] **Step 5: Validate bilingual UI online**

Switch Chinese and English online. Verify text remains centered inside buttons, segmented controls, selects, badges, and modal actions.

- [ ] **Step 6: Record release status**

If all online checks pass, record the URL and viewport coverage in the final handoff. If any online issue appears, fix it locally, rerun local verification, redeploy preview, and repeat online validation before release.
