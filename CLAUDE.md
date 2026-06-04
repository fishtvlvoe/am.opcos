<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra-*` skills when:

- A discussion needs structure before coding → `/spectra-discuss`
- User wants to plan, propose, or design a change → `/spectra-propose`
- Tasks are ready to implement → `/spectra-apply`
- There's an in-progress change to continue → `/spectra-ingest`
- User asks about specs or how something works → `/spectra-ask`
- Implementation is done → `/spectra-archive`
- Commit only files related to a specific change → `/spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra-apply` and `/spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# 共用套件 Catalog SSOT

opcos.me（母站 monorepo）的 `pnpm-workspace.yaml` catalog 是共用套件版本的唯一真實來源（SSOT）。

- AM 的 `pnpm-workspace.yaml` catalog 為**從 opcos.me 同步的下游副本**。
- **禁止**在 AM 獨立修改 catalog 版本（會造成版本漂移，等同第二個分歧源）。
- **同步時機與方向**：發現 catalog 與 opcos.me 不一致時，從 opcos.me 重新同步（複製其 catalog 段）；方向永遠 opcos.me → AM，不反向修改 opcos.me。
- 2026-05-27 確認：AM catalog 與 opcos.me 完全一致（pnpm-workspace.yaml 97 行 diff 無差異）。
