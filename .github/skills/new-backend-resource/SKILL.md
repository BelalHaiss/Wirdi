---
name: new-backend-resource
description: Scaffold a NestJS backend resource for Wirdi. Use when adding a new API domain or endpoint group in apps/backend — generates module, controller, service wired to Prisma, with correct guards, decorators, and validation patterns.
argument-hint: '[resource-name] [brief description]'
---

# Scaffold a New Backend Resource

> **Trigger:** adding a new API domain or endpoint group in `apps/backend`

## Step 1 — Generate

```bash
cd apps/backend
npx nest g res modules/[resource-name] --no-spec
```

Creates: `[resource-name].module.ts`, `.controller.ts`, `.service.ts`

## Step 2 — Response Contract

The global `ResponseInterceptor` auto-wraps returns:

| Controller returns   | Wire response                               |
| -------------------- | ------------------------------------------- |
| `T` (plain DTO)      | `{ success: true, data: T }`                |
| `PaginatedResult<T>` | `{ success: true, data: T[], meta: {...} }` |

**Never** manually wrap in `{ success, data }` — the interceptor does it.

## Step 3 — Controller Pattern

```ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { [ResourceName]Service } from './[resource-name].service';
import { User } from '@/decorators/user.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { ZodValidationPipe } from '@/pipes/zod-validation.pipe';
import {
  create[ResourceName]Schema,
  [ResourceName]Dto,
  Create[ResourceName]Dto,
  PaginationQueryType,
  PaginatedResult,
  Role,
} from '@wirdi/shared';
import type { RequestUser } from '@/types/declartion-merging';

@Controller('[resource-name]')
export class [ResourceName]Controller {
  constructor(private readonly service: [ResourceName]Service) {}

  @Get()
  findAll(@User() user: RequestUser): Promise<[ResourceName]Dto[]> {
    return this.service.findAll(user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MODERATOR)
  create(
    @Body(new ZodValidationPipe(create[ResourceName]Schema('en'))) dto: Create[ResourceName]Dto,
    @User() user: RequestUser,
  ): Promise<[ResourceName]Dto> {
    return this.service.create(dto, user);
  }
}
```

## Step 4 — Service Pattern

```ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/modules/database/database.service';
import type {
  [ResourceName]Dto,
  Create[ResourceName]Dto,
  PaginatedResult,
  PaginationQueryType,
} from '@wirdi/shared';
import type { RequestUser } from '@/types/declartion-merging';

@Injectable()
export class [ResourceName]Service {
  constructor(private readonly db: DatabaseService) {}

  async findAll(user: RequestUser): Promise<[ResourceName]Dto[]> {
    return this.db.[resourceName].findMany();
  }

  // Paginated — interceptor spreads PaginatedResult to { success, data, meta }
  async findPaginated(
    query: PaginationQueryType,
    user: RequestUser,
  ): Promise<PaginatedResult<[ResourceName]Dto[]>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.[resourceName].findMany({ skip, take: limit }),
      this.db.[resourceName].count(),
    ]);
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: Create[ResourceName]Dto, user: RequestUser): Promise<[ResourceName]Dto> {
    return this.db.[resourceName].create({ data: dto });
  }
}
```

## Step 5 — Multi-table Writes → Transaction

```ts
async createWithRelations(dto: CreateDto, user: RequestUser) {
  return this.db.$transaction(async (tx) => {
    const parent = await tx.parent.create({ data: dto.parent });
    const child = await tx.child.create({ data: { ...dto.child, parentId: parent.id } });
    return { parent, child };
  });
}
```

## Step 6 — Register Module

Add to `app.module.ts` imports array.

## Rules

- All DTOs/schemas from `@wirdi/shared` — no local DTO files
- Every method must have an explicit return type (DTO or `PaginatedResult<T>`)
- `ZodValidationPipe` on route parameters only (`@Body`, `@Param`, `@Query`)
- `@User()` decorator for request user — never `req.user`
- `@Public()` / `@Roles()` for auth exceptions (guards are global)
- `DatesAsObjects` is backend-only — never import on client
