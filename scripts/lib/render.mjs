function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeXml(value) {
  return escapeHtml(value);
}

function formatDate(value, options = {}) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('en', options).format(date);
}

function kindLabel(kind, data) {
  return data.taxonomy.kinds.find((item) => item.value === kind)?.label ?? kind;
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function createMaps(data) {
  return {
    areaByLabel: new Map(data.taxonomy.areas.map((area) => [area.label, area])),
    entryById: new Map(data.entries.map((entry) => [entry.id, entry])),
    projectById: new Map(data.projects.map((project) => [project.id, project]))
  };
}

function renderTags(values, context, type = 'area') {
  const { urls, maps } = context;
  return `<ul class="tag-list" aria-label="${type === 'area' ? 'Engineering areas' : 'Technologies'}">${values.map((value) => {
    if (type === 'area') {
      const area = maps.areaByLabel.get(value);
      if (area) {
        return `<li><a class="tag" href="${urls.href(`areas/${area.slug}/`)}">${escapeHtml(value)}</a></li>`;
      }
    }
    return `<li><span class="tag tag--plain">${escapeHtml(value)}</span></li>`;
  }).join('')}</ul>`;
}

function renderEntryCard(entry, context, options = {}) {
  const { compact = false } = options;
  return `<article class="entry-card${compact ? ' entry-card--compact' : ''}" data-entry data-kind="${escapeHtml(entry.kind)}" data-search="${escapeHtml(`${entry.title} ${entry.summary} ${entry.areas.join(' ')} ${entry.technologies.join(' ')}`.toLowerCase())}">
    <div class="entry-card__meta">
      <span>${escapeHtml(entry.period.label)}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(kindLabel(entry.kind, context.data))}</span>
      ${entry.status === 'active' ? '<span class="status-dot">Active</span>' : ''}
    </div>
    <h3 class="entry-card__title"><a href="${context.urls.href(`entries/${entry.slug}/`)}">${escapeHtml(entry.title)}</a></h3>
    <p>${escapeHtml(entry.summary)}</p>
    ${renderTags(entry.areas.slice(0, compact ? 3 : 5), context)}
  </article>`;
}

function renderProjectCard(project, context) {
  return `<article class="project-card">
    <div class="project-card__meta">
      <span>${escapeHtml(project.kind)}</span>
      <span class="status-label">${escapeHtml(statusLabel(project.status))}</span>
    </div>
    <h3><a href="${context.urls.href(`projects/${project.slug}/`)}">${escapeHtml(project.name)}</a></h3>
    <p>${escapeHtml(project.summary)}</p>
    ${renderTags(project.areas.slice(0, 4), context)}
  </article>`;
}

function renderExternalLinks(links) {
  if (!links.length) return '';
  return `<ul class="external-links">${links.map((link) => `<li><a href="${escapeHtml(link.href)}" rel="noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`;
}

function renderNavigation(active, context) {
  const items = [
    ['home', '', 'Highlights'],
    ['timeline', 'timeline/', 'Timeline'],
    ['areas', 'areas/', 'Areas'],
    ['projects', 'projects/', 'Projects'],
    ['about', 'about/', 'About']
  ];
  return `<nav class="site-nav" aria-label="Primary navigation">
    ${items.map(([key, target, label]) => `<a href="${context.urls.href(target)}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Use dark theme"><span aria-hidden="true">◐</span></button>
  </nav>`;
}

function renderLayout(options, context) {
  const {
    title,
    description,
    path = '',
    active = '',
    body,
    pageType = 'website',
    structuredData = []
  } = options;
  const { data, urls } = context;
  const fullTitle = title === data.profile.name ? `${data.profile.name} — Career Ledger` : `${title} — ${data.profile.name}`;
  const canonical = urls.absolute(path);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.profile.name,
      jobTitle: data.profile.headline,
      address: data.profile.location,
      url: urls.absolute('')
    },
    ...structuredData
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="theme-color" content="#f4f1e9">
  <meta property="og:type" content="${escapeHtml(pageType)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="${urls.href('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="manifest" href="${urls.href('manifest.webmanifest')}">
  <link rel="alternate" type="application/rss+xml" title="Career Ledger" href="${urls.href('feed.xml')}">
  <link rel="alternate" type="application/json" title="Career Ledger data" href="${urls.href('data/career.json')}">
  <link rel="stylesheet" href="${urls.href('assets/styles.css')}">
  <script>try{const t=localStorage.getItem('career-theme');if(t)document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch{}</script>
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>
  <title>${escapeHtml(fullTitle)}</title>
</head>
<body data-page="${escapeHtml(active || 'page')}">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="shell site-header__inner">
      <a class="wordmark" href="${urls.href('')}" aria-label="${escapeHtml(data.profile.name)} home">
        <span>${escapeHtml(data.profile.name)}</span>
        <small>Career Ledger</small>
      </a>
      ${renderNavigation(active, context)}
    </div>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer">
    <div class="shell site-footer__inner">
      <div>
        <strong>${escapeHtml(data.profile.name)}</strong>
        <p>A reviewed record of engineering work, not a raw activity feed.</p>
      </div>
      <div class="site-footer__links">
        <a href="${urls.href('data/career.json')}">Public JSON</a>
        <a href="${urls.href('feed.xml')}">RSS</a>
        <span>Updated ${escapeHtml(formatDate(data.updatedAt, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }))}</span>
      </div>
    </div>
  </footer>
  <script src="${urls.href('assets/app.js')}" defer></script>
</body>
</html>`;
}

export function renderHome(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const featured = data.entries.filter((entry) => entry.featured).slice(0, 6);
  const recent = data.entries.filter((entry) => !featured.some((item) => item.id === entry.id)).slice(0, 5);
  const activeAreas = data.taxonomy.areas.filter((area) => area.count > 0).sort((a, b) => b.count - a.count || a.order - b.order).slice(0, 8);
  const featuredProjects = data.projects.filter((project) => project.featured).slice(0, 4);

  const body = `<section class="hero shell">
    <div class="hero__eyebrow">Engineering record <span>Updated ${escapeHtml(formatDate(data.updatedAt, { month: 'long', year: 'numeric', timeZone: 'UTC' }))}</span></div>
    <div class="hero__grid">
      <div>
        <h1>Work, systems, and outcomes—kept as a living record.</h1>
      </div>
      <div class="hero__intro">
        <p>${escapeHtml(data.profile.intro)}</p>
        <div class="hero__identity">
          <span>${escapeHtml(data.profile.headline)}</span>
          <span>${escapeHtml(data.profile.location)}</span>
        </div>
        ${renderExternalLinks(data.profile.links)}
      </div>
    </div>
    <dl class="ledger-stats">
      <div><dt>Entries</dt><dd>${data.stats.entries}</dd></div>
      <div><dt>Projects</dt><dd>${data.stats.projects}</dd></div>
      <div><dt>Active areas</dt><dd>${data.stats.activeAreas}</dd></div>
      <div><dt>Years recorded</dt><dd>${data.stats.years}</dd></div>
    </dl>
  </section>

  <section class="section shell">
    <div class="section-heading">
      <div><span class="section-index">01</span><h2>Selected work</h2></div>
      <a href="${urls.href('timeline/')}">View full timeline <span aria-hidden="true">→</span></a>
    </div>
    <div class="entry-list entry-list--featured">
      ${featured.map((entry) => renderEntryCard(entry, context)).join('') || '<p class="empty-copy">No featured entries yet.</p>'}
    </div>
  </section>

  ${recent.length ? `<section class="section shell">
    <div class="section-heading">
      <div><span class="section-index">02</span><h2>Recent record</h2></div>
    </div>
    <div class="entry-list entry-list--compact">
      ${recent.map((entry) => renderEntryCard(entry, context, { compact: true })).join('')}
    </div>
  </section>` : ''}

  <section class="section shell">
    <div class="section-heading">
      <div><span class="section-index">03</span><h2>Areas of work</h2></div>
      <a href="${urls.href('areas/')}">Explore all areas <span aria-hidden="true">→</span></a>
    </div>
    <div class="area-grid">
      ${activeAreas.map((area) => `<a class="area-card" href="${urls.href(`areas/${area.slug}/`)}">
        <span class="area-card__count">${String(area.count).padStart(2, '0')}</span>
        <strong>${escapeHtml(area.label)}</strong>
        <p>${escapeHtml(area.description)}</p>
      </a>`).join('')}
    </div>
  </section>

  ${featuredProjects.length ? `<section class="section shell">
    <div class="section-heading">
      <div><span class="section-index">04</span><h2>Projects</h2></div>
      <a href="${urls.href('projects/')}">View all projects <span aria-hidden="true">→</span></a>
    </div>
    <div class="project-grid">
      ${featuredProjects.map((project) => renderProjectCard(project, context)).join('')}
    </div>
  </section>` : ''}

  <section class="section shell methodology-strip">
    <div>
      <span class="eyebrow">Publishing method</span>
      <h2>Private evidence. Conservative claims. Explicit approval.</h2>
    </div>
    <ol>
      <li><span>01</span>Local repositories produce private evidence.</li>
      <li><span>02</span>Related activity becomes a durable initiative.</li>
      <li><span>03</span>Confidential detail is removed and scope is reviewed.</li>
      <li><span>04</span>Only owner-approved records reach this site.</li>
    </ol>
  </section>`;

  return renderLayout({
    title: data.profile.name,
    description: data.profile.intro,
    active: 'home',
    body
  }, context);
}

export function renderTimeline(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const years = new Map();
  for (const entry of data.entries) {
    const year = entry.period.start.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push(entry);
  }
  const activeKinds = data.taxonomy.kinds.filter((kind) => kind.count > 0);

  const body = `<header class="page-header shell">
    <span class="eyebrow">Chronological record</span>
    <h1>Timeline</h1>
    <p>Meaningful initiatives grouped by time. Commits and tickets remain private supporting evidence.</p>
  </header>
  <section class="shell filter-panel" aria-label="Timeline filters">
    <label class="search-field">
      <span>Search the record</span>
      <input type="search" placeholder="Architecture, authentication, Node.js…" data-timeline-search>
    </label>
    <div class="filter-buttons" role="group" aria-label="Filter by type">
      <button type="button" data-timeline-filter="all" aria-pressed="true">All <span>${data.entries.length}</span></button>
      ${activeKinds.map((kind) => `<button type="button" data-timeline-filter="${escapeHtml(kind.value)}" aria-pressed="false">${escapeHtml(kind.label)} <span>${kind.count}</span></button>`).join('')}
    </div>
    <p class="filter-result" aria-live="polite" data-filter-result>${data.entries.length} entries</p>
  </section>
  <div class="timeline shell" data-timeline>
    ${[...years.entries()].map(([year, entries]) => `<section class="timeline-year" data-timeline-year>
      <div class="timeline-year__marker"><span>${escapeHtml(year)}</span></div>
      <div class="timeline-year__entries">
        ${entries.map((entry) => renderEntryCard(entry, context)).join('')}
      </div>
    </section>`).join('')}
    <p class="timeline-empty" hidden data-timeline-empty>No entries match the current filters.</p>
  </div>`;

  return renderLayout({
    title: 'Timeline',
    description: `A chronological record of ${data.profile.name}'s engineering initiatives and outcomes.`,
    path: 'timeline/',
    active: 'timeline',
    body
  }, context);
}

export function renderAreas(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const body = `<header class="page-header shell">
    <span class="eyebrow">Engineering coverage</span>
    <h1>Areas</h1>
    <p>Browse the record by the kind of engineering problem involved, rather than by job title or repository.</p>
  </header>
  <section class="section shell">
    <div class="area-directory">
      ${data.taxonomy.areas.map((area) => `<a class="area-directory__item${area.count === 0 ? ' is-empty' : ''}" href="${urls.href(`areas/${area.slug}/`)}">
        <span class="area-directory__order">${String(area.order).padStart(2, '0')}</span>
        <div><h2>${escapeHtml(area.label)}</h2><p>${escapeHtml(area.description)}</p></div>
        <span class="area-directory__count">${area.count} ${area.count === 1 ? 'record' : 'records'}</span>
      </a>`).join('')}
    </div>
  </section>`;

  return renderLayout({
    title: 'Areas',
    description: `Engineering areas represented in ${data.profile.name}'s career ledger.`,
    path: 'areas/',
    active: 'areas',
    body
  }, context);
}

export function renderArea(data, urls, area) {
  const context = { data, urls, maps: createMaps(data) };
  const entries = data.entries.filter((entry) => entry.areas.includes(area.label));
  const projects = data.projects.filter((project) => project.areas.includes(area.label));
  const body = `<nav class="breadcrumb shell" aria-label="Breadcrumb"><a href="${urls.href('areas/')}">Areas</a><span aria-hidden="true">/</span><span>${escapeHtml(area.label)}</span></nav>
  <header class="page-header page-header--detail shell">
    <span class="eyebrow">Engineering area · ${area.count} ${area.count === 1 ? 'record' : 'records'}</span>
    <h1>${escapeHtml(area.label)}</h1>
    <p>${escapeHtml(area.description)}</p>
  </header>
  <section class="section shell">
    <div class="section-heading"><div><span class="section-index">01</span><h2>Entries</h2></div></div>
    <div class="entry-list">
      ${entries.map((entry) => renderEntryCard(entry, context)).join('') || '<p class="empty-copy">No published entries in this area yet.</p>'}
    </div>
  </section>
  ${projects.length ? `<section class="section shell">
    <div class="section-heading"><div><span class="section-index">02</span><h2>Projects</h2></div></div>
    <div class="project-grid">${projects.map((project) => renderProjectCard(project, context)).join('')}</div>
  </section>` : ''}`;

  return renderLayout({
    title: area.label,
    description: area.description,
    path: `areas/${area.slug}/`,
    active: 'areas',
    body
  }, context);
}

export function renderProjects(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const body = `<header class="page-header shell">
    <span class="eyebrow">Products and platforms</span>
    <h1>Projects</h1>
    <p>Coherent bodies of work that connect multiple engineering initiatives over time.</p>
  </header>
  <section class="section shell">
    <div class="project-grid project-grid--directory">
      ${data.projects.map((project) => renderProjectCard(project, context)).join('') || '<p class="empty-copy">No public projects yet.</p>'}
    </div>
  </section>`;

  return renderLayout({
    title: 'Projects',
    description: `Products, platforms, tools, and research projects built by ${data.profile.name}.`,
    path: 'projects/',
    active: 'projects',
    body
  }, context);
}

export function renderProject(data, urls, project) {
  const context = { data, urls, maps: createMaps(data) };
  const related = project.relatedEntries.map((id) => context.maps.entryById.get(id)).filter(Boolean);
  const body = `<nav class="breadcrumb shell" aria-label="Breadcrumb"><a href="${urls.href('projects/')}">Projects</a><span aria-hidden="true">/</span><span>${escapeHtml(project.name)}</span></nav>
  <article class="detail shell">
    <header class="detail__header">
      <div>
        <span class="eyebrow">${escapeHtml(project.kind)} · ${escapeHtml(statusLabel(project.status))}</span>
        <h1>${escapeHtml(project.name)}</h1>
        <p class="detail__lede">${escapeHtml(project.summary)}</p>
      </div>
      <aside class="detail__aside">
        <div><span>Areas</span>${renderTags(project.areas, context)}</div>
        ${project.technologies.length ? `<div><span>Technologies</span>${renderTags(project.technologies, context, 'technology')}</div>` : ''}
        ${renderExternalLinks(project.links)}
      </aside>
    </header>
    <section class="prose-section">
      <h2>About the project</h2>
      <p>${escapeHtml(project.description)}</p>
    </section>
    ${related.length ? `<section class="prose-section">
      <h2>Related record</h2>
      <div class="entry-list">${related.map((entry) => renderEntryCard(entry, context)).join('')}</div>
    </section>` : ''}
  </article>`;

  return renderLayout({
    title: project.name,
    description: project.summary,
    path: `projects/${project.slug}/`,
    active: 'projects',
    pageType: 'article',
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: project.name,
      description: project.summary,
      applicationCategory: project.kind,
      url: urls.absolute(`projects/${project.slug}/`)
    }],
    body
  }, context);
}

