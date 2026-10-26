# Live workspace joining verification — 25 October 2026

## Outcome

The authorized live backend fix is applied to Supabase project `xqtsrsxhfylfldtfbuhe`. The existing local application at `http://localhost:8081` successfully completed learner pending request → mentor rejection → learner reapplication → mentor approval → active membership. Both decisions were performed through Workspace Management in the user's signed-in Brave mentor session. Learner operations used the in-app browser's existing local learner profile and real anonymous Supabase Auth.

No frontend code was changed, committed, pushed, or deployed. All unrelated working-tree changes were retained.

## Schema inspection and migration

Before migration, inspected actual public columns, constraints, policies, function definitions/ACLs, and the `auth.users` profile trigger. The expected predecessor schema and identity functions were present. All ten existing public tables had RLS enabled. `workspace_join_requests` and its RPCs were absent; the legacy `join_workspace` still inserted memberships immediately.

The live database had no `supabase_migrations.schema_migrations` table. Predecessors were therefore verified by actual schema inspection rather than claiming a recorded CLI migration history. No fresh-project migration was replayed and no history was fabricated.

Applied the unchanged, transactional `supabase/migrations/202610250005_workspace_join_requests.sql` through the authenticated Supabase SQL editor. SHA-256: `3A4A7DE29FD5A9BFC02B82A14FFCEAF8FF33C9800FF267CCFD2D94345F9AEBE6`.

The SQL editor returned success. Immediate before/after fingerprints for profiles, workspaces, and memberships matched. Counts remained one profile, two workspaces, zero memberships, zero learner-progress rows, and zero activity attempts. Existing table grants and RLS policies were unchanged. All eleven public tables now have RLS enabled. The new table grants authenticated clients SELECT only; RPCs have authenticated-only execution, security-definer ownership checks, and empty search paths. The private JSON helper is not executable by client roles.

Schema and preservation evidence is saved in `verification/workspace-join-live/schema-before.json`, `preservation-before.json`, `preservation-after.json`, and `final-audit.json`. These are audit records, not a full database backup.

## Authentication configuration

Enabled and saved **Allow anonymous sign-ins** only after applying the approval migration. Supabase displayed “Successfully updated settings.” Actual learner signup then succeeded and the final audit confirmed an anonymous learner profile and a non-anonymous mentor profile.

Existing anonymous signup rate limit is 30 requests/hour/IP. CAPTCHA remains disabled, as it was before this work; adding CAPTCHA requires an application challenge integration and provider configuration. No other Auth protections or provider settings were changed.

## Real browser workflow

Used existing workspace **Cleanup Verification 2026-10-25**, ID `de32cf40-c58c-455b-b571-af6903e69cd5`. Room 1 remained at zero learners and zero pending requests.

1. Learner submitted the workspace code. The real application displayed **JOIN REQUEST SENT!** and **WAITING FOR APPROVAL**.
2. Workspace Management displayed one pending request, the identical server reference, and zero active members.
3. Mentor clicked Reject. The mentor received **Request rejected.**; the learner subsequently displayed **REQUEST REJECTED**. No membership was created.
4. Learner reapplied. A different server reference was created and displayed on both sides.
5. Mentor clicked Approve for that matching reference. Workspace Management displayed **Request approved.**, zero pending requests, and one active learner.
6. Learner navigation refreshed authoritative state and displayed **WORKSPACE MEMBER** and **WORKSPACE JOINED!**.
7. Returning to mentor workspace selection displayed one learner / zero pending requests for the verification workspace and zero / zero for Room 1.

Retained audit history:

| Request | Final status |
|---|---|
| `5187a252-2083-4a1f-87f6-dc44ba1de275` | rejected |
| `378b1a84-f6bf-4710-9168-b584e5512f8c` | approved |

Both have server review metadata. One anonymous learner identity, both requests, and its approved membership remain for inspection. No test records were deleted. The existing learner home showed the same level 1, zero XP, and first lesson before and after the flow; no local storage reset or progress mutation was performed.

## Checks and limits

- Re-ran `node scripts/test-workspace-approval.mjs`: **36 database/security checks passed**.
- Ran ten rollback-only authorization assertions on the live database: own history, already-member retry, denied direct request update, denied direct membership insert, denied learner review, denied learner owner-list access, blocked legacy instant join to Room 1, unrelated identity RLS isolation, denied unrelated review, and denied unauthenticated request. All passed; transaction rolled back. SQL and result are saved under `verification/workspace-join-live/`.
- Live SQL role/claim assertions exercise database permissions; actual browser operations separately verify real Auth and application integration. The unrelated identity check is not a second real mentor browser login.
- True concurrent independent-session approval races, a second real mentor account, all responsive viewport sizes, and physical shared-device identity isolation were not tested in this pass. Earlier reports describe local coverage and remaining product constraints.
- Browser access was disabled in Work settings after completed approval evidence and the refreshed mentor workspace counts were observed. The additional My Workspaces membership-list screenshot and final tab cleanup could not be completed. This does not invalidate the captured learner approval dialog, mentor active member view, or final database audit.
- No frontend test/build rerun was needed because this pass changed only live backend configuration/schema and documentation.

## Captured screenshots

- [Migration success](verification/workspace-join-live/migration-success.png)
- [Anonymous sign-in enabled](verification/workspace-join-live/anonymous-enabled.png)
- [Learner request sent](verification/workspace-join-live/learner-request-sent.png)
- [Mentor pending request](verification/workspace-join-live/mentor-pending.png)
- [Mentor rejection](verification/workspace-join-live/mentor-rejected.png)
- [Learner rejection](verification/workspace-join-live/learner-rejected.png)
- [Mentor approval and active member](verification/workspace-join-live/mentor-approved.png)
- [Learner workspace joined](verification/workspace-join-live/learner-approved.png)
- [Live authorization checks](verification/workspace-join-live/live-authorization-passed.png)
