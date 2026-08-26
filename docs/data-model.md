# Data Model

Career Ledger separates evidence, initiatives, public candidates, and approved public records.

## Private scan

A scan is a deterministic snapshot of local Git metadata:

- project ID and configured path;
- branch and current `HEAD`;
- scan range;
- commits attributed to configured Git identities;
- changed file names and diff statistics;
- uncommitted status;
- extension counts;
- warnings and previous scan state.

A scan is evidence for analysis, not a public record.

Schema: `schemas/scan.schema.json`

## Private initiative

A private initiative groups related activity into a meaningful workstream.

Important fields include:

- attribution confidence;
- private evidence references;
- contributions supported by evidence;
- potential outcomes and confirmation status;
- sensitivity notes;
- lifecycle status.

Schema: `schemas/private-initiative.schema.json`

## Public candidate

A public candidate has already been sanitized but is still private. It lives in `.career/private/public-candidates/` until explicit approval.

Candidates use the same shape as approved entries or projects, but their publication status is `candidate`.

## Approved public entry

An entry represents a meaningful initiative, investigation, launch, improvement, architecture effort, learning effort, or leadership contribution.

A public entry must include:

- stable ID and slug;
- title, summary, and period;
- kind and lifecycle status;
- contributions;
- areas and optional technologies;
- explicit publication approval metadata.

Outcomes are optional. Empty outcomes are better than invented outcomes.

Schema: `schemas/public-entry.schema.json`

## Approved public project

A project represents a product, platform, open-source tool, experiment, or other coherent body of work. It can reference multiple entries.

Schema: `schemas/public-project.schema.json`

## Taxonomy

Taxonomy defines canonical area and entry-kind labels. Public records must use those exact labels so aggregation remains consistent.

Schema: `schemas/taxonomy.schema.json`

## Evidence levels

Public outcomes use one of these levels:

- `observed`: a concrete deliverable or state can be directly verified;
- `measured`: a result is supported by an explicit metric;
- `self-reported`: the owner confirms the result but cannot publish the underlying evidence;
- `public`: a public source supports the result.

The label does not appear as a confidence badge on the public site. It exists to keep authoring honest.

## Stable identifiers

IDs and slugs should remain stable after publication. Changing a slug breaks existing URLs.

Use lowercase kebab-case:

```text
authentication-architecture-improvements
```

## Dates

Use ISO dates:

```json
{
  "start": "2026-06-01",
  "end": "2026-08-25",
  "label": "June–August 2026"
}
```

Use `null` for an active end date.
