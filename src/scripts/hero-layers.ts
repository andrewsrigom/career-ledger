/** Layer selection is semantic UI, independent of the optional motion/WebGL chunks. */
export function setupHeroLayers(): () => void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const layers = [...document.querySelectorAll<HTMLButtonElement>('[data-hero-layer]')];
  const ribbon = hero?.querySelector<HTMLElement>('.hero-ribbon');
  if (!hero || !ribbon || !layers.length) return () => {};

  const sceneLayers = [...hero.querySelectorAll<SVGGElement>('[data-scene-layer]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let activeLayer = -1;
  let scrollLayer = 0;
  let hoveredLayer: number | null = null;
  let focusedLayer: number | null = null;
  let selectedLayer: number | null = null;
  let scrollStart = 0;
  let scrollDistance = 1;
  let progress = -1;
  let frame = 0;
  let visible = true;
  let needsMeasure = true;

  const select = () => {
    const index = hoveredLayer ?? focusedLayer ?? selectedLayer ?? scrollLayer;
    if (activeLayer === index) return;
    activeLayer = index;
    hero.dataset.activeLayer = String(index);
    layers.forEach((layer, i) => {
      layer.classList.toggle('is-current', i === index);
      layer.setAttribute('aria-pressed', String(i === index));
      sceneLayers[i]?.classList.toggle('is-current', i === index);
    });
    window.dispatchEvent(new CustomEvent('career:architecture-active', { detail: index }));
  };

  const measure = () => {
    const bounds = hero.getBoundingClientRect();
    const ribbonBounds = ribbon.getBoundingClientRect();
    // Walk deeper while both the diagram and its legend are still visible.
    scrollStart = Math.max(0, window.scrollY + ribbonBounds.top - window.innerHeight * .85, window.scrollY + bounds.top);
    scrollDistance = Math.max(1, window.scrollY + bounds.bottom - Math.min(320, window.innerHeight * .4) - scrollStart);
    const masks = [...hero.querySelectorAll<HTMLElement>('.hero-line')].map((line) => line.getBoundingClientRect());
    // All reads precede writes. Rounded ellipses follow the actual line breaks.
    masks.forEach((line, index) => {
      hero.style.setProperty(`--mask-${index}-x`, `${line.left - bounds.left + line.width / 2}px`);
      hero.style.setProperty(`--mask-${index}-y`, `${line.top - bounds.top + line.height / 2}px`);
      hero.style.setProperty(`--mask-${index}-w`, `${line.width / 2 + 90}px`);
      hero.style.setProperty(`--mask-${index}-h`, `${line.height / 2 + 36}px`);
    });
    needsMeasure = false;
  };

  const update = () => {
    frame = 0;
    if (document.hidden || !visible) return;
    if (needsMeasure) measure();
    const next = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, (window.scrollY - scrollStart) / scrollDistance));
    if (next !== progress) {
      progress = next;
      scrollLayer = Math.min(layers.length - 1, Math.floor(next * layers.length));
      hero.dataset.progress = String(next);
      hero.style.setProperty('--architecture-opacity', String(.52 + next * .13));
      window.dispatchEvent(new CustomEvent('career:architecture-progress', { detail: next }));
    }
    select();
  };
  const schedule = () => {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(update);
  };
  const onScroll = () => { selectedLayer = null; schedule(); };
  const onResize = () => { needsMeasure = true; schedule(); };
  const onVisibility = () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else { needsMeasure = true; schedule(); }
  };
  const observer = new ResizeObserver(onResize);
  observer.observe(hero);
  const viewObserver = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (visible) { needsMeasure = true; schedule(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  viewObserver.observe(hero);

  const removeListeners = layers.map((layer, index) => {
    layer.disabled = false;
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !finePointer.matches) return;
      hoveredLayer = index;
      select();
    };
    const leave = () => { hoveredLayer = null; select(); };
    const focus = () => { focusedLayer = index; hoveredLayer = null; select(); };
    const blur = () => { focusedLayer = null; select(); };
    const click = () => { selectedLayer = index; select(); };
    const key = (event: KeyboardEvent) => {
      const offsets: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      const offset = offsets[event.key];
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? layers.length - 1
        : offset !== undefined ? (index + offset + layers.length) % layers.length : null;
      if (next === null) return;
      event.preventDefault();
      const target = layers[next];
      if (!target) return;
      target.focus({ preventScroll: true });
      // Include the focus outline and a small breathing margin. Native focus
      // scrolling can leave a fractional edge clipped in short mobile views.
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    };
    layer.addEventListener('pointerenter', enter);
    layer.addEventListener('pointerleave', leave);
    layer.addEventListener('focus', focus);
    layer.addEventListener('blur', blur);
    layer.addEventListener('click', click);
    layer.addEventListener('keydown', key);
    return () => {
      layer.removeEventListener('pointerenter', enter);
      layer.removeEventListener('pointerleave', leave);
      layer.removeEventListener('focus', focus);
      layer.removeEventListener('blur', blur);
      layer.removeEventListener('click', click);
      layer.removeEventListener('keydown', key);
    };
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  reducedMotion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', onVisibility);
  select();
  schedule();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    viewObserver.disconnect();
    removeListeners.forEach((remove) => remove());
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    reducedMotion.removeEventListener('change', schedule);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
