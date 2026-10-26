# Visual verification evidence

Screenshots marked DEVELOPMENT PREVIEW use isolated service fixtures, not real accounts or workspaces. `unavailable`, `validation`, and `guard` captures use the production unavailable adapter.

100 screen/viewport combinations were captured at 667×375, 844×390, 915×412, 1024×768, and 1366×768. No document-level horizontal overflow was detected. `results.json` contains the rendered text and measured input dimensions. Additional `-bottom.png` images demonstrate reachable actions on long phone-landscape forms. The Supabase follow-up added the recovery form and rechecked unconfigured auth/session screens (15 captures).

| Screen/state | Desktop | Small landscape |
| --- | --- | --- |
| Login | [image](login-1366x768.png) | [image](login-667x375.png), [bottom](login-667x375-bottom.png) |
| Registration | [image](register-1366x768.png) | [image](register-667x375.png), [bottom](register-667x375-bottom.png) |
| OTP | [image](otp-1366x768.png) | [image](otp-667x375.png) |
| Password recovery | [image](reset-1366x768.png) | [image](reset-667x375.png), [bottom](reset-667x375-bottom.png) |
| Empty workspaces | [image](empty-1366x768.png) | [image](empty-667x375.png) |
| Workspace list | [image](list-1366x768.png) | [image](list-667x375.png) |
| Create workspace | [image](create-1366x768.png) | [image](create-667x375.png), [bottom](create-667x375-bottom.png) |
| Workspace details | [image](details-1366x768.png) | [image](details-667x375.png) |
| Learner join | [image](join-1366x768.png) | [image](join-667x375.png) |
| Confirmed join | [image](joined-1366x768.png) | [image](joined-667x375.png) |
| Memberships | [image](memberships-1366x768.png) | [image](memberships-667x375.png) |
| Loading | [image](loading-1366x768.png) | [image](loading-667x375.png) |
| Offline error | [image](error-1366x768.png) | [image](error-667x375.png) |
| Auth unavailable | [image](unavailable-1366x768.png) | [image](unavailable-667x375.png) |
| Validation | [image](validation-1366x768.png) | [image](validation-667x375.png) |
| Mentor route guard | [image](guard-1366x768.png) | [image](guard-667x375.png) |

Final automated evidence: [UI tests](tests.log), [production export](export.log), [targeted lint](lint-feature.log), [layout measurements](results.json).

The screenshots verify browser layout. Native virtual keyboards and live Supabase operations were not tested. See [implementation report](../../mentor-workspaces-ui.md) for backend boundaries, the chosen mentor/profile relationship, and the existing full-repository lint issue.

Progress dashboard follow-up: [independent settings](settings-empty-1366x768.png), [connected settings](settings-connected-1366x768.png), [dashboard](dashboard-1366x768.png), [learner details](progress-detail-1366x768.png). These 20 captures use development fixtures. See [progress implementation](../../progress-dashboard-sync.md).
