const timeline = document.querySelector('[data-timeline]');
if (timeline) {
  const entries = [...timeline.querySelectorAll('[data-entry]')];
  const years = [...timeline.querySelectorAll('[data-timeline-year]')];
  const buttons = [...document.querySelectorAll('[data-timeline-filter-group]')];
  const search = document.querySelector('[data-timeline-search]');
  const result = document.querySelector('[data-filter-result]');
  const empty = timeline.querySelector('[data-timeline-empty]');
  const activeFilters = { kind: 'all', significance: 'all', activityType: 'all' };

  function applyFilters() {
    const query = search?.value.trim().toLowerCase() ?? '';
    let visible = 0;

    for (const entry of entries) {
      const matchesKind = activeFilters.kind === 'all' || entry.dataset.kind === activeFilters.kind;
      const matchesSignificance = activeFilters.significance === 'all'
        || entry.dataset.significance === activeFilters.significance;
      const matchesActivityType = activeFilters.activityType === 'all'
        || entry.dataset.activityTypes.split(' ').includes(activeFilters.activityType);
      const matchesSearch = !query || entry.dataset.search.includes(query);
      entry.hidden = !(matchesKind && matchesSignificance && matchesActivityType && matchesSearch);
      if (!entry.hidden) visible += 1;
    }

    for (const year of years) {
      year.hidden = ![...year.querySelectorAll('[data-entry]')].some((entry) => !entry.hidden);
    }

    if (result) {
      const label = visible === 1 ? result.dataset.resultOne : result.dataset.resultMany;
      result.textContent = `${visible} ${label}`;
    }
    if (empty) empty.hidden = visible !== 0;
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const group = button.dataset.timelineFilterGroup;
      activeFilters[group] = button.dataset.timelineFilterValue;
      for (const item of buttons.filter((candidate) => candidate.dataset.timelineFilterGroup === group)) {
        item.setAttribute('aria-pressed', String(item === button));
      }
      applyFilters();
    });
  }

  search?.addEventListener('input', applyFilters);
}
