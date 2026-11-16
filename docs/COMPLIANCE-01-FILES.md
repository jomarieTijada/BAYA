# Compliance #1 file inventory

Paths are repository-relative. These list localization integration points; some files also contain pre-existing user changes. This is not a claim that the entire Git diff belongs to this task.

## New localization module

- `apps/mobile/localization/__tests__/core.test.ts` — translation, storage and state-preservation tests.
- `apps/mobile/localization/__tests__/LocalizationProvider.test.tsx` — translation, storage and state-preservation tests.
- `apps/mobile/localization/components.tsx` — native presentation and accessibility adapters.
- `apps/mobile/localization/core.ts` — lookup, interpolation, formatting and plural helpers.
- `apps/mobile/localization/education.ts` — draft bilingual educational presentation and review status.
- `apps/mobile/localization/en.ts` — English UI resources and typed keys.
- `apps/mobile/localization/LanguageSelector.tsx` — shared accessible English/Tagalog control.
- `apps/mobile/localization/LocalizationProvider.tsx` — restore, context, serialized saving and document language.
- `apps/mobile/localization/messages.ts` — complete dynamic sentence templates.
- `apps/mobile/localization/README.md` — maintenance rules.
- `apps/mobile/localization/storage.ts` — existing SQLite preference persistence.
- `apps/mobile/localization/tl.ts` — matching Tagalog UI resources.
- `apps/mobile/localization/useLocalizedAlert.ts` — native alert translation.

## Integrated application files

- `apps/mobile/app/_layout.tsx` — root localization provider.
- `apps/mobile/app/learner/setup.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/app/mentor/settings.tsx` — shared selector in existing mentor Settings route.
- `apps/mobile/components/DrawingCanvas.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/branding/BayaLogo.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/landing/LandingHero.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/landing/RoleButton.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/landing/RolePlaceholderScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/layout/LandscapeGuard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/layout/PageHeader.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/JoinRequestStatus.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/LearnerCloudAccount.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/LearnerPageHeader.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/LearnerPlaceholderScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/LearnerWorkspaceScreens.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/ProfileSetupForm.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/ActivityActionButton.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/ActivityNavigationControls.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/ActivityProgress.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/ActivityRenderer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/VideoActivity.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/VideoActivityCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/activity/__tests__/Topic12StorybookScreen.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/learner/cards/ActivityCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/cards/LessonCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/cards/TopicCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/characters/CharacterTopicScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/characters/CharacterViewer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/characters/__tests__/CharacterViewer.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/learner/home/ContinueLessonHero.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/home/DashboardCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/home/DashboardCards.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/home/LearnerBottomNav.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/home/LearnerHeader.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/home/XpProgress.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/lessons/LessonProgress.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/settings/ConnectionStatusBadge.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/settings/SettingsScreen.tsx` — language selector and previous-route Back behavior.
- `apps/mobile/components/learner/settings/WorkspaceSyncCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/LessonSource.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/LessonVideoIntroduction.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StoryContent.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StoryImagePlaceholder.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StoryMascot.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StoryMascotPopover.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StorySpeechBubble.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StoryVisualLearning.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/StorybookTopicScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/VideoCreditLink.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/story/__tests__/StorybookTopicScreen.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/learner/story/__tests__/VideoCreditLink.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/learner/writing/BayaWritingGuide.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/CharacterReferenceCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/ConfidenceCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/RecognitionMatchRow.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingCanvas.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingHelpGuide.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingInstructions.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingMasteryIndicator.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingMilestoneBadge.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingPracticeScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/WritingToolbar.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/learner/writing/__tests__/WritingNavigation.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/learner/writing/__tests__/WritingPracticeScreen.recognition.test.tsx` — English query expectations and/or locale-switch regression coverage.
- `apps/mobile/components/media/AudioPlayer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/media/ImageViewer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/media/MediaFallback.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/media/VideoPlayer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/ActiveMembers.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/AuthScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/FeatureScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/MentorActionMenu.tsx` — language Settings menu action.
- `apps/mobile/components/mentor/PasswordField.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/PendingJoinRequests.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/WorkspaceCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/WorkspaceManageScreen.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/WorkspaceScreens.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/mentor/WorkspaceSection.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/progress/LearnerProgressDetail.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/progress/LearnerProgressRow.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/progress/MentorDashboard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/progress/WorkspaceCode.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/AppButton.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/AppTextInput.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/BackButton.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/BayaActionMenu.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/BayaDialog.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/BayaNotifications.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/PopoverLayer.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/SwipeHint.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/components/ui/cards/BaseCard.tsx` — translated presentation/accessibility through the shared adapters and context.
- `apps/mobile/modules/progress/presentation.ts` — locale-aware sync timestamp formatting.

## Other test expectation updates

- `apps/mobile/components/learner/activity/__tests__/ActivityScreen.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/characters/__tests__/CharacterTopicScreen.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/home/__tests__/LearnerHomeScreen.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/lessons/__tests__/curriculumScreens.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/settings/__tests__/SettingsScreen.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/writing/__tests__/BayaWritingGuide.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/writing/__tests__/ConfidenceCard.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/writing/__tests__/WritingHelpGuide.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/writing/__tests__/WritingInstructions.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/learner/writing/__tests__/WritingMasteryIndicator.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/media/__tests__/media.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/mentor/__tests__/joinApproval.test.tsx` — retain behavioral assertions with the English default UI.
- `apps/mobile/components/progress/__tests__/progress.test.tsx` — retain behavioral assertions with the English default UI.

## Documentation and evidence

- `docs/COMPLIANCE-01-AUDIT.md` — audit, implementation scope, review status and evidence index.
- `docs/COMPLIANCE-01-STRING-INVENTORY.json` — audit, implementation scope, review status and evidence index.
- `docs/COMPLIANCE-01-ENGLISH-TAGALOG.md` — audit, implementation scope, review status and evidence index.
- `docs/COMPLIANCE-01-FILES.md` — audit, implementation scope, review status and evidence index.
- `scripts/testing/compliance-01/browser-server.mjs` — reproducible browser capture/check workflow.
- `scripts/testing/compliance-01/cdp.mjs` — reproducible browser capture/check workflow.
- `scripts/testing/compliance-01/contact-sheets.py` — reproducible browser capture/check workflow.
- `scripts/testing/compliance-01/extra-browser.mjs` — reproducible browser capture/check workflow.
- `scripts/testing/compliance-01/README.md` — reproducible browser capture/check workflow.
- `scripts/testing/compliance-01/verify-browser.mjs` — reproducible browser capture/check workflow.
- `docs/verification/compliance-01/` — paired PNG screenshots, comparison sheets, JSON browser reports and compact validation results; exact screenshot names are in the reports.

- `scripts/testing/compliance-01/verify-writing-navigation.mjs` � real-browser stroke preservation through Settings and Back.
