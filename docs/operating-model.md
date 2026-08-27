# Career Ledger operating model

## North star

Career Ledger makes a person's professional trajectory observable. It preserves enough evidence that meaningful work does not disappear, then expresses that work with the strongest truthful language the evidence supports.

It is a chronological career record, not primarily a resume generator and not a mirror of commit history.

The ledger should answer:

- What is this engineer working on and investigating?
- Which larger responsibilities and workstreams are emerging?
- What moved meaningfully forward?
- Which results are supported strongly enough to be achievements?
- What evidence supports a technology, responsibility, or professional theme?
- Which evidence is relevant to a portfolio, target role, or interview?
- Where is important career evidence weak or under-documented?

## Canonical hierarchy

```text
Source evidence
    ↓
Activity
    ↓
Workstream
    ↓
Milestone
    ↓
Achievement
    ↓
Career narrative
    ↓
Timeline / project / portfolio / resume / interview
```

Each layer has a different job. Do not collapse all work into resume bullets.

### Source evidence

Code, commits, diffs, tests, configuration, architecture, documentation, releases, issues, deployment information, and owner context are raw material. Evidence may remain detailed inside the private boundary.

### Activity

An activity states what meaningful professional work occurred at a point in time. It may describe investigation, implementation, design, architecture, testing, migration, reliability, research, leadership, release work, or other material engineering effort. It does not require measurable impact.

Each activity classifies its technical execution surface with one or more normalized domains. Use multiple domains only when each was materially changed; represent full-stack work with both `frontend` and `backend`. Domain percentages are a weighted mix of recorded activities, never an estimate of time or effort.

### Workstream

A workstream connects activities that address the same larger problem, responsibility, objective, or system boundary. It evolves as new evidence appears and preserves each meaningful progression point.

### Milestone

A milestone is supported progress: a release, completed transition, working version, delivery stage, or other meaningful movement. It does not require a business metric.

### Achievement

An achievement is a meaningful result supported by evidence. Achievements are rarer than activities and require a confirmed outcome. Completing implementation alone does not establish adoption, reliability, revenue, cost savings, performance improvement, or user impact.

### Career narrative

Repeated meaningful evidence may support themes such as architecture, authentication, developer experience, accessibility, product engineering, testing, reliability, or technical leadership. A single trivial activity does not establish expertise.

## Capture rules

Capture work that demonstrates a meaningful professional signal. Ignore trivial implementation noise as an independent record, but retain it as evidence when several small changes collectively advance a meaningful workstream.

Ask whether something professionally meaningful changed since the prior activity. If not, update evidence without creating timeline noise.

Use one dominant professional signal per public entry. Split materially different signals when that improves clarity; keep related implementation details together when splitting would recreate a commit feed.

For domain aggregation, count every selected activity with total weight one and divide that weight equally across its unique domains. Always name the result **recorded activity mix** and state the project and period used to calculate it.

## Significance

Classify timeline material conservatively:

- `activity`: normal meaningful work;
- `notable`: especially useful scope, complexity, ownership, or expertise;
- `milestone`: a supported completion, release, transition, or delivery stage;
- `achievement`: a supported result, preferably with impact, adoption, scale, or measurement.

Do not promote an item to make the timeline appear more impressive.

## Provenance and claims

Preserve how a claim became known:

- `observed`: directly present in available evidence;
- `provided`: explicitly supplied by the owner;
- `derived`: calculated directly from reliable evidence;
- `inferred`: a cautious semantic interpretation;
- `unverified`: useful but not yet supported.

Provenance is distinct from a public outcome's evidence level. Public outcomes use `observed`, `measured`, `self-reported`, or `public` to describe the kind of support that can accompany the claim.

Never fabricate metrics, adoption, production status, causality, ownership, business impact, or technical qualities. Preserve approximation and uncertainty. A strong qualitative statement is better than a false number.

## Missing information

Incomplete information does not block capture:

1. Inspect surrounding code, tests, history, documentation, configuration, and architecture.
2. Derive directly supported facts such as scope, component counts, packages, integrations, environments, or migration boundaries.
3. Use credible proxies such as scale, adoption breadth, system count, technical complexity, or capability enabled.
4. Describe the observable qualitative consequence without inventing impact.
5. Ask a specific question only when the answer could materially affect impact, ownership, scale, public safety, accuracy, or relevance.
6. Continue with the strongest truthful record and preserve the gap for later enrichment.

## Ownership

Choose verbs that match the evidence: `implemented`, `contributed`, `designed`, `led`, `owned`, or `investigated`. Code can show that an implementation exists and Git can show authorship; neither proves sole ownership, leadership, business impact, or production success.

## Projection rules

- **Timeline:** optimize for recency, continuity, meaningful activity, progression, and authenticity.
- **Project page:** explain context, responsibility, decisions, workstreams, milestones, outcomes, and technologies.
- **Portfolio:** select the strongest evidence that reveals technical depth and sustained professional themes.
- **Resume:** select diverse evidence for a target role, ranked by relevance, impact, evidence strength, ownership, scale, recency, and distinctiveness.
- **Interview story:** expand evidence into Context, Problem, Constraints, Decision, Action, Result, Tradeoffs, and Learning.

Tailoring changes selection and emphasis. It does not rewrite reality to resemble a job description.

## Writing standard

Use restrained, factual, specific language. Let evidence create the impression. Prefer action, subject, scope, outcome, and mechanism when those elements are known, but do not force every timeline item into a resume framework.

Avoid unsupported adjectives such as scalable, secure, performant, resilient, maintainable, accessible, or enterprise-grade. State the implementation evidence that would justify the adjective.

Technologies are metadata unless naming one explains complexity, a material technical decision, or relevant expertise.

## Public quality gate

Before publication, verify truth, privacy, attribution, specificity, professional signal, clarity, density, credibility, naturalness, duplication, and evidence. Generalize confidential identity without stripping away engineering substance. Keep private identity and raw evidence in the private ledger.

Every publication still requires a sanitized candidate, privacy and claim review, and explicit owner approval.
