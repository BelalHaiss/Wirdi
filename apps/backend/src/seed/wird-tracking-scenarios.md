# Wird Tracking Seed Scenarios

Short mapping for seeded test users in wird tracking policy seed.

The current seed now simulates cron checkpoints from the business policy and only creates MISSED plus alert after the allowed time passes.

- admin: admin is learner in group (unified endpoint role test)
- moderator: moderator is learner in group (unified endpoint role test)
- moderator2: moderator not member in group (recording card should render null)
- student1: on-time attendance baseline
- student2: misses one day and gets one alert
- student3: daily cron candidate with missing days and no excuse
- student4: active excuse (skip alert/deactivation)
- student5: reaches 3 alerts in same week and becomes inactive
- student6: one alert in previous week, then next Saturday grace deactivation
- student7: joined mid-week (order should start from join day)
- student8: mate read source + later missed day alert
- student9: Thursday still recordable before Saturday cron
- student10: inactive membership (no recording)
- student11: active learner in historical group only
- student12: active learner in historical group only
- student13: active learner in historical group only
- student14: removed learner with old records (read-only history)
- student15: oldest MISSED day remains current recordable day
- student16: oldest unrecorded day still open (must record oldest)
- student17: Thursday still open before Saturday cron
- student18: removed learner (was mate scenario reference)
- student19: inactive membership (not removed)
- student20: removed learner with active excuse (still blocked)
- student21: removed learner to verify cron skips removed members even if days are missing
- student22: active learner target for remove+notification manual flow and cron catch-up
- student23: removed learner for request-block scenario
- student24: inactive (not removed) for activation-request scenario
- student25: active in one group + removed in another (active + previous groups UI)

Password for all seeded users: 12345678
