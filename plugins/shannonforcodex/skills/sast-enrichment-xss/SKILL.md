---
name: sast-enrichment-xss
description: "Transform raw SAST XSS findings into normalized vulnerability objects. Use when enriching static XSS results."
---

# sast-enrichment-xss

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill to enrich SAST XSS findings into vulnerability objects with sink-context payloads. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: xss`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

