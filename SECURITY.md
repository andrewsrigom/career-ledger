# Security and Privacy

Do not report private client information, credentials, internal URLs, repository paths, or raw work evidence in a public issue.

For a vulnerability in the publishing pipeline, create a private security advisory in the GitHub repository or contact the repository owner through a private channel.

The most important security invariant is that `content/public/` is the only source consumed by the public build. Any path that allows `.career/private/`, `career.local.json`, local repositories, or environment secrets to influence public output without explicit review is a security defect.
