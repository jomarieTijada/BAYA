# Mentor dashboard settings popover

Implemented October 24, 2026. No commit, push or deployment was performed.

## What caused the large panel

`MentorDashboard` rendered its workspace actions as a `p.card` inside `ProgressPage`'s ScrollView when the gear's local settings flag was enabled. It was technically toggleable, but opening it inserted a full-width dashboard row and pushed the content down. The gear did not navigate to Settings. All three workspace actions were functional. Mentor logout already belonged to the protected Mentor Settings screen.

There was no generic action popover. `StoryMascotPopover` is a lesson-specific speech bubble; it was left unchanged. Existing `PageHeader`, theme tokens, `AppIcon`, `BayaNotifications`, reduced-motion preferences, and Settings' `BayaDialog` confirmation were reused.

## Implementation

- **Workspace:** Manage Workspace, Refresh Progress, Switch Workspace.
- **Account:** Settings & Log Out, which opens the existing protected Settings screen. Logout still requires its existing confirmation, permits cancellation, invokes the actual sign-out service, and leaves SQLite learner data intact.
- Manage preserves the workspace ID. Switch preserves authentication. Navigation closes the menu.
- Refresh calls the existing `services.progress.dashboard(id, offset)` operation through `useCloudRead`. The hook now returns the refresh result and loading state, deduplicates concurrent reads, and ignores results after navigation. The dashboard opts into keeping its last successful data visible during refresh/failure. Other callers retain their prior clearing behavior.
- Refresh shows a small spinner and disables repeat activation. Only a successful service result produces “Progress refreshed.” Failures use the existing error toast. Opening/closing the menu does not restart data loading.

The menu is 264 px wide with 44 px action rows, a warm-white surface, orange icons/focus highlights, rounded border and existing shadow. Its measured height is about 252 px. No dashboard row or placeholder remains. The duplicate footer refresh link was also removed; refresh is available in the menu and error-state Retry remains available.

`measureInWindow` supplies the trigger position. A pure placement helper aligns the right edges, leaves an 8 px gap below the gear, respects safe areas and viewport bounds, and places the menu above a low trigger when that provides more room. The menu remeasures on resizing. It can scroll internally on more constrained viewports, but all four actions fit without internal scrolling at the five requested sizes.

On web, React DOM's existing portal API renders a nonmodal layer outside scrolling/clipped ancestors. There is no backdrop blur, dimming, focus trap or layout insertion. Native uses a transparent React Native Modal host to escape parent clipping, with an invisible outside-press target and Android back dismissal. Only the small menu is visually rendered. No dependency was added.

The existing shared header already centers the Back control, title and optional action. The gear now matches the compact Back button's 48×48 dimensions, replacing its former padded card. The subtitle and unrelated headers were preserved.

## Interaction and accessibility

The gear exposes its accessible label, menu popup type and expanded/collapsed state. Opening focuses the first enabled action on web. Arrow Up/Down and Home/End move through enabled actions; Pressable supplies Enter/Space activation. Escape returns focus to the gear. Tab is not trapped; moving focus outside dismisses the menu. The gear toggles the menu, outside press dismisses it, page scrolling dismisses it, and route blur closes it. An outside pointer click is consumed so it cannot also activate the dashboard control underneath.

Opening uses a 180 ms fade with 6 px movement; closing uses a 120 ms fade. Reduced motion removes the transition and dismisses immediately. Rows have visible hover/focus highlights and 44 px minimum touch targets. Native outside-press and back dismissal are covered by component tests; a physical Android device and native screen reader were not exercised.

## Files changed for this task

| File | Purpose |
| --- | --- |
| `apps/mobile/components/progress/MentorDashboard.tsx` | Replace inserted panel with grouped menu; wire existing routes and result-aware refresh feedback |
| `apps/mobile/components/ui/BayaActionMenu.tsx` | Reusable typed trigger, grouped actions, measurement, animation, dismissal and keyboard behavior |
| `apps/mobile/components/ui/PopoverLayer.web.tsx` | Nonmodal DOM portal |
| `apps/mobile/components/ui/PopoverLayer.tsx` | Transparent native overlay host and outside/back handling |
| `apps/mobile/components/ui/menuPosition.ts` | Viewport/safe-area placement calculation |
| `apps/mobile/types/react-dom.d.ts` | Minimal typing for the already-installed portal API |
| `apps/mobile/modules/progress/useCloudRead.ts` | Awaitable, deduplicated refresh; optional retention of successful data |
| `apps/mobile/components/progress/__tests__/progress.test.tsx` | Menu visibility/navigation, no reload, refresh failure/success/deduplication, native dismissal |
| `apps/mobile/components/ui/__tests__/menuPosition.test.ts` | Five target viewport sizes and above-trigger/safe-area placement |
| `apps/mobile/components/mentor/__tests__/flows.test.tsx` | Align one existing assertion with the previously corrected registration message; retained logout confirmation coverage |
| `docs/verification/mentor-popover/*` | Closed/open/dismissed screenshots and browser measurements |

## Verification

**55 tests passed across five suites:** dashboard/progress components, menu positioning, mentor flows, learner Settings, and the progress adapter. This includes logout cancellation/service invocation, context-preserving navigation, no sign-out on workspace switching, duplicate refresh prevention, truthful failure/success feedback, retaining existing data, no reload merely from toggling, and native outside/back dismissal. The tests emitted existing React `act` warnings and used `--forceExit` for outstanding test handles; they did not fail assertions.

TypeScript `tsc --noEmit`, targeted ESLint, `git diff --check`, and production web export passed. Final export generated service-worker cache `baya-pwa-c57dd23390fa05f9`. No model, preprocessing, curriculum, ownership or authentication implementation was changed for this task.

Actual browser rendering was checked at **667×375, 844×390, 915×412, 1024×768 and 1366×768**. All actions fit, menu edges stay inside the viewport, no horizontal overflow is introduced, and header coordinates/document height remain unchanged on opening. Closed/open/dismissed screenshots were captured at every size; desktop and small-landscape screenshots were visually inspected. Live resizing while open preserved the anchor. Browser interaction checks confirmed gear toggling, arrow navigation, Escape/focus restoration, refresh feedback, Settings route navigation with overlay removal, and outside-click dismissal without click-through.

Screenshots use the actual MentorDashboard component in the explicitly labeled development fixture route. They demonstrate layout and interaction, not a live hosted progress refresh. The protected Settings route correctly rejected this browser's unauthenticated session; service-backed logout is covered by existing tests rather than a new live sign-out.

| Screenshot | Evidence |
| --- | --- |
| [Closed desktop](verification/mentor-popover/closed-1366x768.jpg) | Gear only; no action panel |
| [Open desktop](verification/mentor-popover/open-1366x768.jpg) | Compact anchored menu |
| [Dismissed desktop](verification/mentor-popover/dismissed-1366x768.jpg) | Original dashboard spacing restored |
| [Small landscape](verification/mentor-popover/open-667x375.jpg) | Every action fits inside 667×375 |
| [Measurements](verification/mentor-popover/results.json) | All five viewport bounds, heading position and focus restoration |

Remaining verification limits: physical touch devices, native screen-reader behavior and a fresh hosted account's live refresh/logout were not tested. Browser layout and interactions, targeted automated checks and production compilation passed.
