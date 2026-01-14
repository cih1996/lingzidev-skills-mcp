---
name: project-norms
description: Capture and apply project-wide norms or prohibitions when the user states global rules (e.g. "不要", "禁止", "别", "不许", "必须", "只能") that should persist across future projects, scoped by framework (vue/react/etc). Use when a user wants to record, list, or apply framework-specific global rules, or when starting a new task that should respect previously recorded norms.
---

# Project Norms

## Overview
Record user-stated global rules into the MCP store and reapply them for future tasks in the same framework.

## Workflow

### 1) Detect rule candidates
Treat a statement as a candidate rule when it is a strong global directive, typically containing keywords like:
- 不要, 禁止, 别, 不许, 必须, 只能, 统一, 全局规范

Also treat it as global if the user says it applies to the whole project (e.g. “全局规范”, “整个项目都要”).

### 2) Confirm scope and framework
If the statement could be feature-specific, ask one short clarification:
- “这是整个项目的规范还是某个功能的要求？”

If framework is not explicit, infer from the current project context. If still unclear, ask:
- “这条规范要按哪个框架记录？例如 vue/react？”

### 3) Record the rule in MCP
Call MCP tool `record_rule` with:
- `text`: the normalized rule text in Chinese (or bilingual if user used English)
- `framework`: lowercase framework name (e.g. `vue`)
- `scope`: use `project` for global rules, `feature` for feature-only rules
- `strength`: use `forbid` for “不要/禁止/不许”, `avoid` for softer guidance, `prefer` for positive preferences
- `tags`: optional, short labels like `ui`, `icons`, `imports`
- `source`: optional, e.g. “user-global”

If the rule is feature-only, do not store it unless the user explicitly wants it persisted.

### 4) Apply rules on new requirements
When the user introduces a new requirement for a project with a known framework, call MCP `list_rules` with:
- `frameworks`: array containing the framework (e.g. `["vue"]`)
- `scope`: `project`
- `include_generic`: true

Summarize the applicable rules briefly and ensure your plan/code respects them.

## Example behaviors
- User: “不要用字体图标，太丑了。” -> record as `forbid`, scope `project`, framework `vue` (if current project is vue).
- User: “这个页面不要用字体图标。” -> ask if global or feature-specific before recording.
- New task in Vue project -> list and apply all `project` rules for `vue` (plus `generic`).

## Output expectations
- Acknowledge when a rule is recorded.
- If a rule is applied, mention which rules you are following.
- Keep confirmations short and avoid over-explaining.
