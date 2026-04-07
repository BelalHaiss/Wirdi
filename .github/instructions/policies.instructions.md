---
applyTo: '**'
---

# Business Policies

## Allowed Time Window (for recording wird)

- **Same day:** until end of day (group timezone)
- **Next day:** until 4:00 PM (group timezone)
- **Thursday is special:** window extends to Saturday 4:00 PM (skips Friday off)

## UI — Checkbox States

| State    | Color       | Meaning                                                                                   |
| -------- | ----------- | ----------------------------------------------------------------------------------------- |
| Empty    | Transparent | Day not yet come, or still within allowed window (not recorded yet)                       |
| Recorded | Green       | Recorded within the allowed time window                                                   |
| Late     | Yellow      | Recorded after the allowed window expired                                                 |
| Missed   | Red         | Allowed window passed with no record which Stored In DB as Missed and created By Cron job |
| Future   | Gray        | Future day — not reachable yet                                                            |

## Alert Policies

- **Cron runs daily at 4:00 PM (Asia/Riyadh)** — creates alerts for missed records from previous day
- **Two deactivation thresholds with different timing**:
  - **3 alerts in same week** → deactivate **immediately** when 3rd alert is created (any day)
  - **1 alert in immediately previous week** → deactivate **next Saturday** after one-week grace period
- **Exception via active excuse** — skip all alert creation and deactivation logic if learner has active excuse (`expiresAt > now` , same groupId )

## Alert Notifications

- Notify the **learner** immediately when an alert is assigned
- Notify the **admin / moderator** when a learner gets deactivated

## Recording Order

- Learner cannot record a new day if any previous day in the same week is unrecorded — unless they joined mid-week (i.e., their join date is after Saturday, the first day of the week).

## Special Cases

- **Thursday late submission** — the allowed window extends to Saturday 4:00 PM (next opening day after Friday off)
- **Late record + existing alert in the same week** → remove the old alert from that week (yellow cancels the red)
- **Exception flag** → learner is fully excluded from alert and deactivation logic

## important notes

- admin or moderator can be learner in groups
