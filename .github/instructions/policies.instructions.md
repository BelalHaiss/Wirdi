---
applyTo: '**'
---

# Business Policies

## Allowed Time Window (for recording wird)

- **Same day:** until end of day (group timezone)
- **Next day:** until 4:00 PM (group timezone)
- **Thursday is special:** window extends to Saturday 4:00 PM (skips Friday — no school day)

## UI — Checkbox States

| State    | Color       | Meaning                                                             |
| -------- | ----------- | ------------------------------------------------------------------- |
| Empty    | Transparent | Day not yet come, or still within allowed window (not recorded yet) |
| Recorded | Green       | Recorded within the allowed time window                             |
| Late     | Yellow      | Recorded after the allowed window expired                           |
| Missed   | Red         | Allowed window passed with no record                                |
| Future   | Gray        | Future day — not reachable yet                                      |

## Alert Policies

- **1 alert in a week** → auto-deactivate the learner
- **3 alerts total** (across all weeks) → auto-deactivate the learner
- **Exception flag** → skip all blocking and deactivation logic entirely for that learner

## Alert Notifications

- Notify the **learner** immediately when an alert is assigned
- Notify the **admin / moderator** when a learner gets deactivated

## Special Cases

- **Thursday late submission** — the allowed window extends to Saturday 4:00 PM (next opening day after Friday off)
- **Late record + existing alert in the same week** → remove the old alert from that week (yellow cancels the red)
- **Exception flag** → learner is fully excluded from alert and deactivation logic
