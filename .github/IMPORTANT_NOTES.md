# Important Notes

## ⚠️ Group Timezone — All Groups Must Stay `Asia/Riyadh` for Now

All groups default to `Asia/Riyadh`. The alert cron fires at a **fixed 4PM Asia/Riyadh** for all groups — it does not account for per-group timezones.

Recording deadlines in `student-wird.service.ts` already use `group.timezone`, so if a group had a different timezone the cron would fire at the wrong time relative to its deadline.

**Before implementing "edit group timezone":** refactor the cron to compute each group's deadline independently using its own timezone, instead of relying on the fixed fire time.

---

## Active Excuse = Only Exception to Alerts

No permanent exception flag exists. The sole way to skip alert/deactivation logic is an active excuse (`expiresAt > now`, same `groupId`). Cron and `alert.service.ts` both check this — removed/inactive members are additionally excluded via `removedAt: null`.

---

## Deactivation Is Manual to Reverse

`INACTIVE` status set by the cron stays until a moderator/admin approves an `ACTIVATION` request. No auto re-activation.

---

## Soft-Delete for Removed Members

Member removal sets `removedAt`/`removedBy` — records are never hard-deleted. All write queries must filter `removedAt: null`.
