# Optional assessment help

The question control shows the price and current balance. Confirmation previews the remaining balance. Canceling closes the dialog. A learner with fewer than two Stars can dismiss the explanation and continue answering. Ordinary audio playback remains free.

| Context | Assistance | Assessment treatment |
|---|---|---|
| Approved matching or sound matching | Show the reading and corresponding glyph | Record answer-revealed and withhold the one-Star question reward on this attempt |
| Base-character writing | Use the alternate word and highlighted syllable in the approved character inventory | Record clue and evaluate the submitted strokes normally |
| Modified-character writing | Describe the upper or lower kudlit and vowel group | Record clue and evaluate the submitted strokes normally |
| Pending audio or missing approved clue | Disable purchase | No charge |

`redeemHint` reloads the saved attempt, verifies the active learner, cursor and submission state, and resolves the approved clue. It inserts the debit and bilingual clue payload in one SQLite transaction. Rollback handles payload persistence failures. Reopening an existing clue returns the saved text, including after an offline restart. A retry has a fresh attempt ID and a new purchasing decision.

Set `EXPO_PUBLIC_BAYA_UNASSISTED=1` when building a formal evaluation package. It disables the hint resolver and purchasing path for that build. Assistance never draws strokes, invokes recognition on behalf of a learner, selects a match or submits an answer.
