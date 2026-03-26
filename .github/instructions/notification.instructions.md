---
applyTo: '**'
---

# Notification System

## Architecture

- **Single service** with pluggable channels (IN_APP, PUSH, EMAIL)
- **Channel routing** declared in `NOTIFICATION_CHANNEL_CONFIG` from `@wirdi/shared`
- **Type-safe payloads** via `NotificationPayloadMap` — each type defines its own shape

## Sending Notifications

```ts
// In any service — inject NotificationService
await this.notificationService.send({
  type: 'ALERT_ASSIGNED',
  recipientId: userId,
  payload: { groupId, groupName, weekId, weekNumber, dayNumber },
});
```

## Adding a New Type

1. **Define payload** in `@wirdi/shared/notification.types.ts`:

   ```ts
   export type NotificationPayloadMap = {
     NEW_TYPE: { field1: string; field2: number };
     // ...existing types
   };
   ```

2. **Add to channel config**:

   ```ts
   export const NOTIFICATION_CHANNEL_CONFIG = {
     NEW_TYPE: ['IN_APP', 'PUSH'],
     // ...existing types
   };
   ```

3. **Add enum** to `prisma/schema.prisma`:

   ```prisma
   enum NotificationType {
     NEW_TYPE
     // ...existing values
   }
   ```

4. Run migration: `pnpm prisma migrate dev`

## Adding a New Channel

1. **Create channel** in `modules/notification/channels/`:

   ```ts
   export class PushNotificationChannel implements INotificationChannel {
     async send<T extends NotificationType>(dto: SendNotificationDto<T>) {
       // implementation
     }
   }
   ```

2. **Register** in `notification.module.ts`:
   - Add to `providers` array
   - Add to registry `Map`: `['PUSH', channels[1]]`
   - Add to `inject` array

Zero changes needed in `NotificationService` or any caller.

## Rules

- All notification types in `@wirdi/shared` — never define locally
- Channel config is the single source of truth for routing
- Each type always includes `recipientId` + type-specific `payload`
- No business logic in channels — they only handle delivery
