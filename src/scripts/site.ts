import { setupHeroLayers } from './hero-layers';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.documentElement.classList.add('has-js');

// Let the browser finish initial fragment positioning without a smooth scroll
// that layout/animation measurements could interrupt partway down the page.
const enableSmoothNavigation = () => {
  requestAnimationFrame(() => document.documentElement.classList.add('navigation-ready'));
};
if (document.readyState === 'complete') enableSmoothNavigation();
else window.addEventListener('load', enableSmoothNavigation, { once: true });

function setupHeaderScrollState() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;
  const threshold = 32;
  let scrolled = false;
  const evaluate = () => {
    const next = window.scrollY > threshold;
    if (next === scrolled) return;
    scrolled = next;
    header.dataset.scrolled = String(scrolled);
  };
  evaluate();
  window.addEventListener('scroll', evaluate, { passive: true });
}

function setupHeaderInvertedState() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const invertingSection = document.querySelector<HTMLElement>('[data-hero-inverted]');
  if (!header || !invertingSection) return;
  const evaluate = () => {
    const bounds = invertingSection.getBoundingClientRect();
    const headerHeight = header.getBoundingClientRect().height;
    const overlaps = bounds.bottom > headerHeight * .5 && bounds.top < headerHeight;
    header.dataset.inverted = String(overlaps);
  };
  evaluate();
  window.addEventListener('scroll', evaluate, { passive: true });
  window.addEventListener('resize', evaluate);
}

function setupSectionProgress() {
  const navigation = document.querySelector<HTMLElement>('[data-section-progress]');
  if (!navigation) return;
  const links = new Map(
    [...navigation.querySelectorAll<HTMLAnchorElement>('[data-section-link]')]
      .map((link) => [link.dataset.sectionLink, link])
  );
  const sections = [...links.keys()]
    .map((id) => id ? document.getElementById(id) : null)
    .filter((section): section is HTMLElement => Boolean(section));

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
    if (!visible) return;
    for (const link of links.values()) link.removeAttribute('aria-current');
    links.get(visible.target.id)?.setAttribute('aria-current', 'true');
  }, { rootMargin: '-34% 0px -54%', threshold: [0, .15, .4] });

  sections.forEach((section) => observer.observe(section));
  links.get('intro')?.setAttribute('aria-current', 'true');
}


function setupTimelineFilters() {
  const form = document.querySelector<HTMLFormElement>('[data-timeline-filters]');
  if (!form) return;
  const records = [...document.querySelectorAll<HTMLElement>('[data-timeline-entry]')];
  const search = form.querySelector<HTMLInputElement>('[data-timeline-search]');
  const count = document.querySelector<HTMLElement>('[data-timeline-count]');
  const empty = document.querySelector<HTMLElement>('[data-timeline-empty]');

  const apply = () => {
    const query = search?.value.trim().toLowerCase() ?? '';
    const significance = form.querySelector<HTMLInputElement>('input[name="significance"]:checked')?.value ?? 'all';
    const activityType = form.querySelector<HTMLInputElement>('input[name="activity-type"]:checked')?.value ?? 'all';
    let visible = 0;

    for (const record of records) {
      const matches = (!query || record.dataset.search?.includes(query))
        && (significance === 'all' || record.dataset.significance === significance)
        && (activityType === 'all' || record.dataset.activityTypes?.split(' ').includes(activityType));
      record.hidden = !matches;
      if (matches) visible += 1;
    }

    if (count) count.textContent = count.textContent?.replace(/^\d+/, String(visible)) ?? String(visible);
    if (empty) empty.hidden = visible !== 0;
  };

  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
}

const enhancedHero = window.matchMedia('(min-width: 821px) and (pointer: fine)');
let cleanupMotion: (() => void) | undefined;

function setupInteractiveHome() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero || reducedMotion.matches || !enhancedHero.matches) return;

  import('./motion').then(({ setupMotion }) => {
    if (!cleanupMotion && !reducedMotion.matches && enhancedHero.matches) cleanupMotion = setupMotion();
  }).catch(() => undefined);

  const canvas = hero.querySelector('[data-architecture-canvas]');
  if (!canvas) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    import('./architecture-scene').then(({ mountArchitectureScene }) => {
      if (!reducedMotion.matches && enhancedHero.matches) {
        hero.dataset.architecture = mountArchitectureScene(canvas as HTMLElement) ? 'ready' : 'fallback';
      }
    }).catch(() => hero.classList.add('architecture-fallback'));
  }, { rootMargin: '320px 0px' });
  observer.observe(canvas);
}

setupSectionProgress();
setupTimelineFilters();
setupHeaderScrollState();
setupHeaderInvertedState();
let cleanupHeroLayers = setupHeroLayers();
setupInteractiveHome();

window.addEventListener('pagehide', () => {
  cleanupHeroLayers();
  cleanupMotion?.();
  cleanupMotion = undefined;
  window.__careerArchitecture?.destroy();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) { cleanupHeroLayers = setupHeroLayers(); setupInteractiveHome(); }
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    cleanupMotion?.();
    cleanupMotion = undefined;
    window.__careerArchitecture?.destroy();
  }
  else setupInteractiveHome();
});
enhancedHero.addEventListener('change', (event) => {
  if (!event.matches) {
    cleanupMotion?.();
    cleanupMotion = undefined;
    window.__careerArchitecture?.destroy();
  } else setupInteractiveHome();
});
