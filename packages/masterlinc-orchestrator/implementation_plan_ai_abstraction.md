# Implementation Plan - AI Logic Abstraction

Refactor the hardcoded `nlpSelectDepartment` logic from `WorkflowEngine` into `NlpService` to centralize AI/logic decisions and make it more robust (potentially using LLM in the future, or just cleaner code structure now).

## User Review Required

> [!NOTE] 
> This change moves business logic from the workflow engine to the NLP service, which is better for maintainability.

- **Objective**: Abstract `nlpSelectDepartment` logic.
- **Proposed Change**:
    1.  Update `NlpService` to include a `determineDepartment(symptoms: string[]): string` method.
    2.  Update `WorkflowEngine` to call `this.nlp.determineDepartment(...)` instead of its private method.
    3.  (Optional) Enhance `NlpService` to ask the LLM for the department if not found in a static map, or keep the static map but centralised in the NLP service. *For now, I will move the static map to keep behavior consistent but refactored.*

## Verification Plan

### Automated Tests
- [ ] Create a unit test for `NlpService` specifically for `determineDepartment`.
- [ ] Run `npm test` to ensure no regressions in existing tests.

### Manual Verification
- [ ] Since I cannot run the full server environment easily, unit tests will be the primary verification.
