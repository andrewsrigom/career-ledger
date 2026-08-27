const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.documentElement.classList.add('has-js');

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

function setupProjectPreviews() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 821px)').matches) return;
  const rows = document.querySelectorAll<HTMLElement>('[data-project-row]');

  rows.forEach((row) => {
    const preview = row.querySelector<HTMLElement>('[data-project-preview]');
    const link = row.querySelector<HTMLAnchorElement>('.project-row__link');
    if (!preview || !link) return;
    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const draw = () => {
      currentX += (targetX - currentX) * (reducedMotion.matches ? 1 : .22);
      currentY += (targetY - currentY) * (reducedMotion.matches ? 1 : .22);
      preview.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
      if (Math.abs(targetX - currentX) > .2 || Math.abs(targetY - currentY) > .2) {
        frame = requestAnimationFrame(draw);
      }
    };

    const place = (x: number, y: number) => {
      const width = preview.offsetWidth || 410;
      const height = preview.offsetHeight || 270;
      targetX = Math.min(window.innerWidth - width - 24, Math.max(window.innerWidth * .57, x + 28));
      targetY = Math.min(window.innerHeight - height - 24, Math.max(24, y - height * .48));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    row.addEventListener('pointerenter', (event) => {
      row.classList.add('is-previewing');
      currentX = event.clientX + 28;
      currentY = event.clientY - 120;
      place(event.clientX, event.clientY);
    });
    row.addEventListener('pointermove', (event) => place(event.clientX, event.clientY));
    row.addEventListener('pointerleave', () => {
      row.classList.remove('is-previewing');
      cancelAnimationFrame(frame);
    });
    link.addEventListener('focus', () => {
      const bounds = row.getBoundingClientRect();
      row.classList.add('is-previewing');
      currentX = Math.min(window.innerWidth - 440, bounds.right - 380);
      currentY = Math.min(window.innerHeight - 300, Math.max(24, bounds.top + 20));
      place(currentX, currentY + 120);
    });
    link.addEventListener('blur', () => row.classList.remove('is-previewing'));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(frame);
    });
  });
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

function setupInteractiveHome() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero || reducedMotion.matches) return;

  import('./motion').then(({ setupMotion }) => setupMotion()).catch(() => undefined);

  if (!window.matchMedia('(min-width: 821px) and (pointer: fine)').matches) return;
  const canvas = hero.querySelector('[data-architecture-canvas]');
  if (!canvas) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    import('./architecture-scene').then(({ mountArchitectureScene }) => {
      if (!reducedMotion.matches) {
        hero.dataset.architecture = mountArchitectureScene(canvas as HTMLElement) ? 'ready' : 'fallback';
      }
    }).catch(() => hero.classList.add('architecture-fallback'));
  }, { rootMargin: '320px 0px' });
  observer.observe(canvas);
}

setupSectionProgress();
setupProjectPreviews();
setupTimelineFilters();
setupHeaderScrollState();
setupInteractiveHome();

window.addEventListener('pagehide', () => window.__careerArchitecture?.destroy());
window.addEventListener('pageshow', (event) => { if (event.persisted) setupInteractiveHome(); });
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) window.__careerArchitecture?.destroy();
  else setupInteractiveHome();
});
window.matchMedia('(min-width: 821px) and (pointer: fine)').addEventListener('change', (event) => {
  if (!event.matches) window.__careerArchitecture?.destroy();
});
