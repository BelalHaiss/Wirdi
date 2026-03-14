---
applyTo: 'apps/client/**'
---

# Data Fetching & Mutations

## Hooks

- GET → `useApiQuery` only
- Mutations → `useApiMutation` only
- **Never** use raw TanStack hooks (`useQuery`, `useMutation`)

## Query Keys

- Centralize in `[module].keys.ts` — no inline string keys

## Service Function Return Types

- Always `Promise<UnifiedApiResponse<T>>` where `T` = item type (`UserDto`, `GroupDto[]`)
- **Never** nest: `T` must not be a wrapper type that has its own `data` field
- Paginated: `T` is `ItemDto[]`; `meta` is a sibling on the same response object

```ts
// ✅ non-paginated
export const getUser = (id: string): Promise<UnifiedApiResponse<UserDto>> =>
  apiClient.get<UserDto>(`/user/${id}`);

// ✅ paginated — meta lives alongside data, not inside it
export const queryUsers = (q: QueryUsersDto): Promise<UnifiedApiResponse<UserDto[]>> =>
  apiClient.get<UserDto[]>(`/user?page=${q.page}&limit=${q.limit}`);

// ❌ double-wrap — forbidden
export const queryUsers = (): Promise<UnifiedApiResponse<QueryUsersResponseDto>> => ...;
```

## Mutations

- Every destructive action → `ConfirmDialog` before executing
- Always fire `toast.success` / `toast.error`
- Always invalidate affected query keys on success

```ts
// ✅ correct
const { mutate } = useApiMutation(updateUser, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
    toast.success('تم الحفظ');
  },
  onError: () => toast.error('حدث خطأ'),
});
```
