const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');

function currentTheme() {
  return root.dataset.theme === 'dark' ? 'dark' : 'light';
}

function updateThemeButton() {
  if (!themeToggle) return;
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  themeToggle.setAttribute('aria-label', `Use ${next} theme`);
}

if (themeToggle) {
  updateThemeButton();
  themeToggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('career-theme', next);
    } catch {}
    updateThemeButton();
  });
}

const timeline = document.querySelector('[data-timeline]');
if (timeline) {
  const entries = [...timeline.querySelectorAll('[data-entry]')];
  const years = [...timeline.querySelectorAll('[data-timeline-year]')];
  const buttons = [...document.querySelectorAll('[data-timeline-filter]')];
  const search = document.querySelector('[data-timeline-search]');
  const result = document.querySelector('[data-filter-result]');
  const empty = timeline.querySelector('[data-timeline-empty]');
  let activeKind = 'all';

  function applyFilters() {
    const query = search?.value.trim().toLowerCase() ?? '';
    let visible = 0;

    for (const entry of entries) {
      const matchesKind = activeKind === 'all' || entry.dataset.kind === activeKind;
      const matchesSearch = !query || entry.dataset.search.includes(query);
      entry.hidden = !(matchesKind && matchesSearch);
      if (!entry.hidden) visible += 1;
    }

    for (const year of years) {
      year.hidden = ![...year.querySelectorAll('[data-entry]')].some((entry) => !entry.hidden);
    }

    if (result) result.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'}`;
    if (empty) empty.hidden = visible !== 0;
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      activeKind = button.dataset.timelineFilter;
      for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
      applyFilters();
    });
  }

  search?.addEventListener('input', applyFilters);
}
