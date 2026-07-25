# Required Status Checks

This document is the canonical list of the status checks that gate merges into
`main`. The check names below **must** stay in sync with the `contexts` array in
[`scripts/apply-branch-protection.sh`](../scripts/apply-branch-protection.sh),
which programmatically enforces them via the GitHub branch-protection API.

For the full branch-protection policy (reviews, linear history, conversation
resolution, owner bypass) see [`docs/branch-protection.md`](./branch-protection.md).

## Required checks

Every pull request — and every group evaluated by the merge queue — must pass all
of the following before it can merge:

| Check (status context) | Source workflow (`file`) | What it verifies |
|---|---|---|
| `test` | Contract CI (`ci-contract.yml`) | Soroban contract `fmt`, `clippy`, and `cargo test`. |
| `rust-lint` | Lint & Format (`ci-lint.yml`) | `cargo fmt --check` and `cargo clippy -- -D warnings`. |
| `frontend-lint` | Lint & Format (`ci-lint.yml`) | ESLint and Prettier checks on the frontend. |
| `rust-and-contract` | CI (`ci.yml`) | WASM build, coverage (`cargo tarpaulin`), and tests. |
| `frontend` | CI (`ci.yml`) | Frontend lint, a11y, unit tests, and production build. |
| `Cargo Audit` | Dependency Audit (`audit.yml`) | `cargo audit` on contract dependencies. |
| `NPM Audit` | Dependency Audit (`audit.yml`) | `npm audit` on frontend production dependencies. |

> The status context is the **job name** (or `job (matrix)` for matrixed jobs), not
> the workflow name. When renaming a gated job, update this table and the
> branch-protection script in the same change.

### Informational (not yet blocking)

| Check | Source | Notes |
|---|---|---|
| `codecov/project` | Codecov | Project coverage; informational until thresholds are validated. |
| `codecov/patch` | Codecov | Patch coverage (≥80% on changed lines); informational for now. |

These are intentionally **not** in `apply-branch-protection.sh`. See the promotion
steps in [`docs/branch-protection.md`](./branch-protection.md#promotion-to-blocking).

## Merge queue support

The workflows that own the required checks — `ci.yml`, `ci-contract.yml`,
`ci-lint.yml`, `audit.yml`, and `codeql.yml` — trigger on the `merge_group` event
so their checks are re-run against the exact commit the merge queue will merge:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  merge_group:
```

In `ci.yml` and `ci-contract.yml` the path-filter change-detection step is skipped
on `merge_group` events and the gated jobs run unconditionally, so every required
check reports a result to the queue instead of being silently skipped (a skipped
required check would stall the queue).

## Keeping this in sync

1. Edit the `contexts` array in `scripts/apply-branch-protection.sh`.
2. Update the **Required checks** table above to match, exactly.
3. Apply the settings: `bash scripts/apply-branch-protection.sh` (needs an
   authenticated `gh` with admin on the repo).
