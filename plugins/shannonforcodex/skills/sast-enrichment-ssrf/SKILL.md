---
name: sast-enrichment-ssrf
description: "Transform raw SAST SSRF findings into normalized vulnerability objects. Use when enriching static SSRF results."
---

# sast-enrichment-ssrf

## Queue persistence
`submit_exploitation_queue` merges by stable ID. Use distinct producer namespaces (for example `INJ-VULN-01` and `INJ-SAST-01`); preserve `_sastId`. Identical retries are accepted; conflicting reuse of an ID is rejected without changing the queue. Empty submissions retain existing findings. Reconcile the combined queue in task formation.

Use this skill to enrich SAST SSRF findings into vulnerability objects. Copy `_sastId` exactly; set externally_exploitable only for user-controlled input. Submit one `vulnerabilities` array through `submit_exploitation_queue` with `vuln_class: ssrf`. `references/original-prompt.txt` is archival context only.

## References
- Archival source procedure: `references/original-prompt.txt` (non-executable).

