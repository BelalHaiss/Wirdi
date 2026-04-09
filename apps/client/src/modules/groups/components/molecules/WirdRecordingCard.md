# WirdRecordingCard Scenarios

This card is self-contained and fetches its own overview state using groupId.

## Render Matrix

1. Overview type is nothing (not_member, removed, no_week): render null.
2. Group is inactive or membership is inactive: render null.
3. Recordable status is available: render full recording form.
4. Recordable status is none with reason all_recorded: render AllRecordedMessage.
5. Recordable status is none with reason upcoming: render BlockedByPreviousDayMessage.

## Recording Rules in Card

1. The card submits only when all awrad are checked.
2. If read source is DIFFERENT_GROUP_MATE, selecting mate is required.
3. The card uses the same endpoint for STUDENT, MODERATOR, and ADMIN users.
4. If ADMIN or MODERATOR is not a member in group, card gets nothing response and renders null.

## Data Ownership

1. Parent pages pass only groupId.
2. Card owns readSource, selectedMateId, awrad check state, and submit mutation.
3. Parent VM does not hold card form state.