export function renderEntry(data, urls, entry) {
  const context = { data, urls, maps: createMaps(data) };
  const relatedProjects = data.projects.filter((project) => project.relatedEntries.includes(entry.id));
  const body = `<nav class="breadcrumb shell" aria-label="Breadcrumb"><a href="${urls.href('timeline/')}">Timeline</a><span aria-hidden="true">/</span><span>${escapeHtml(entry.title)}</span></nav>
  <article class="detail shell">
    <header class="detail__header">
      <div>
        <span class="eyebrow">${escapeHtml(entry.period.label)} · ${escapeHtml(kindLabel(entry.kind, data))}</span>
        <h1>${escapeHtml(entry.title)}</h1>
        <p class="detail__lede">${escapeHtml(entry.summary)}</p>
      </div>
      <aside class="detail__aside">
        <div><span>Status</span><strong>${escapeHtml(statusLabel(entry.status))}</strong></div>
        <div><span>Areas</span>${renderTags(entry.areas, context)}</div>
        ${entry.technologies.length ? `<div><span>Technologies</span>${renderTags(entry.technologies, context, 'technology')}</div>` : ''}
        ${renderExternalLinks(entry.links)}
      </aside>
    </header>
    ${entry.context ? `<section class="prose-section"><h2>Context</h2><p>${escapeHtml(entry.context)}</p></section>` : ''}
    <section class="prose-section">
      <h2>Contributions</h2>
      <ul class="detail-list">${entry.contributions.map((contribution) => `<li>${escapeHtml(contribution)}</li>`).join('')}</ul>
    </section>
    ${entry.outcomes.length ? `<section class="prose-section">
      <h2>Outcomes</h2>
      <ul class="outcome-list">${entry.outcomes.map((outcome) => `<li><span aria-hidden="true">↳</span>${escapeHtml(outcome.text)}</li>`).join('')}</ul>
    </section>` : ''}
    ${relatedProjects.length ? `<section class="prose-section">
      <h2>Related projects</h2>
      <div class="project-grid">${relatedProjects.map((project) => renderProjectCard(project, context)).join('')}</div>
    </section>` : ''}
    <footer class="record-note">
      <strong>Publication note</strong>
      <p>This record was selected and sanitized before publication. Raw repository evidence and confidential project details remain private.</p>
    </footer>
  </article>`;

  return renderLayout({
    title: entry.title,
    description: entry.summary,
    path: `entries/${entry.slug}/`,
    active: 'timeline',
    pageType: 'article',
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description: entry.summary,
      datePublished: entry.period.start,
      dateModified: entry.publication.reviewedAt,
      author: { '@type': 'Person', name: data.profile.name },
      url: urls.absolute(`entries/${entry.slug}/`)
    }],
    body
  }, context);
}

