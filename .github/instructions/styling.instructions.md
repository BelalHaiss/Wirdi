---
applyTo: 'apps/client/**'
---

# Styling Rules

## Tailwind v4

- Config source: `src/index.css` (`@import 'tailwindcss'`, `@theme inline`, `@custom-variant`)
- Use semantic tokens: `bg-background`, `text-foreground`, `border-border`, etc.
- No arbitrary values unless required for Radix/Base UI CSS variables
- Minimal layout — simple flexbox, no unnecessary wrappers

## shadcn

- Add components via shadcn MCP only
- Extend before creating from scratch; never override shadcn internals

## CVA

- Use `cva` for component variants (colors, sizes, states)
- Keep variant definitions co-located with the component (same pattern as `Button`, `Badge`)

## Design

- Follow branding tokens — ignore colors from attached images/mockups
- No inline styles
- Consistent spacing via tokens only

## Semantic Action Colors

Every interactive action must use its semantic color — never default to `primary` (blue) for actions:

| Intent | Color token | Examples |
|--------|-------------|----------|
| **Edit / Update** | `warning` (yellow) | edit button, pencil icon button |
| **Delete / Remove** | `danger` (red) | delete button, trash icon button |
| **Save / Submit / Confirm / Create** | `success` (green) | save button, submit button, confirm dialog action |
| **Navigation / Primary CTA** | `primary` (blue) | nav links, "add new" primary action |
| **Cancel / Close** | `muted` | cancel button, close button |

### Rules

- **Always** pass `color='warning'` on buttons that trigger edit/update flows
- **Always** pass `color='danger'` on buttons that trigger delete/remove flows
- **Always** pass `color='success'` on form submit/save buttons and confirm dialog actions
- **Never** use manual Tailwind color classes like `text-red-600` for action semantics — use `color='danger'` instead
- `ConfirmDialog` with `intent='destructive'` → red; default intent → green (success)
