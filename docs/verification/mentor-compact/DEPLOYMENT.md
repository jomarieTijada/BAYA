# Mentor compact UI, OTP and capacity

The UI is available on the local 8081 preview. The live Supabase database has not been migrated: this workspace has no linked project or database administration credentials.

Apply these migrations in order after the existing 202610250005 migration:
- supabase/migrations/202611250006_workspace_capacity.sql
- supabase/migrations/202611250007_mentor_login_otp.sql

The first adds capacity, preserves existing members, and serializes approval and activation against capacity. Existing workspaces start at 30 or their active learner count, whichever is higher. Mentors may choose 1–10,000 for new/edited workspaces. The second restricts mentor workspace authorization to sessions containing the OTP authentication method. Existing password-only sessions must log in again.

Use the existing supabase/templates/magic-link.html email template (contains the token) for login OTP, and confirmation.html for registration. Login validates the password with a nonpersistent client, clears that temporary session, and requests OTP with shouldCreateUser:false. Only OTP verification creates the persistent mentor session. Duplicate signup provider responses show the existing-account message. Invalid credentials remain intentionally ambiguous when the provider does not distinguish an unknown email from a wrong password.

Verification: TypeScript, focused auth/UI tests, local PostgreSQL migrations and capacity/OTP access checks, plus landscape screenshots using isolated development fixtures. No real email was sent and no live account/workspace was changed during testing.