export function renderAbout(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const body = `<header class="page-header shell">
    <span class="eyebrow">About this record</span>
    <h1>${escapeHtml(data.profile.name)}</h1>
    <p>${escapeHtml(data.profile.headline)} · ${escapeHtml(data.profile.location)}</p>
  </header>
  <section class="about-layout shell">
    <div class="about-copy">
      ${data.profile.bio.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      ${renderExternalLinks(data.profile.links)}
    </div>
    <aside class="about-note">
      <span class="eyebrow">What this is</span>
      <p>A selective, versioned career memory built from private evidence and explicit review.</p>
      <span class="eyebrow">What this is not</span>
      <p>It is not a live employer activity feed, a claim of sole ownership, or a mirror of confidential repositories.</p>
    </aside>
  </section>
  <section class="section shell">
    <div class="section-heading"><div><span class="section-index">01</span><h2>Publishing principles</h2></div></div>
    <div class="principle-grid">
      ${data.profile.principles.map((principle, index) => `<article><span>0${index + 1}</span><h3>${escapeHtml(principle.title)}</h3><p>${escapeHtml(principle.description)}</p></article>`).join('')}
    </div>
  </section>
  <section class="section shell methodology-strip methodology-strip--about">
    <div><span class="eyebrow">Method</span><h2>From evidence to a public record</h2></div>
    <ol>
      <li><span>01</span>Local Git history identifies changed work.</li>
      <li><span>02</span>Source, tests, and context establish what the work means.</li>
      <li><span>03</span>Related work becomes an initiative with conservative attribution.</li>
      <li><span>04</span>Outcomes are confirmed separately from implementation.</li>
      <li><span>05</span>A sanitized candidate receives final owner approval.</li>
    </ol>
  </section>`;

  return renderLayout({
    title: 'About',
    description: `About ${data.profile.name} and the evidence-first method behind this career ledger.`,
    path: 'about/',
    active: 'about',
    body
  }, context);
}

