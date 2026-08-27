import type { CareerDataset, Entry, Project, Resume, Experience, PublicLink, DatasetArea } from './model.ts';
import type { UrlContext } from './url.ts';
type RenderContext = ReturnType<typeof createRenderContext>;
interface LayoutOptions { title: string; description: string; body: string; path?: string; active?: string; pageType?: string; structuredData?: Array<Record<string, unknown>>; }

import { DEFAULT_LOCALE, messagesFor } from './i18n.ts';

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeXml(value: unknown) {
  return escapeHtml(value);
}

function formatDate(value: string | null, locale: string = DEFAULT_LOCALE, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

function kindLabel(kind: string, data: CareerDataset) {
  return data.taxonomy.kinds.find((item) => item.value === kind)?.label ?? kind;
}

function statusLabel(status: string, context: RenderContext) {
  return context.copy.statuses[status] ?? status;
}

function projectKindLabel(kind: string, context: RenderContext) {
  return context.copy.projectKinds[kind] ?? kind;
}

function significanceLabel(significance: string, context: RenderContext) {
  return context.copy.significances[significance] ?? significance;
}

function activityTypeLabel(type: string, context: RenderContext) {
  return context.copy.activityTypeLabels[type] ?? type;
}

function createMaps(data: CareerDataset) {
  return {
    areaByLabel: new Map(data.taxonomy.areas.map((area) => [area.label, area])),
    entryById: new Map(data.entries.map((entry) => [entry.id, entry])),
    projectById: new Map(data.projects.map((project) => [project.id, project]))
  };
}

function createRenderContext(data: CareerDataset, urls: UrlContext) {
  return {
    data,
    urls,
    maps: createMaps(data),
    locale: urls.locale ?? data.locale ?? DEFAULT_LOCALE,
    copy: messagesFor(urls.locale ?? data.locale ?? DEFAULT_LOCALE)
  };
}

function renderTags(values: string[], context: RenderContext, type: string = 'area') {
  const { urls, maps, copy } = context;
  return `<ul class="tag-list" aria-label="${escapeHtml(type === 'area' ? copy.engineeringAreas : copy.technologies)}">${values.map((value) => {
    if (type === 'area') {
      const area = maps.areaByLabel.get(value);
      if (area) {
        return `<li><a class="tag" href="${urls.href(`areas/${area.slug}/`)}">${escapeHtml(value)}</a></li>`;
      }
    }
    return `<li><span class="tag tag--plain">${escapeHtml(value)}</span></li>`;
  }).join('')}</ul>`;
}

function renderPlainTags(values: string[], label: string) {
  if (!values.length) return '';
  return `<span class="project-story__tags" role="list" aria-label="${escapeHtml(label)}">${values.map((value) => `<span role="listitem">${escapeHtml(value)}</span>`).join('')}</span>`;
}

function renderEntryCard(entry: Entry, context: RenderContext, options: { compact?: boolean } = {}) {
  const { compact = false } = options;
  const activityTypes = entry.activityTypes.map((type) => activityTypeLabel(type, context));
  return `<article class="entry-card${compact ? ' entry-card--compact' : ''}" data-entry data-kind="${escapeHtml(entry.kind)}" data-significance="${escapeHtml(entry.significance)}" data-activity-types="${escapeHtml(entry.activityTypes.join(' '))}" data-search="${escapeHtml(`${entry.title} ${entry.summary} ${entry.areas.join(' ')} ${entry.technologies.join(' ')} ${activityTypes.join(' ')} ${significanceLabel(entry.significance, context)}`.toLowerCase())}">
    <div class="entry-card__meta">
      <span>${escapeHtml(entry.period.label)}</span>
      <span aria-hidden="true">·</span>
      <span class="entry-card__significance entry-card__significance--${escapeHtml(entry.significance)}">${escapeHtml(significanceLabel(entry.significance, context))}</span>
      <span aria-hidden="true">·</span>
      <span>${escapeHtml(kindLabel(entry.kind, context.data))}</span>
      ${entry.status === 'active' ? `<span class="status-dot">${escapeHtml(context.copy.active)}</span>` : ''}
    </div>
    <h3 class="entry-card__title"><a href="${context.urls.href(`entries/${entry.slug}/`)}">${escapeHtml(entry.title)}</a></h3>
    <p>${escapeHtml(entry.summary)}</p>
    ${activityTypes.length ? renderPlainTags(activityTypes, context.copy.activityTypes) : ''}
    ${renderTags(entry.areas.slice(0, compact ? 3 : 5), context)}
  </article>`;
}

function renderProjectCard(project: Project, context: RenderContext) {
  return `<article class="project-card">
    <div class="project-card__meta">
      <span>${escapeHtml(projectKindLabel(project.kind, context))}</span>
      <span class="status-label">${escapeHtml(statusLabel(project.status, context))}</span>
    </div>
    <h3><a href="${context.urls.href(`projects/${project.slug}/`)}">${escapeHtml(project.name)}</a></h3>
    <p>${escapeHtml(project.summary)}</p>
    ${renderTags(project.areas.slice(0, 4), context)}
  </article>`;
}

function projectStoryDate(project: Project, maps: ReturnType<typeof createMaps>) {
  const dates = project.relatedEntries
    .map((id) => maps.entryById.get(id)?.period.start)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.localeCompare(a));
  return dates[0] ?? '';
}

