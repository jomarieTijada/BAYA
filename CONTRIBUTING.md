# Contributing and adviser testing

## Branch map

| Branch | Purpose |
| --- | --- |
| feature/learning-pwa | Current learning PWA; GitHub default and base for learning-app PRs. Formerly pwa-fresh-restart. |
| feature/data-collection | Preserved handwriting data-collection Android app, including the original canvas. Formerly pre-pwa-canvas-snapshot; recovered at a3aa3c80e6e64d29b9478ce39df1c9cdb6e5f10a. Base collection-app changes on this branch. |
| main | Historical project foundation, not the current learning app or a tested production release. |

The collection app is preserved as a separate branch in this repository, not a separate repository. Its root README and apps/mobile/App.tsx identify the collection pipeline. Some older directory READMEs describe planned work and may be stale.

## Naming new branches

Use a lowercase prefix followed by a short kebab-case description. Include an issue number when one exists; do not invent ticket IDs.

| Prefix | Purpose | Example |
| --- | --- | --- |
| feature/ | New features or substantial UI additions | feature/learner-progress |
| bugfix/ | Bugs found in development or QA | bugfix/canvas-clear |
| hotfix/ | Urgent fixes to a deployed production app | hotfix/startup-crash |
| release/ | Preparation for a specific release | release/v1.0.0 |
| chore/ | Dependencies, tooling, or configuration | chore/update-dependencies |
| docs/ | Documentation-only changes | docs/setup-guide |
| refactor/ | Internal restructuring without behavior changes | refactor/stroke-storage |

Prefer feature/ and bugfix/ consistently rather than mixing them with feat/ and fix/. The existing main branch is an integration-name exception.

## Opening and reviewing PRs

1. Start from the appropriate app branch and create a branch using the convention above.
2. Keep each PR focused and select the matching app branch as its base.
3. Explain the change and provide reproducible testing steps, expected results, and screenshots for UI changes.
4. Request adviser review after the adviser accepts the repository invitation.
5. Record the tested commit, device/browser, actual results, and remaining issues. Merge only after the intended review is complete.

For learning-app changes, target feature/learning-pwa. For collection-app changes, target feature/data-collection. Do not merge the preserved collection app wholesale into the PWA.

## Testing the learning PWA

Use a separate clean checkout when testing, so ongoing local development remains intact:

```powershell
git clone --branch feature/learning-pwa https://github.com/jomarieTijada/BAYA.git BAYA-learning-review
cd BAYA-learning-review
npm ci
npm run web --workspace=apps/mobile
npm run export:web --workspace=apps/mobile
```

For a PR, fetch its actual head and record the commit before testing:

```powershell
git fetch origin pull/NUMBER/head
git switch --detach FETCH_HEAD
git rev-parse HEAD
npm ci
```

Replace NUMBER with the PR number. Test the changed behavior and relevant navigation, layout, reload, and error cases. Record only checks actually run; a successful export does not establish functional correctness. These commands are provided for reviewers and were not executed during the branch cleanup.

## Testing the preserved data-collection app

```powershell
git clone --branch feature/data-collection https://github.com/jomarieTijada/BAYA.git BAYA-collection-review
cd BAYA-collection-review
npm ci
npm run android
```

An Android development environment is required. This snapshot uses native dependencies including Skia and SQLite; use a development build. Inspect apps/mobile/AGENTS.md before modifying app code. Verify handwriting capture, clear/retry, saved samples, and export on the target device using synthetic samples. Recovery preserves source history; it does not certify that the old app builds or runs with today's tooling.

The branch rename does not publish uncommitted local files or commits that were not already on GitHub.