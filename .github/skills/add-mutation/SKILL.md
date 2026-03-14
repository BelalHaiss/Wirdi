---
name: add-mutation
description: Add a full create, update, or delete mutation to a Wirdi client module. Use when implementing any data-modifying action — generates the service function, useApiMutation hook wiring, ConfirmDialog integration, toast notification, and cache invalidation.
argument-hint: "[action] [resource] (e.g. 'delete group', 'update member status')"
---

# Add a Mutation (Create / Update / Delete)

> **Trigger:** any data-modifying action on the client (create, update, delete)

## Step 1 — Service Function

File: `modules/[module]/services/[module].service.ts`

Return type is always `Promise<UnifiedApiResponse<T>>`.

```ts
import { apiClient } from '@/services/api-client';
import type { Update[Resource]Dto, [Resource]Dto, UnifiedApiResponse } from '@wirdi/shared';

export const update[Resource] = (
  id: string,
  data: Update[Resource]Dto,
): Promise<UnifiedApiResponse<[Resource]Dto>> =>
  apiClient.patch<[Resource]Dto>('/[resource]/' + id, data);

export const delete[Resource] = (id: string): Promise<UnifiedApiResponse<void>> =>
  apiClient.delete<void>('/[resource]/' + id);
```

## Step 2 — ViewModel Hook

File: `modules/[module]/hooks/use-[module].ts`

```ts
import { useApiMutation } from '@/lib/hooks/use-api-mutation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { [resource]Keys } from '../utils/[module].keys';
import { delete[Resource] } from '../services/[module].service';

export function use[Module]() {
  const queryClient = useQueryClient();

  const { mutate: remove, isPending: isRemoving } = useApiMutation(delete[Resource], {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() });
      toast.success('تم الحذف بنجاح');
    },
    onError: () => toast.error('حدث خطأ، حاول مرة أخرى'),
  });

  return { remove, isRemoving };
}
```

## Step 3 — View Component (delete)

Destructive actions **must** use `ConfirmDialog`.

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { use[Module] } from '../hooks/use-[module]';

export function [Resource]Actions({ id }: { id: string }) {
  const { remove, isRemoving } = use[Module]();

  return (
    <ConfirmDialog
      title="تأكيد الحذف"
      description="هل أنت متأكد من حذف هذا العنصر؟"
      onConfirm={() => remove(id)}
      loading={isRemoving}
    >
      <Button variant="destructive">حذف</Button>
    </ConfirmDialog>
  );
}
```

## Step 4 — Form Mutation (create / update)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { create[Resource]Schema } from '@wirdi/shared';

export function use[Module]Form(defaultValues?: Partial<Create[Resource]Dto>) {
  const queryClient = useQueryClient();

  const form = useForm<Create[Resource]Dto>({
    resolver: zodResolver(create[Resource]Schema()),
    defaultValues,
  });

  const { mutate, isPending } = useApiMutation(create[Resource], {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() });
      toast.success('تم الحفظ بنجاح');
      form.reset();
    },
    onError: () => toast.error('حدث خطأ، حاول مرة أخرى'),
  });

  const onSubmit = form.handleSubmit((data) => mutate(data));
  return { form, onSubmit, isPending };
}
```

## Rules

- `ConfirmDialog` is required for every delete / irreversible action
- Always fire `toast.success` on success and `toast.error` on error
- Always invalidate affected query keys on success
- `useApiMutation` only — never raw `useMutation`
- Schemas from `@wirdi/shared` — never redefine locally
- Service functions return `Promise<UnifiedApiResponse<T>>` — never a raw DTO
