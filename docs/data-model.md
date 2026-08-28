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

### Work context and ordering

Optional `workContext` is `professional` for confirmed client/company work or `independent` for an independent project. Omit it when the context is unknown. Project status describes the owner's contribution, not whether a product's website is still available.

Optional `ownership` is `end-to-end` or `shared`. It records explicitly supported responsibility across the product lifecycle, not sole authorship or a percentage. Omit it when scope is unconfirmed. Independent context, stack size, Git authorship and activity percentages never imply end-to-end ownership. Like all candidate metadata, it remains in the existing approval workflow.

The homepage, directories, taxonomy project lists and localized datasets share the deterministic editorial order from `scripts/lib/project-ranking.ts`. All available projects render in one sequence. The legacy `featured` flag is retained for compatibility but does not hide records or override ranking. Four internal treatments (flagship, featured, standard, compact) vary typography, context and image size; neither numeric scores nor diagnostic signals are serialized into JSON or client scripts.

The heuristic uses existing taxonomy slugs from projects and related entries, explicit ownership, recorded contribution/outcome items, and usable images. It does not parse marketing copy or count technologies. Current weights:

| Signal | Points |
| --- | --- |
| Frontend and backend areas together | +24 |
| Backend / backend plus systems, data, security or infrastructure | +18 / +28 |
| Systems/data/security/infrastructure without backend | +14 |
| AI area | +24 |
| Explicit end-to-end scope | +24 |
| Recency: at most 90 / 180 / 365 days / 3 years | +12 / +10 / +8 / +3 |
| Older than 3 / 5 years | −8 / −18 |
| One usable image / more than one | +18 / +22 (capped) |
| Explicit abstract diagram without an image | +4 |
| Recorded contributions | +4 each, capped at +12 |
| Outcomes: self-reported / observed or measured | +5 / +8 each, capped at +10 |
| No contributions, outcomes or explicit ownership | −16 |
| At least 75% shared entry IDs with a higher-ranked project | −24 once |
| One substantive active professional project tied to a current resume role | +50 |

The anchor bonus applies only to the strongest qualifying candidate with a pre-bonus score of at least 65; no general company/client priority exists. Highest score leads; remaining scores of 105+ receive featured treatment, 48+ standard, and lower scores compact. Every record remains visible. Overlap is compared by referenced entry IDs, not common stacks or industries. Recency uses the latest related entry end/start date, falling back to an explicitly related resume period only when no entry date exists. The reference date is the dataset's validated update date, never the build clock. Dates and stable IDs resolve ties without translated names. Role dates do not assert project inception or duration.

Ranking never reads repositories, Git history, private storage, environment secrets or network APIs. Public generation evaluates only approved data and approved visuals. The existing preview adapter may re-rank its already validated candidate dataset after attaching isolated review images; those images never influence the public build. Image presence is a bounded editorial proxy, not an automated quality assessment or proof of authorship. Incomplete records can rank lower until their scope, dates, contributions or images are reviewed through the existing workflow.

### Optional project presentation

`presentation.preview` is either an abstract diagram (`kind: "diagram"`, `alt`) or an explicitly owner-approved local image. Image metadata requires `src`, `alt`, `width`, `height`, and `approval: { approvedBy: "owner", reviewedAt: "YYYY-MM-DD" }`. This image review is separate from approval to publish the candidate.

`presentation.gallery` optionally contains 1–6 approved images with the same visual fields plus `caption` and a bounded `source` (web, owner-provided, local-capture or project-asset). It preserves the reviewed screenshot sequence on the public project page; the first image supplies the homepage caption. Each image has its own approval and unique source path. PT-BR galleries require a matching `localizations.pt-BR.gallery` array of `alt`/`caption` pairs. All images are staged from explicitly referenced public assets, never from the private manifest; encoded WebP dimensions must match the declaration. Original private evidence locations remain excluded.

Image paths must match `assets/projects/<safe-name>.webp` or `.avif`. Width is 320–2400 px; height is 180–1800 px. The build checks actual encoding, regular-file status, symlink components, and the 250 KiB size cap. A project with PT-BR localization and explicit presentation metadata also needs `localizations.pt-BR.previewAlt`.

No preview metadata is required to make a project usable. Missing imagery can use a typographic row without an empty image slot; the opening project and explicitly authored diagram previews retain the clearly abstract editorial composition. A private inventory under `.career/private/media-review/` stores references and review status only; discovery never copies source assets.

