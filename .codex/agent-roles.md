# Comins agent roles

Use this guide only when selecting a task model or delegated role. Governance
owns this source; adopted checkouts carry its identical `.codex/agent-roles.md`
copy. Base execution remains Sol 6.1/medium with high planning. Unspecified
subagents default to Sol 6.1/high; named role files explicitly override both
model and effort. This role profile belongs to Contract v1.12; module adoption is separate.

| Task | Agent name | Model | Reasoning | Scope |
|---|---|---|---|---|
| Scope, proposal and orchestration | `comins_orchestrator` | Astra | high | Resolve scope and completion, coordinate needed work and consolidate evidence |
| Design review and planning | `comins_planner` | Astra | high | Proportional design, Core/framework boundaries and migration dependencies |
| Difficult design decisions | `comins_architect` | Astra | high | Compatibility, state ownership and conflicting alternatives |
| File/document/log exploration | `comins_explorer` | Sol 6.1 | medium | Bounded read-only evidence gathering |
| Implementation and regression tests | `comins_worker` | Sol 6.1 | high | Implement an agreed change and run affected checks |
| Complex debugging and root cause | `comins_debugger` | Astra | high | Virtualization, drag, async state, type boundaries and difficult conflicts |
| Deterministic check execution | `comins_verifier` | Sol 6.1 | medium | Run agreed lint/type/unit/E2E/build checks and collect exact-target evidence |
| Independent review and acceptance | `comins_reviewer` | Astra | high | Read-only correctness, missing tests and UI/API regression judgment |
| High-risk integration review | `comins_integrator` | Astra | high | Read-only public API, security-boundary and cross-worker integration judgment |
| Deployment, CI and branch operations | `comins_operator` | Sol 6.1 | medium | Execute confirmed procedures within existing target-specific authorization |

## Select and run

Select the actual model and effort in the desktop picker when changing the main
chat's task. Initial proposal/planning and independent acceptance use Astra/high;
implementation uses Sol 6.1/high; routine check execution and operations use
Sol 6.1/medium. Clear, low-risk editing may use the base configuration without a
separate planning or review session. No role is a mandatory workflow stage.

For CLI Astra/high orchestration from a module root, use the verified Governance
`scripts/comins-orchestrator.sh` launcher. It supplies model, execution effort
and planning effort explicitly without changing base configuration.

A stage change or Markdown instruction does not automatically switch an active
model. Choose the named role for a delegated task, or explicitly select model
and effort when the host only exposes generic spawning. Astra is `gpt-6-astra`;
Sol 6.1 is `gpt-6.1-sol`. Never silently substitute an unavailable model.

## Verification and escalation

The implementation owner completes relevant regression checks. A verifier may
execute additional agreed gates and collect logs when useful; assigning one is
optional. Successful evidence remains valid while its source, dependencies and
relevant configuration are unchanged. Reviewers inspect the actual diff, scope,
acceptance criteria and check results and exercise missing high-value UI/API
flows when required; they do not automatically rerun all gates.

Distinguish deterministic test execution from acceptance judgment. A passing
command is evidence for its checked behavior, not full security, browser or
release coverage. Compare expected and actual UI behavior. Report local, CI,
production, failed, skipped and not-run results separately.

Routine status and deployment steps stay with the operator. Unresolved complex
failures, ambiguous merge conflicts or compatibility decisions route to the
architect/debugger within existing scope. This is a judgment-based escalation,
not an automatic retry or model-switch loop. Model roles do not widen approval,
permissions, cost or publication authority.

## Handoff and installation

Use `.codex/agent-handoff.md` once for an assigned delegated task. Pass a bounded
brief containing the actual root, branch/base or dirty snapshot, owned paths,
pre-existing changes, objective, constraints, completion criteria and checks.
Independent reviewers remain read-only; fixes return to the owning implementer.
Do not use the implementation narrative as the only basis for independent review.

From the verified Governance checkout, synchronize managed root guidance/base
config with `comins-reference`, then install project roles:

```sh
node scripts/sync-agent-roles.mjs --target <module-root>
```

Existing conflicting role files require a reviewed migration rather than silent
overwrite. Installation preserves unrelated agents and records source version,
revision, checkout source state and content digests. Project role copies
allow each adopted Comins checkout to resolve this policy independently of
personal defaults. Personal `comins_` copies can be synchronized separately;
other personal agents and global base configuration remain outside this policy.

Repository trust and host support govern whether project config is loaded.
Custom agent files take precedence for their explicit model/effort values.
Begin a fresh session or restart Codex if newly installed roles are not visible;
file validation does not establish actual spawned model behavior or change
already-running chats.

Checked 2026-10-13 against OpenAI's [model guidance](https://developers.openai.com/api/docs/guides/latest-model),
[reasoning effort](https://developers.openai.com/api/docs/guides/reasoning#reasoning-effort)
and [subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents#custom-agents).
These assignments are operational choices, not measured Comins model rankings.
