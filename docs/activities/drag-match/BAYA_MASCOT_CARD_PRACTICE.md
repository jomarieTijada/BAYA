# BAYA mascot card practice — interaction update

The latest user request replaces the two-column provisional board with a stacked card deck and BAYA as the drop target. BAYA asks for one reading at a time using the existing StorySpeechBubble. Audio prompts retain verified recording playback and do not disclose the syllable before matching. All cards use approved glyph artwork.

Wrong drops receive immediate red-border/shake feedback; reduced-motion users receive the border and text without shaking. Correct drops play the existing greeting/wave animation and collect the character with its reading at the top. The floating Next arrow advances to the next prompt. Tap a visible card edge to bring it forward, then tap BAYA as the non-drag alternative. Keyboard activation remains supported.

The additive mascot-match-v3 response records the first answer at its original source question ID. Practice retries are accepted but do not replace the original correctness. Submitted matching-v2 boards and old choice responses remain parseable. Handwriting is unchanged. Progress now counts individual source questions.

Verification: TypeScript and lint passed; focused matching/storage suite passed 115 tests. The new mascot-match browser harness exercised wrong feedback, correct retry, actual mouse dragging to BAYA, and a resulting 2/3 score after one initial mistake. Screenshots cover 844×390, 760×360 and 320×568. Evidence: docs/verification/mascot-match. This supersedes the earlier Check Matches UI description.

Layout refinement: the active deck now uses equal-width/height cards. Completed pairs form a left-hand column of square mini cards with the Latin reading below the glyph. BAYA is bottom-aligned without hover borders or a footer row. Instructions is above the deck; success is communicated by the shared bubble and wave. Six component tests, TypeScript and lint passed; browser verification checks square dimensions, bottom alignment, drag/tap and first-answer scoring.


### Card layout refinement
Instructions now sit at the far left. The deck has a Switch card control and one large glyph per card. BAYA is larger and bottom-aligned; the shared topic speech bubble centers its text. Correct matches show Correct! for 1.8 seconds, then advance automatically without a Next button. Completed mini cards use a stronger green fill and border. Pending recordings advance after their unscored notice. Failed saves expose a retry action.

Verified at 844x390, 760x360 and 320x568 with the isolated browser harness, including wrong-answer retry, drag-to-BAYA, automatic advance and a preserved 2/3 first-attempt score.

The switch control now sits 12px left of the deck and card changes animate with a short slide and tilt (disabled for reduced motion). Instructions reuse WritingHelpGuide with matching-specific steps and highlighted targets; BAYA retains the question. Writing guide defaults are unchanged.

Switching now uses one two-phase flip: collapse, reorder while edge-on, then reveal. Inputs are locked during the flip to prevent repeated-tap jumps. The sound control is inside the shared speech bubble beside the prompt, preserving the playback-before-answer requirement.

Card switching now animates the front card out to the side, lowers it behind the stack while clear, and returns it to the back. Remaining cards move forward one position; the stack no longer flips or scales as a group. The switch stays locked for the 460ms animation.
