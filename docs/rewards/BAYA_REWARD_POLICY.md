# Star reward policy

| Event | Credit | Eligibility and frequency |
|---|---:|---|
| Instructional topic | 2 | First committed completion of a distinct eligible topic after upgrade |
| Module | 5 | The topic transition that finishes the module, once per module |
| Matching response | 1 | First eligible correct answer for the source question across attempts |
| Handwriting response | 1 | First eligible correct model-evaluated response for the source question |
| Checkpoint | 3 | First completed approved checkpoint, independent of percentage |
| Achievement | 1–5 | Once for the catalog ID following a genuine unlock |
| Paid hint | −2 | Confirmed, deliverable clue for one question in one attempt |

Values are versioned in `apps/mobile/modules/rewards/policy.ts`. Achievement amounts follow each definition's `starValue` in the 50-entry catalog. Values Hero awaits approved content. Retrying can earn a previously missed question. Reviewing or improving an already rewarded source yields no additional question credit.

A revealed matching relationship is recorded as assisted. A correct submission still receives its normal assessment score and earns zero question Stars on that attempt. A contextual writing clue preserves eligibility for a model-confirmed correct response. Pending audio, unavailable recognition and incomplete responses cannot earn correctness credit.

Spendable balance equals lifetime credits less spending. Spending affects neither permanent unlocks nor XP and level progression. The performance display gives one star below 60%, two from 60% up to a perfect result, and three at 100%. An assessment with zero scoreable items shows zero performance stars. This display creates no transactions.

Existing proven achievement unlocks receive their configured credit once when reconciled. Historic topics, responses, XP and checkpoints have no automatic conversion. A later eligible correct answer or checkpoint completion can establish a new source credit under the current policy.
