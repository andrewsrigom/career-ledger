# Data Model

Career Ledger separates source evidence, chronological activities, workstreams, milestones, achievements, derived career material, public candidates, and approved public records.

## Private scan

A scan is a deterministic snapshot of local Git metadata:

- project ID and configured path;
- checked-out branch, current `HEAD` when it resolves, and the selected scan reference;
- scan range;
- commits attributed to configured Git identities;
- changed file names and diff statistics;
- uncommitted status;
- extension counts;
- warnings and previous scan state.

A scan is evidence for analysis, not a public record.

When a recovered checkout has an unborn `HEAD` but still has commits reachable from a local, remote, or tag reference, the scanner selects a deterministic reachable fallback and records a warning. It still fails closed when no commit is reachable from any reference.

An explicit all-reference scan can cover retained local branches, remote branches, and tags when the current branch does not contain the complete review period. It excludes stashes and records that it did not advance the normal single-head incremental state.

Schema: `schemas/scan.schema.json`

## Private activity

An activity is a dated unit of meaningful professional work. It records what changed, how the work progressed, which professional categories it demonstrates, what evidence supports it, and how each evidence item was obtained.

Every activity also has one or more normalized technical `domains`: `frontend`, `backend`, `devops`, `infrastructure`, `data`, `ai-ml`, `mobile`, `desktop`, `embedded`, `quality-engineering`, `security`, `developer-experience`, `product-design`, or `other`. These are aggregatable execution surfaces, distinct from semantic `types` and descriptive `areas`. Full-stack work uses both `frontend` and `backend`; it does not use a separate full-stack tag.

A derived domain mix gives every selected activity a total weight of one and divides that weight equally across its unique domains. For example, an activity tagged `frontend` and `backend` contributes `0.5` to each. Percentages derived this way must be labeled **recorded activity mix**: they describe the distribution of meaningful ledger activities in the selected project and period, not hours, lines of code, difficulty, ownership, or exact effort.

Activities use one of four significance levels:

- `activity`: normal meaningful professional work;
- `notable`: unusually informative scope, complexity, ownership, or expertise;
- `milestone`: a supported completion, delivery, release, or transition;
- `achievement`: a meaningful result with at least one confirmed outcome.

Evidence provenance is recorded as `observed`, `provided`, `derived`, `inferred`, or `unverified`. Inferred and unverified evidence cannot by itself support a milestone or achievement.

Schema: `schemas/private-activity.schema.json`

## Private workstream

A workstream groups related activities around a larger problem, responsibility, technical objective, or system boundary. It preserves the activity chronology and may record reached milestones, confirmed achievements, emerging career signals, and selective enrichment questions.

Workstreams retain both detailed internal context and an optional public-safe framing. Their `activityIds` are validated bidirectionally against the activity records, and milestone or achievement evidence references must resolve inside the same workstream.

Schema: `schemas/private-workstream.schema.json`

## Legacy private initiative

A private initiative is the version 1 workstream format. Existing ignored drafts and initiatives remain valid and are not mechanically migrated because turning contribution summaries into dated activities would require unsupported inference.

Important fields include:

- attribution confidence;
- private evidence references;
- contributions supported by evidence;
- potential outcomes and confirmation status;
- sensitivity notes;
- lifecycle status.

Schema: `schemas/private-initiative.schema.json`

New analysis should create private activities and workstreams. Legacy initiatives remain available as private historical context until the owner revisits them with sufficient evidence.

## Private career projection

Resumes, portfolio narratives, professional summaries, interview stories, and evidence-gap reports are derived views of the ledger. Drafts belong under `.career/private/projections/` and do not become independent sources of experience.

Tailoring changes evidence selection and emphasis. It must not change facts, attribution, outcome status, or privacy.

## Public candidate

A public candidate has already been sanitized but is still private. It lives in `.career/private/public-candidates/` until explicit approval.

Candidates use the same shape as approved entries, projects, or the resume, but their publication status is `candidate`.

## Approved public entry

An entry represents a meaningful activity, notable contribution, milestone, achievement, investigation, launch, improvement, architecture effort, learning effort, or leadership contribution.

A public entry must include:

- stable ID and slug;
- title, summary, and period;
- kind and lifecycle status;
- optional explicit significance and semantic activity types;
- contributions;
- areas and optional technologies;
- explicit publication approval metadata.

Outcomes are optional. Empty outcomes are better than invented outcomes.

Older approved entries without significance metadata are normalized to `activity`, the least promotional level, in generated datasets.

Schema: `schemas/public-entry.schema.json`

## Approved public project

A project represents a product, platform, open-source tool, experiment, or other coherent body of work. It can reference multiple entries.

Schema: `schemas/public-project.schema.json`

### Optional project presentation

`presentation.preview` is either an abstract diagram (`kind: "diagram"`, `alt`) or an explicitly owner-approved local image. Image metadata requires `src`, `alt`, `width`, `height`, and `approval: { approvedBy: "owner", reviewedAt: "YYYY-MM-DD" }`. This image review is separate from approval to publish the candidate.

Image paths must match `assets/projects/<safe-name>.webp` or `.avif`. Width is 320–2400 px; height is 180–1800 px. The build checks actual encoding, regular-file status, symlink components, and the 250 KiB size cap. A project with PT-BR localization and explicit presentation metadata also needs `localizations.pt-BR.previewAlt`.

No preview metadata is required to make a project usable. Missing approved imagery produces an authored, clearly abstract editorial diagram. A private inventory under `.career/private/media-review/` stores references and review status only; discovery never copies source assets.

### Optional recorded activity mix

Project and resume candidates accept an optional `activityMix`:

```json
{
  "basis": "recorded-activities",
  "activityCount": 10,
  "items": [
    { "domain": "frontend", "percentage": 60 },
    { "domain": "backend", "percentage": 40 }
  ]
}
```

The basis and positive sample count are mandatory. Domains are unique and normalized; percentages must total 100 within rounding tolerance. Values never stand for hours, effort, code share, or ownership.

The localhost candidate preview can derive a portfolio-wide mix from private activity domain tags, showing only the aggregate, the sample count, and the weighting explanation. A public build never performs that calculation or reads those activity records. A public mix must be explicitly reviewed and approved as part of its project or resume record.

Schema definitions: `schemas/public-presentation.schema.json`

## Approved public resume

The optional resume record extends the portfolio with professional experience, selected outcomes, skills, and education. It is one coherent approval unit stored at `content/public/resume.json`.

The resume record includes:

- a stable experience start date used for deterministic completed-year calculation;
- a concise professional summary;
- selected outcomes with evidence levels;
- ordered professional experiences with contributions and outcomes;
- core skills and education;
- optional relationships from experiences to approved projects.

The build uses the dataset `updatedAt` value when calculating completed experience years. It never uses the current build clock.

Schema: `schemas/public-resume.schema.json`

## Localized public copy

Profile, taxonomy, entry, project, and resume records may include an optional `localizations.pt-BR` object. A localization contains only translated presentation fields; stable IDs, slugs, relationships, dates, technologies, evidence levels, and publication metadata remain canonical.

Translated lists must match the source list structure. Resume experience and education translations reference the canonical item IDs. Validation rejects missing, duplicated, unknown, or structurally misaligned localized items.

English remains at the existing root routes. Brazilian Portuguese is generated under `/pt-br/`, including localized HTML, JSON, RSS, manifest metadata, canonical URLs, and reciprocal `hreflang` links. Missing optional localizations fall back to the canonical English copy.

Schema definitions: `schemas/public-localizations.schema.json`

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