Owner-requested screenshot preparation may additionally store selected WebP derivatives in `.career/private/media-review/images/` and describe them in `preview.json`. This manifest is independent of public project records: a preview-only `reviewMedia` projection adds localized alternative text, captions, dimensions, and source provenance to the isolated dataset. Web captures record their source URL and capture date; supplied images record their provision date without inventing a capture date. A `local-capture` source records only `capturedAt`; a `project-asset` source records only `collectedAt`, not an assumed historical capture date. These local source kinds reject URLs and paths; original locations remain in separate private review notes. No approval metadata is inferred. Unknown projects, unsafe paths, symlinks, private text, mismatched dimensions, and images over 250 KB are rejected. Public schemas reject this review-media field.

For a web review image, `source.url` is required but may be explicitly `null` to withhold the source location. Its actual address remains in private review notes, while the gallery renders the capture date without a source link. Non-null URLs still require the same public HTTPS format and full privacy audit; omission, empty strings, and invalid dates are rejected.

### Optional work distribution

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

The basis is mandatory. For `recorded-activities`, a positive sample count is mandatory; values describe activity distribution, not hours, effort, code share, or ownership. Domains are unique and normalized; percentages must total 100 within rounding tolerance.

An explicitly owner-supplied work distribution uses the same field with `basis: "owner-estimate"` and `items`, but must not include `activityCount`. The frontend labels that source in the portfolio's first-person voice as “My estimate.” / “Minha estimativa.” and omits the recorded-activity count and weighting explanation. Preserve the owner's exact percentages, keep the confirmation in private context, and never overwrite an owner estimate with a later automatic projection. This source distinction does not grant publication approval or turn an estimate into measured hours.

The localhost candidate preview can derive a portfolio-wide mix from private activity domain tags, showing only the aggregate, the sample count, and the weighting explanation. A public build never performs that calculation or reads those activity records. A public mix must be explicitly reviewed and approved as part of its project or resume record.

For an owner-requested project work-distribution chart, a private projection may focus on the recorded `frontend`, `backend`, and delivery (`devops`/`infrastructure`) surfaces. Collapse delivery tags before weighting, then divide one unit per qualifying activity equally among its distinct surfaces. Cross-cutting tags remain in the canonical activity but do not introduce extra slices in this focused projection; activities without a selected surface are outside its sample. Store only the resulting percentages, qualifying activity count, and `recorded-activities` basis in the existing candidate `activityMix`. Keep the project-to-source mapping, record selection, and method in private review notes. Never infer a distribution from technology counts, repository size, or role titles, and never change canonical tags to obtain a preferred percentage.

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

### Contact channels

The optional resume `contact` object holds the owner's selected `email`, international `phone` (E.164, including `+`), optional `whatsapp` flag, and a required `links` array (up to eight HTTPS social profiles). Every field is optional except the array; absent channels produce no placeholder or inactive control. The WhatsApp flag requires a phone and must never be inferred. Email URI characters are encoded, phone links use `tel:`, and social links have no credentials or tracking query. Both languages keep identical contact destinations.

Keep new contact details in the existing resume candidate until owner review; do not recover personal details from Git identities or guess social usernames. The frontend may also use already-approved `profile.links` when no resume contact object exists. An empty contact section is omitted.

### Recommendation excerpts

The optional resume `recommendations` list holds up to twelve attributed LinkedIn excerpts: stable `id`, `name`, historical work `relationship`, exact English `quote` (30–700 characters), canonical HTTPS `profileUrl` and `sourceUrl`. Quotes are not converted into owner-authored impact or leadership claims. Publication dates are not presentation fields.

`localizations.pt-BR.recommendations` contains only `id`, `quote`, and `relationship`; when supplied it must match every source ID exactly once. The renderer labels translations, retaining canonical authors and links. Missing translations fall back to English and retain `lang="en"`. A derived `translated` flag exists only in localized output, never in source records.

An optional public `portrait` requires a square 64–512px local WebP under `assets/portraits/`, declared `width`/`height`, and `approval: { approvedBy: "owner", reviewedAt: "YYYY-MM-DD" }`. Only referenced, approved portraits are staged; encoded dimensions must match and files must not exceed 50 KB. Absent portraits use initials.

Before approval, use the existing resume candidate and optional `portraits` entries in the private media-review manifest: `{ recommendationId, image }`. The image uses the same provenance and bilingual text contract as project review media, with independent portrait bounds. Its ID must refer to a loaded recommendation. The preview adapter supplies validated bytes and `reviewPortraits`; public builds reject that field, including an empty map. This does not relax project image limits or authorize publication.

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
