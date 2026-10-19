# Comins delegated handoff

Read once for the assigned delegated task. Role selection and installation belong
to [agent roles](agent-roles.md); an already assigned worker need not load them.

Each brief identifies the independent Git root, branch, base revision, objective,
owned paths, pre-existing changes to preserve, constraints, completion criteria,
and applicable checks. Return complete, blocked, or stopped status, the actual
model/effort when observable, changed files, verification target and results,
and unresolved issues. A short message is sufficient; no tracker or per-step
report is required. The same HEAD does not identify an unchanged dirty tree.
Report unavailable runtime metadata rather than inferring it from file presence.
Do not silently substitute an unavailable model; report the affected role.

Existing authorization and Contract stage rules apply. Delegate only independent
work when requested or authorized by applicable instructions. Avoid concurrent
edits to the same files. A role does not add approval, planning, review, or
verification stages. Keep every role at or below high reasoning.

## Recovery and completion

The orchestrator compares returned changes and evidence with the assigned scope.
Reviewers and integration reviewers remain read-only; route authorized fixes to
the owning worker/debugger or handle them within the orchestrator's scope. Reuse
existing approval instead of adding a review-to-fix approval stage.

Apply the Contract's retry rules to the affected check. Product defects require
an in-scope fix; test-contract failures require checking expectations against
approved requirements, not weakening assertions to pass. Environment failures
require an environment correction or evidence of a transient cause. Without a
new hypothesis, correction, environment change, or supported transient cause,
do not repeat the same failed command. Preserve successful evidence and follow
the existing recurring-defect root-cause rule rather than imposing a retry count.

A timeout alone proves neither failure nor completion. Check the agent's actual
status; confirm it has stopped writing before reassigning the same paths.
On cancellation, unavailable authority/environment, or a scope/ownership conflict,
stop only affected work and preserve changes, completed checks, and the blocker.
On resumption, inspect current files and remaining work instead of restarting
completed stages or treating old evidence as current without checking its target.

A subtask is complete when its assigned deliverable and applicable required checks
are satisfied. The orchestrator reports overall completion only when the requested
scope is fulfilled and no outstanding agent can still change that result.
Missing or failed required checks remain blocked or partial, not passed. State
the verification target and any uncovered changes; unrelated preserved edits do
not become part of the completion claim. Reporting a review finding does not
mean the corresponding implementation fix is complete.