function renderProjectSpotlight(project: Project, context: RenderContext, index: number) {
  const related = project.relatedEntries.map((id) => context.maps.entryById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const latest = [...related].sort((a, b) => b.period.start.localeCompare(a.period.start))[0];
  const period = latest?.period.label ?? statusLabel(project.status, context);
  const outcome = latest?.outcomes[0]?.text;
  const signal = outcome ?? latest?.contributions[0];

  return `<article class="project-spotlight" aria-labelledby="project-spotlight-${escapeHtml(project.slug)}">
    <header class="project-spotlight__header">
      <span class="project-spotlight__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <span class="project-spotlight__meta">${escapeHtml(projectKindLabel(project.kind, context))} · ${escapeHtml(statusLabel(project.status, context))}</span>
    </header>
    <div class="project-spotlight__main">
      <h3 id="project-spotlight-${escapeHtml(project.slug)}"><a href="${context.urls.href(`projects/${project.slug}/`)}">${escapeHtml(project.name)}</a></h3>
      <p>${escapeHtml(project.summary)}</p>
      ${renderPlainTags(project.areas.slice(0, 3), context.copy.projectAreas)}
    </div>
    ${latest && signal ? `<section class="project-spotlight__signal" aria-labelledby="project-signal-${escapeHtml(project.slug)}">
      <span>${escapeHtml(outcome ? context.copy.results : context.copy.keyWork)}</span>
      <h4 id="project-signal-${escapeHtml(project.slug)}"><a href="${context.urls.href(`entries/${latest.slug}/`)}">${escapeHtml(latest.title)}</a></h4>
      <p>${escapeHtml(signal)}</p>
    </section>` : ''}
    <footer class="project-spotlight__footer">
      <span>${escapeHtml(period)}</span>
      <a class="text-link" href="${context.urls.href(`projects/${project.slug}/`)}">${escapeHtml(context.copy.fullProject)} <span aria-hidden="true">→</span></a>
    </footer>
  </article>`;
}

function renderExperience(experience: Experience, context: RenderContext, index: number) {
  const relatedProjects = experience.relatedProjects
    .map((id) => context.maps.projectById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return `<article class="experience-record" aria-labelledby="experience-${escapeHtml(experience.id)}">
    <h3 class="visually-hidden" id="experience-${escapeHtml(experience.id)}">${escapeHtml(experience.role)} — ${escapeHtml(experience.organization)}</h3>
    <details class="experience-story"${index === 0 ? ' open' : ''}>
      <summary class="experience-story__summary">
        <span class="experience-story__index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <span class="experience-story__identity">
          <strong>${escapeHtml(experience.organization)}</strong>
          <span>${escapeHtml(experience.role)}</span>
        </span>
        <span class="experience-story__domain">${escapeHtml(experience.domain)}</span>
        <span class="experience-story__period">${escapeHtml(experience.period.label)}</span>
        <span class="project-story__toggle" aria-hidden="true"></span>
      </summary>
      <div class="experience-story__body">
        <p class="experience-story__lede">${escapeHtml(experience.summary)}</p>
        <div class="experience-story__sections">
          ${experience.outcomes.length ? `<section>
            <h4>${escapeHtml(context.copy.results)}</h4>
            <ul class="outcome-list">${experience.outcomes.map((outcome) => `<li><span aria-hidden="true">↳</span>${escapeHtml(outcome.text)}</li>`).join('')}</ul>
          </section>` : ''}
          <section>
            <h4>${escapeHtml(context.copy.keyWork)}</h4>
            <ul class="detail-list">${experience.contributions.slice(0, 4).map((contribution) => `<li>${escapeHtml(contribution)}</li>`).join('')}</ul>
          </section>
        </div>
        <div class="experience-story__footer">
          ${renderPlainTags(experience.technologies.slice(0, 10), context.copy.technologies)}
          ${relatedProjects.length ? `<ul class="experience-story__projects" aria-label="${escapeHtml(context.copy.relatedProjects)}">${relatedProjects.map((project) => `<li><a href="${context.urls.href(`projects/${project.slug}/`)}">${escapeHtml(project.name)}</a></li>`).join('')}</ul>` : ''}
        </div>
      </div>
    </details>
  </article>`;
}

function renderResumeHighlights(resume: Resume, context: RenderContext) {
  if (!resume.highlights.length) return '';
  return `<section class="career-highlights shell" aria-labelledby="highlights-heading">
    <header class="compact-heading">
      <h2 id="highlights-heading">${escapeHtml(context.copy.selectedOutcomes)}</h2>
      <span>${escapeHtml(context.copy.outcomeCount(resume.highlights.length))}</span>
    </header>
    <ul>${resume.highlights.slice(0, 5).map((outcome) => `<li>${escapeHtml(outcome.text)}</li>`).join('')}</ul>
  </section>`;
}

function renderResumeExperience(resume: Resume, context: RenderContext) {
  const years = resume.experienceYears === null ? '' : context.copy.yearCount(resume.experienceYears);
  const roles = context.copy.roleCount(resume.experiences.length);
  return `<section class="experience-index shell" id="experience" aria-labelledby="experience-heading">
    <header class="compact-heading">
      <h2 id="experience-heading">${escapeHtml(context.copy.experience)}</h2>
      <span>${escapeHtml([years, roles].filter((item): item is NonNullable<typeof item> => Boolean(item)).join(' · '))}</span>
    </header>
    <div class="experience-ledger">
      ${resume.experiences.map((experience, index) => renderExperience(experience, context, index)).join('')}
    </div>
  </section>`;
}

function renderResumeBackground(resume: Resume, context: RenderContext) {
  if (!resume.skills.length && !resume.education.length) return '';
  return `<section class="resume-background shell" aria-labelledby="background-heading">
    <header class="compact-heading">
      <h2 id="background-heading">${escapeHtml(context.copy.background)}</h2>
    </header>
    <div class="resume-background__grid">
      <section>
        <h3>${escapeHtml(context.copy.coreSkills)}</h3>
        ${renderPlainTags(resume.skills, context.copy.coreSkills)}
      </section>
      <section>
        <h3>${escapeHtml(context.copy.education)}</h3>
        <ol class="education-list">${resume.education.map((education) => `<li>
          <span>${escapeHtml(education.period.label)}</span>
          <strong>${escapeHtml(education.credential)}</strong>
          <small>${escapeHtml(education.institution)}</small>
        </li>`).join('')}</ol>
      </section>
    </div>
  </section>`;
}

function renderExternalLinks(links: PublicLink[]) {
  if (!links.length) return '';
  return `<ul class="external-links">${links.map((link) => `<li><a href="${escapeHtml(link.href)}" rel="noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`;
}

function renderNavigation(active: string, context: RenderContext) {
  const items = [
    ...(context.data.resume ? [['experience', `${context.urls.href('')}#experience`, context.copy.navigation.experience]] : []),
    ['work', `${context.urls.href('')}#work`, context.copy.navigation.projects],
    ['about', context.urls.href('about/'), context.copy.navigation.about]
  ];
  const activeItem = active === 'about' ? 'about' : 'work';
  return `<nav class="site-nav" aria-label="${escapeHtml(context.copy.primaryNavigation)}">
    ${items.map(([key, target, label]) => `<a href="${target}"${activeItem === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
  </nav>`;
}

function renderLanguageNavigation(path: string, context: RenderContext) {
  return `<nav class="language-nav" aria-label="${escapeHtml(context.copy.languageNavigation)}">
    ${context.urls.supportedLocales.map((locale) => `<a href="${context.urls.alternateHref(locale.code, path)}" lang="${escapeHtml(locale.code)}" hreflang="${escapeHtml(locale.code)}"${locale.code === context.locale ? ' aria-current="page"' : ''}><span class="visually-hidden">${escapeHtml(locale.languageName)}</span><span aria-hidden="true">${escapeHtml(locale.shortLabel)}</span></a>`).join('')}
  </nav>`;
}

function renderLayout(options: LayoutOptions, context: RenderContext) {
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
  const fullTitle = title === data.profile.name ? `${data.profile.name} — ${context.copy.portfolioTitle}` : `${title} — ${data.profile.name}`;
  const canonical = urls.absolute(path);
  const localeDefinition = urls.supportedLocales.find((locale) => locale.code === context.locale) ?? urls.supportedLocales[0];
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.profile.name,
      jobTitle: data.profile.headline,
      address: data.profile.location,
      url: urls.absolute(''),
      inLanguage: context.locale
    },
    ...structuredData.map((item) => ({ ...item, inLanguage: context.locale }))
  ];

  return `<!doctype html>
<html lang="${escapeHtml(context.locale)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  ${data.preview ? '<meta name="robots" content="noindex,nofollow">' : ''}
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="${escapeHtml(pageType)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:locale" content="${escapeHtml(localeDefinition.ogLocale)}">
  ${urls.supportedLocales.filter((locale) => locale.code !== context.locale).map((locale) => `<meta property="og:locale:alternate" content="${escapeHtml(locale.ogLocale)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  ${urls.supportedLocales.map((locale) => `<link rel="alternate" hreflang="${escapeHtml(locale.code)}" href="${escapeHtml(urls.alternateAbsolute(locale.code, path))}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(urls.alternateAbsolute(DEFAULT_LOCALE, path))}">
  <link rel="icon" href="${urls.rootHref('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="manifest" href="${urls.href('manifest.webmanifest')}">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(context.copy.rssTitle(data.profile.name))}" href="${urls.href('feed.xml')}">
  <link rel="alternate" type="application/json" title="${escapeHtml(context.copy.jsonTitle(data.profile.name))}" href="${urls.href('data/career.json')}">
  <link rel="stylesheet" href="${urls.rootHref('assets/styles.css')}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>
  <title>${escapeHtml(fullTitle)}</title>
</head>
<body data-page="${escapeHtml(active || 'page')}">
  <a class="skip-link" href="#main">${escapeHtml(context.copy.skipToContent)}</a>
  ${data.preview ? `<aside class="review-banner" aria-label="${escapeHtml(context.copy.reviewBannerLabel)}">
    <div class="shell review-banner__inner">
      <strong>${escapeHtml(context.copy.reviewBannerTitle)}</strong>
      <span>${escapeHtml(context.copy.reviewBannerText)}</span>
    </div>
  </aside>` : ''}
  <header class="site-header">
    <div class="shell site-header__inner">
      <a class="wordmark" href="${urls.href('')}" aria-label="${escapeHtml(context.copy.homeLabel(data.profile.name))}">
        <span>${escapeHtml(data.profile.name)}</span>
      </a>
      <div class="site-header__actions">
        ${renderNavigation(active, context)}
        ${renderLanguageNavigation(path, context)}
      </div>
    </div>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer">
    <div class="shell site-footer__inner">
      <div>
        <strong>${escapeHtml(data.profile.name)}</strong>
        <p>${escapeHtml(data.profile.headline)}</p>
      </div>
      <div class="site-footer__links">
        <a href="${urls.href('data/career.json')}">${escapeHtml(data.preview ? context.copy.previewJson : context.copy.publicJson)}</a>
        <a href="${urls.href('feed.xml')}">RSS</a>
        <span>${escapeHtml(context.copy.updated)} ${escapeHtml(formatDate(data.updatedAt, context.locale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }))}</span>
      </div>
    </div>
  </footer>
  <script src="${urls.rootHref('assets/app.js')}" defer></script>
</body>
</html>`;
}

export function renderHome(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const featuredProjects = data.projects
    .filter((project) => project.featured)
    .sort((a, b) => projectStoryDate(b, context.maps).localeCompare(projectStoryDate(a, context.maps)) || a.name.localeCompare(b.name));

  const body = `<section class="home-intro shell" aria-labelledby="portfolio-heading">
    <div class="home-intro__title">
      <span class="eyebrow">${escapeHtml(data.profile.headline)}</span>
      <h1 id="portfolio-heading">${escapeHtml(context.copy.homeTitle)}</h1>
    </div>
    <div class="home-intro__copy">
      <p>${escapeHtml(data.resume?.summary ?? data.profile.intro ?? context.copy.homeSummaryFallback)}</p>
      <span>${escapeHtml(data.profile.location)}</span>
      <div class="home-intro__actions">
        <a class="primary-link" href="#work">${escapeHtml(context.copy.viewSelectedWork)}</a>
        <a class="text-link" href="${urls.href('timeline/')}">${escapeHtml(context.copy.viewTimeline)} <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  <section class="work-index shell" id="work" aria-labelledby="work-heading">
    <header class="work-index__heading">
      <div>
        <span class="eyebrow">${escapeHtml(context.copy.projects)}</span>
        <h2 id="work-heading">${escapeHtml(context.copy.selectedWork)}</h2>
      </div>
      <div class="work-index__intro">
        <p>${escapeHtml(context.copy.selectedWorkIntro)}</p>
        <div class="work-index__meta">
          <span>${escapeHtml(context.copy.selectedCount(featuredProjects.length))}</span>
          <a class="text-link" href="${urls.href('projects/')}">${escapeHtml(context.copy.viewAllProjects)} <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </header>
    <div class="project-showcase">
      ${featuredProjects.map((project, index) => renderProjectSpotlight(project, context, index)).join('') || `<p class="empty-copy">${escapeHtml(context.copy.noFeaturedProjects)}</p>`}
    </div>
  </section>

  ${data.resume ? renderResumeHighlights(data.resume, context) : ''}
  ${data.resume ? renderResumeExperience(data.resume, context) : ''}
  ${data.resume ? renderResumeBackground(data.resume, context) : ''}`;

  return renderLayout({
    title: data.profile.name,
    description: data.profile.intro,
    active: 'home',
    body
  }, context);
}

export function renderTimeline(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const years = new Map<string, Entry[]>();
  for (const entry of data.entries) {
    const year = entry.period.start.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(entry);
  }
  const activeKinds = data.taxonomy.kinds.filter((kind) => kind.count > 0);
  const significanceOrder = ['activity', 'notable', 'milestone', 'achievement'];
  const activeSignificances = significanceOrder
    .map((value) => ({ value, count: data.entries.filter((entry) => entry.significance === value).length }))
    .filter((item) => item.count > 0);
  const activeActivityTypes = [...new Set(data.entries.flatMap((entry) => entry.activityTypes))]
    .sort((a, b) => activityTypeLabel(a, context).localeCompare(activityTypeLabel(b, context), context.locale))
    .map((value) => ({ value, count: data.entries.filter((entry) => entry.activityTypes.includes(value)).length }));

  const body = `<header class="page-header shell">
    <span class="eyebrow">${escapeHtml(context.copy.chronologicalRecord)}</span>
    <h1>${escapeHtml(context.copy.timeline)}</h1>
    <p>${escapeHtml(context.copy.timelineIntro)}</p>
  </header>
  <section class="shell filter-panel" aria-label="${escapeHtml(context.copy.timelineFilters)}">
    <label class="search-field">
      <span>${escapeHtml(context.copy.searchRecord)}</span>
      <input type="search" placeholder="${escapeHtml(context.copy.searchPlaceholder)}" data-timeline-search>
    </label>
    <div class="filter-groups">
      <div class="filter-group">
        <span class="filter-group__label">${escapeHtml(context.copy.significance)}</span>
        <div class="filter-buttons" role="group" aria-label="${escapeHtml(context.copy.filterBySignificance)}">
          <button type="button" data-timeline-filter-group="significance" data-timeline-filter-value="all" aria-pressed="true">${escapeHtml(context.copy.all)} <span>${data.entries.length}</span></button>
          ${activeSignificances.map((item) => `<button type="button" data-timeline-filter-group="significance" data-timeline-filter-value="${escapeHtml(item.value)}" aria-pressed="false">${escapeHtml(significanceLabel(item.value, context))} <span>${item.count}</span></button>`).join('')}
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-group__label">${escapeHtml(context.copy.recordType)}</span>
        <div class="filter-buttons" role="group" aria-label="${escapeHtml(context.copy.filterByType)}">
          <button type="button" data-timeline-filter-group="kind" data-timeline-filter-value="all" aria-pressed="true">${escapeHtml(context.copy.all)} <span>${data.entries.length}</span></button>
          ${activeKinds.map((kind) => `<button type="button" data-timeline-filter-group="kind" data-timeline-filter-value="${escapeHtml(kind.value)}" aria-pressed="false">${escapeHtml(kind.label)} <span>${kind.count}</span></button>`).join('')}
        </div>
      </div>
      ${activeActivityTypes.length ? `<div class="filter-group">
        <span class="filter-group__label">${escapeHtml(context.copy.activityTypes)}</span>
        <div class="filter-buttons" role="group" aria-label="${escapeHtml(context.copy.filterByActivityType)}">
          <button type="button" data-timeline-filter-group="activityType" data-timeline-filter-value="all" aria-pressed="true">${escapeHtml(context.copy.all)} <span>${data.entries.length}</span></button>
          ${activeActivityTypes.map((item) => `<button type="button" data-timeline-filter-group="activityType" data-timeline-filter-value="${escapeHtml(item.value)}" aria-pressed="false">${escapeHtml(activityTypeLabel(item.value, context))} <span>${item.count}</span></button>`).join('')}
        </div>
      </div>` : ''}
    </div>
    <p class="filter-result" aria-live="polite" data-filter-result data-result-one="${escapeHtml(context.copy.entryCount(1).replace(/^1 /, ''))}" data-result-many="${escapeHtml(context.copy.entryCount(2).replace(/^2 /, ''))}">${escapeHtml(context.copy.entryCount(data.entries.length))}</p>
  </section>
  <div class="timeline shell" data-timeline>
    ${[...years.entries()].map(([year, entries]) => `<section class="timeline-year" data-timeline-year>
      <div class="timeline-year__marker"><span>${escapeHtml(year)}</span></div>
      <div class="timeline-year__entries">
        ${entries.map((entry) => renderEntryCard(entry, context)).join('')}
      </div>
    </section>`).join('')}
    <p class="timeline-empty" hidden data-timeline-empty>${escapeHtml(context.copy.noFilterResults)}</p>
  </div>`;

  return renderLayout({
    title: context.copy.timeline,
    description: context.copy.timelineDescription(data.profile.name),
    path: 'timeline/',
    active: 'timeline',
    body
  }, context);
}

export function renderAreas(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const body = `<header class="page-header shell">
    <span class="eyebrow">${escapeHtml(context.copy.engineeringCoverage)}</span>
    <h1>${escapeHtml(context.copy.areas)}</h1>
    <p>${escapeHtml(context.copy.areasIntro)}</p>
  </header>
  <section class="section shell">
    <div class="area-directory">
      ${data.taxonomy.areas.map((area) => `<a class="area-directory__item${area.count === 0 ? ' is-empty' : ''}" href="${urls.href(`areas/${area.slug}/`)}">
        <span class="area-directory__order">${String(area.order).padStart(2, '0')}</span>
        <div><h2>${escapeHtml(area.label)}</h2><p>${escapeHtml(area.description)}</p></div>
        <span class="area-directory__count">${escapeHtml(context.copy.recordCount(area.count))}</span>
      </a>`).join('')}
    </div>
  </section>`;

  return renderLayout({
    title: context.copy.areas,
    description: context.copy.areasDescription(data.profile.name),
    path: 'areas/',
    active: 'areas',
    body
  }, context);
}

export function renderArea(data: CareerDataset, urls: UrlContext, area: DatasetArea) {
  const context = createRenderContext(data, urls);
  const entries = data.entries.filter((entry) => entry.areas.includes(area.label));
  const projects = data.projects.filter((project) => project.areas.includes(area.label));
  const body = `<nav class="breadcrumb shell" aria-label="${escapeHtml(context.copy.breadcrumb)}"><a href="${urls.href('areas/')}">${escapeHtml(context.copy.areas)}</a><span aria-hidden="true">/</span><span>${escapeHtml(area.label)}</span></nav>
  <header class="page-header page-header--detail shell">
    <span class="eyebrow">${escapeHtml(context.copy.engineeringArea)} · ${escapeHtml(context.copy.recordCount(area.count))}</span>
    <h1>${escapeHtml(area.label)}</h1>
    <p>${escapeHtml(area.description)}</p>
  </header>
  <section class="section shell">
    <div class="section-heading"><div><span class="section-index">01</span><h2>${escapeHtml(context.copy.entries)}</h2></div></div>
    <div class="entry-list">
      ${entries.map((entry) => renderEntryCard(entry, context)).join('') || `<p class="empty-copy">${escapeHtml(context.copy.noAreaEntries)}</p>`}
    </div>
  </section>
  ${projects.length ? `<section class="section shell">
    <div class="section-heading"><div><span class="section-index">02</span><h2>${escapeHtml(context.copy.projects)}</h2></div></div>
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

export function renderProjects(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const body = `<header class="page-header shell">
    <span class="eyebrow">${escapeHtml(context.copy.productsAndPlatforms)}</span>
    <h1>${escapeHtml(context.copy.projects)}</h1>
    <p>${escapeHtml(context.copy.projectsIntro)}</p>
  </header>
  <section class="section shell">
    <div class="project-grid project-grid--directory">
      ${data.projects.map((project) => renderProjectCard(project, context)).join('') || `<p class="empty-copy">${escapeHtml(context.copy.noPublicProjects)}</p>`}
    </div>
  </section>`;

  return renderLayout({
    title: context.copy.projects,
    description: context.copy.projectsDescription(data.profile.name),
    path: 'projects/',
    active: 'projects',
    body
  }, context);
}

export function renderProject(data: CareerDataset, urls: UrlContext, project: Project) {
  const context = createRenderContext(data, urls);
  const related = project.relatedEntries.map((id) => context.maps.entryById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const body = `<nav class="breadcrumb shell" aria-label="${escapeHtml(context.copy.breadcrumb)}"><a href="${urls.href('projects/')}">${escapeHtml(context.copy.projects)}</a><span aria-hidden="true">/</span><span>${escapeHtml(project.name)}</span></nav>
  <article class="detail shell">
    <header class="detail__header">
      <div>
        <span class="eyebrow">${escapeHtml(projectKindLabel(project.kind, context))} · ${escapeHtml(statusLabel(project.status, context))}</span>
        <h1>${escapeHtml(project.name)}</h1>
        <p class="detail__lede">${escapeHtml(project.summary)}</p>
      </div>
      <aside class="detail__aside">
        <div><span>${escapeHtml(context.copy.areas)}</span>${renderTags(project.areas, context)}</div>
        ${project.technologies.length ? `<div><span>${escapeHtml(context.copy.technologies)}</span>${renderTags(project.technologies, context, 'technology')}</div>` : ''}
        ${renderExternalLinks(project.links)}
      </aside>
    </header>
    <section class="prose-section">
      <h2>${escapeHtml(context.copy.aboutProject)}</h2>
      <p>${escapeHtml(project.description)}</p>
    </section>
    ${related.length ? `<section class="prose-section">
      <h2>${escapeHtml(context.copy.relatedRecord)}</h2>
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

export function renderEntry(data: CareerDataset, urls: UrlContext, entry: Entry) {
  const context = createRenderContext(data, urls);
  const relatedProjects = data.projects.filter((project) => project.relatedEntries.includes(entry.id));
  const body = `<nav class="breadcrumb shell" aria-label="${escapeHtml(context.copy.breadcrumb)}"><a href="${urls.href('timeline/')}">${escapeHtml(context.copy.timeline)}</a><span aria-hidden="true">/</span><span>${escapeHtml(entry.title)}</span></nav>
  <article class="detail shell">
    <header class="detail__header">
      <div>
        <span class="eyebrow">${escapeHtml(entry.period.label)} · ${escapeHtml(significanceLabel(entry.significance, context))} · ${escapeHtml(kindLabel(entry.kind, data))}</span>
        <h1>${escapeHtml(entry.title)}</h1>
        <p class="detail__lede">${escapeHtml(entry.summary)}</p>
      </div>
      <aside class="detail__aside">
        <div><span>${escapeHtml(context.copy.status)}</span><strong>${escapeHtml(statusLabel(entry.status, context))}</strong></div>
        <div><span>${escapeHtml(context.copy.significance)}</span><strong>${escapeHtml(significanceLabel(entry.significance, context))}</strong></div>
        ${entry.activityTypes.length ? `<div><span>${escapeHtml(context.copy.activityTypes)}</span>${renderPlainTags(entry.activityTypes.map((type) => activityTypeLabel(type, context)), context.copy.activityTypes)}</div>` : ''}
        <div><span>${escapeHtml(context.copy.areas)}</span>${renderTags(entry.areas, context)}</div>
        ${entry.technologies.length ? `<div><span>${escapeHtml(context.copy.technologies)}</span>${renderTags(entry.technologies, context, 'technology')}</div>` : ''}
        ${renderExternalLinks(entry.links)}
      </aside>
    </header>
    ${entry.context ? `<section class="prose-section"><h2>${escapeHtml(context.copy.context)}</h2><p>${escapeHtml(entry.context)}</p></section>` : ''}
    <section class="prose-section">
      <h2>${escapeHtml(context.copy.contributions)}</h2>
      <ul class="detail-list">${entry.contributions.map((contribution) => `<li>${escapeHtml(contribution)}</li>`).join('')}</ul>
    </section>
    ${entry.outcomes.length ? `<section class="prose-section">
      <h2>${escapeHtml(context.copy.outcomes)}</h2>
      <ul class="outcome-list">${entry.outcomes.map((outcome) => `<li><span aria-hidden="true">↳</span>${escapeHtml(outcome.text)}</li>`).join('')}</ul>
    </section>` : ''}
    ${relatedProjects.length ? `<section class="prose-section">
      <h2>${escapeHtml(context.copy.relatedProjects)}</h2>
      <div class="project-grid">${relatedProjects.map((project) => renderProjectCard(project, context)).join('')}</div>
    </section>` : ''}
    <footer class="record-note">
      <strong>${escapeHtml(data.preview ? context.copy.candidateNote : context.copy.publicationNote)}</strong>
      <p>${escapeHtml(data.preview ? context.copy.candidateNoteText : context.copy.publicationNoteText)}</p>
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

export function renderAbout(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const focusAreas = data.resume?.skills.slice(0, 8) ?? data.taxonomy.areas.slice(0, 8).map((area) => area.label);
  const body = `<header class="about-hero shell">
    <span class="eyebrow">${escapeHtml(context.copy.aboutEyebrow)}</span>
    <div class="about-hero__grid">
      <h1>${escapeHtml(context.copy.aboutTitle)}</h1>
      <p>${escapeHtml(context.copy.aboutIntro)}</p>
    </div>
  </header>
  <section class="about-layout shell">
    <div class="about-copy">
      ${data.profile.bio.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      ${renderExternalLinks(data.profile.links)}
    </div>
    <aside class="about-facts">
      <div>
        <span>${escapeHtml(context.copy.basedIn)}</span>
        <strong>${escapeHtml(data.profile.location)}</strong>
      </div>
      ${focusAreas.length ? `<div>
        <span>${escapeHtml(context.copy.coreFocus)}</span>
        ${renderPlainTags(focusAreas, context.copy.coreFocus)}
      </div>` : ''}
    </aside>
  </section>
  <section class="about-strengths shell" aria-labelledby="strengths-heading">
    <header class="about-strengths__heading">
      <span class="eyebrow">${escapeHtml(context.copy.howIContribute)}</span>
      <h2 id="strengths-heading">${escapeHtml(context.copy.strengthsTitle)}</h2>
      <p>${escapeHtml(context.copy.strengthsIntro)}</p>
    </header>
    <div class="strength-list">
      ${data.profile.principles.map((principle, index) => `<article>
        <span>${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(principle.title)}</h3>
        <p>${escapeHtml(principle.description)}</p>
      </article>`).join('')}
    </div>
  </section>
  <section class="about-cta shell" aria-labelledby="about-cta-heading">
    <div>
      <span class="eyebrow">${escapeHtml(context.copy.selectedWork)}</span>
      <h2 id="about-cta-heading">${escapeHtml(context.copy.aboutCtaTitle)}</h2>
    </div>
    <div>
      <p>${escapeHtml(context.copy.aboutCtaText)}</p>
      <div class="home-intro__actions">
        <a class="primary-link" href="${urls.href('')}#work">${escapeHtml(context.copy.viewSelectedWork)}</a>
        <a class="text-link" href="${urls.href('timeline/')}">${escapeHtml(context.copy.viewTimeline)} <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>`;

  return renderLayout({
    title: context.copy.navigation.about,
    description: context.copy.aboutDescription(data.profile.name),
    path: 'about/',
    active: 'about',
    body
  }, context);
}

export function renderNotFound(data: CareerDataset, urls: UrlContext) {
  const context = createRenderContext(data, urls);
  const body = `<section class="not-found shell">
    <span class="eyebrow">404</span>
    <h1>${escapeHtml(context.copy.notFoundTitle)}</h1>
    <p>${escapeHtml(context.copy.notFoundText)}</p>
    <a class="text-link" href="${urls.href('')}">${escapeHtml(context.copy.returnHighlights)} <span aria-hidden="true">→</span></a>
  </section>`;
  return renderLayout({
    title: context.copy.notFound,
    description: context.copy.notFoundDescription,
    path: '404.html',
    body
  }, context);
}

export function renderSitemap(data: CareerDataset, urlContexts: UrlContext[]) {
  const contexts = Array.isArray(urlContexts) ? urlContexts : [urlContexts];
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
  const locations = contexts.flatMap((urls) => pages.map((page) => `  <url><loc>${escapeXml(urls.absolute(page))}</loc><lastmod>${escapeXml(data.updatedAt)}</lastmod></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations.join('\n')}\n</urlset>\n`;
}

export function renderFeed(data: CareerDataset, urls: UrlContext) {
  const copy = messagesFor(data.locale ?? urls.locale);
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
    <title>${escapeXml(data.profile.name)} — ${escapeXml(copy.portfolioTitle)}</title>
    <link>${escapeXml(urls.absolute(''))}</link>
    <description>${escapeXml(data.profile.intro)}</description>
    <language>${escapeXml(data.locale ?? urls.locale)}</language>
    <lastBuildDate>${new Date(`${data.updatedAt}T12:00:00.000Z`).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function renderRobots(urls: UrlContext) {
  return `User-agent: *\nAllow: /\nSitemap: ${urls.absolute('sitemap.xml')}\n`;
}

export function renderManifest(data: CareerDataset, urls: UrlContext) {
  const copy = messagesFor(data.locale ?? urls.locale);
  return `${JSON.stringify({
    name: `${data.profile.name} — ${copy.portfolioTitle}`,
    short_name: data.profile.name,
    lang: data.locale ?? urls.locale,
    start_url: urls.href(''),
    display: 'standalone',
    background_color: '#f4f1e9',
    theme_color: '#f4f1e9',
    icons: [{ src: urls.rootHref('assets/favicon.svg'), sizes: 'any', type: 'image/svg+xml' }]
  }, null, 2)}\n`;
}
