# Prepare a public candidate

Use `$career-sanitize-entry` on `<private-activity-or-workstream-id>`.

Create a sanitized candidate under `.career/private/public-candidates/`. Remove confidential details, keep attribution conservative, omit unsupported outcomes, and check for duplication with existing public records.

Classify the candidate as `activity`, `notable`, `milestone`, or `achievement` using the least promotional level supported by the private evidence, and preserve its semantic activity types.

Then use `$career-review-publication` on the candidate. Do not approve or publish it.