export function renderNotFound(data, urls) {
  const context = { data, urls, maps: createMaps(data) };
  const body = `<section class="not-found shell">
    <span class="eyebrow">404</span>
    <h1>This record does not exist.</h1>
    <p>The page may have moved, or the entry may never have been published.</p>
    <a class="text-link" href="${urls.href('')}">Return to highlights <span aria-hidden="true">→</span></a>
  </section>`;
  return renderLayout({
    title: 'Not found',
    description: 'The requested Career Ledger page was not found.',
    path: '404.html',
    body
  }, context);
}

export function renderSitemap(data, urls) {
  const pages = [
    '',
    'timeline/',
    'areas/',
    'projects/',
    'about/',
    ...data.taxonomy.areas.map((area) => `areas/${area.slug}/`),
    ...data.projects.map((project) => `projects/${project.slug}/`),
    ...data.entries.map((entry) => `entries/${entry.slug}/`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${escapeXml(urls.absolute(page))}</loc><lastmod>${escapeXml(data.updatedAt)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
}

export function renderFeed(data, urls) {
  const items = data.entries.slice(0, 30).map((entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(urls.absolute(`entries/${entry.slug}/`))}</link>
      <guid>${escapeXml(urls.absolute(`entries/${entry.slug}/`))}</guid>
      <pubDate>${new Date(`${entry.period.start}T12:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(entry.summary)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(data.profile.name)} — Career Ledger</title>
    <link>${escapeXml(urls.absolute(''))}</link>
    <description>${escapeXml(data.profile.intro)}</description>
    <lastBuildDate>${new Date(`${data.updatedAt}T12:00:00.000Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function renderRobots(urls) {
  return `User-agent: *\nAllow: /\nSitemap: ${urls.absolute('sitemap.xml')}\n`;
}

export function renderManifest(data, urls) {
  return `${JSON.stringify({
    name: `${data.profile.name} — Career Ledger`,
    short_name: 'Career Ledger',
    start_url: urls.href(''),
    display: 'standalone',
    background_color: '#f4f1e9',
    theme_color: '#f4f1e9',
    icons: [{ src: urls.href('assets/favicon.svg'), sizes: 'any', type: 'image/svg+xml' }]
  }, null, 2)}\n`;
}
