---
name: sast-enrichment-injection
description: "Transform raw SAST injection findings into normalized vulnerability objects with sink-tailored payloads. Use when enriching static results."
---

# sast-enrichment-injection

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill to enrich SAST injection findings. The rules below are authoritative; reference files are archival context only.

## Rules
- Tailor `witness_payload` to the actual sink code (e.g. LIKE-context needs `%' OR '%'='`, not generic `' OR 1=1--`).
- Set `slot_type` from the real SQL/command/file context; list path sanitizers in `sanitization_observed` with why they fail in `mismatch_reason`.
- `externally_exploitable=true` only for user-controlled HTTP input (params, headers, body, cookies).
- Copy `_sastId` exactly; never invent or renumber it.
- Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: injection` and the required queue fields.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).
- Shared procedure: original repo `prompts/shared/exploitation/_sast-enrichment-procedure.txt` (archival).

