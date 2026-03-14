---
name: new-client-module
description: Scaffold a complete client-side feature module for Wirdi following MVVM architecture. Use when creating a new page, feature, or domain area in apps/client — generates the full folder structure, index barrel, view, view-model hook, service, and query key file.
argument-hint: '[module-name] [brief description]'
---

# Scaffold a New Client Module

> **Trigger:** new page, feature, or domain area in `apps/client`

## Step 1 — Create Structure

```
src/modules/[module-name]/
├── index.ts                    # public barrel
├── components/
│   └── [module-name]-page.tsx
├── hooks/
│   └── use-[module-name].ts       # ViewModel
├── services/
│   └── [module-name].service.ts   # API functions (no hooks)
└── utils/
    ├── [module-name].keys.ts       # query key factory
    └── [module-name].validation.ts # (optional) client-only Zod extensions
```

## Step 2 — Query Keys

File: `utils/[module-name].keys.ts`

```ts
export const [moduleName]Keys = {
  all: ['[module-name]'] as const,
  lists: () => [...[moduleName]Keys.all, 'list'] as const,
  detail: (id: string) => [...[moduleName]Keys.all, 'detail', id] as const,
};
```

## Step 3 — Service Functions

File: `services/[module-name].service.ts`

Always return `Promise<UnifiedApiResponse<T>>` where `T` = item type.

```ts
import { apiClient } from '@/services/api-client';
import type { [ModuleName]Dto, Create[ModuleName]Dto, UnifiedApiResponse } from '@wirdi/shared';

export const get[ModuleName]List = (): Promise<UnifiedApiResponse<[ModuleName]Dto[]>> =>
  apiClient.get<[ModuleName]Dto[]>('/[module-name]');

// Paginated — T is item array; meta is sibling on the response (not inside data)
export const query[ModuleName]List = (
  query: Query[ModuleName]Dto,
): Promise<UnifiedApiResponse<[ModuleName]Dto[]>> => {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 10));
  return apiClient.get<[ModuleName]Dto[]>(`/[module-name]?${params.toString()}`);
};
```

## Step 4 — ViewModel Hook

File: `hooks/use-[module-name].ts`

```ts
import { useApiQuery } from '@/lib/hooks/use-api-query';
import { [moduleName]Keys } from '../utils/[module-name].keys';
import { get[ModuleName]List } from '../services/[module-name].service';

export function use[ModuleName]() {
  const { data, isLoading } = useApiQuery(
    [moduleName]Keys.lists(),
    get[ModuleName]List,
  );
  return { data, isLoading };
}
```

## Step 5 — View Component

JSX only — no logic, no state, no direct API calls.

```tsx
import { use[ModuleName] } from '../hooks/use-[module-name]';

export function [ModuleName]Page() {
  const { data, isLoading } = use[ModuleName]();
  // pure JSX rendering
}
```

## Step 6 — Barrel

File: `index.ts` — export only what other modules consume:

```ts
export { [ModuleName]Page } from './components/[module-name]-page';
```

## Rules

- No business logic in view components
- `useApiQuery` / `useApiMutation` only — never raw TanStack hooks
- Types from `@wirdi/shared` — never redefine locally
- Cross-module imports only via `src/modules/[module]/index.ts`
- No `useEffect` unless there is truly no safer alternative
