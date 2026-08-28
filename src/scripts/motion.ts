import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupMotion() {
  const cleanups: Array<() => void> = [];
  const desktop = window.matchMedia('(min-width: 821px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const initialMount = !document.documentElement.classList.contains('motion-loaded');
  if (desktop.matches) document.documentElement.classList.add('has-motion');
  document.documentElement.classList.add('motion-loaded');

  const context = gsap.context(() => {
    const heroTitleWords = gsap.utils.toArray<HTMLElement>('[data-hero-title] .hero-word > span');
    if (heroTitleWords.length && desktop.matches) {
      gsap.fromTo(heroTitleWords, { y: 0, yPercent: 115 }, {
        y: 0, yPercent: 0, duration: .7, ease: 'power4.out', stagger: .035
      });
    }

    // One timeline owns each composition. Restored/previously read content
    // stays in its final state when enhancement is mounted again.
    function reveal(element: HTMLElement, compose: (timeline: gsap.core.Timeline) => void) {
      // A direct anchor is already being read. A late motion import must not
      // hide it while ScrollTrigger measures the restored scroll position.
      const anchorTarget = element.closest(':target') || element.querySelector(':target');
      if (anchorTarget || element.dataset.motionComplete === 'true' || element.contains(document.activeElement) || element.getBoundingClientRect().top < 0) {
        element.dataset.motionComplete = 'true';
        return;
      }
      const timeline = gsap.timeline({
        defaults: { duration: .65, ease: 'power3.out' },
        onComplete: () => { element.dataset.motionComplete = 'true'; },
        scrollTrigger: {
          trigger: element,
          start: 'top 90%',
          once: true,
          fastScrollEnd: true,
          onLeave: () => { timeline.progress(1); }
        }
      });
      compose(timeline);
      // Focus may arrive before a lazy motion import or during a scroll reveal.
      // Reading a focused composition must never wait for its trigger.
      const finishOnFocus = () => { timeline.progress(1); };
      element.addEventListener('focusin', finishOnFocus);
      cleanups.push(() => element.removeEventListener('focusin', finishOnFocus));
    }

    gsap.utils.toArray<HTMLElement>('.section-heading').forEach((heading) => {
      reveal(heading, (timeline) => {
        timeline.from(heading.querySelector('.eyebrow'), { opacity: 0, y: 8 }, 0)
          .from(heading.querySelector('h2'), { opacity: 0, y: 24, duration: .8 }, .05);
        const descriptions = heading.querySelectorAll('p');
        if (descriptions.length) timeline.from(descriptions, { opacity: 0, y: 12, stagger: .06 }, .18);
      });
    });

    gsap.utils.toArray<HTMLElement>('[data-reveal]:not(.section-heading)').forEach((element) => {
      reveal(element, (timeline) => { timeline.from(element, { opacity: 0, y: 20 }); });
    });

    gsap.utils.toArray<HTMLElement>('[data-project-row]').forEach((row) => {
      reveal(row, (timeline) => {
        const compact = row.classList.contains('project-row--compact');
        timeline.from(row.querySelector('.project-row__link'), { opacity: 0, y: compact ? 12 : 24, duration: compact ? .45 : .65 }, 0);
        const visual = row.querySelector('.project-preview');
        if (visual) timeline.from(visual, { opacity: 0, y: compact ? 8 : 16 }, compact ? .05 : .1);
        const layers = row.querySelectorAll('.project-layers li');
        if (layers.length) timeline.from(layers, { opacity: 0, y: 4, stagger: .035, duration: .4 }, .12);
        const bars = row.querySelectorAll('.project-work-chart__track i');
        if (bars.length) timeline.from(bars, { scaleX: 0, transformOrigin: 'left center', stagger: .07, duration: .55 }, .2);
        const result = row.querySelector('.project-row__signal');
        if (result) timeline.from(result, { opacity: 0, y: 12 }, .23);
        const edges = row.querySelectorAll<SVGPathElement>('[data-preview-edge]');
        edges.forEach((edge) => {
          const length = edge.getTotalLength();
          timeline.fromTo(edge, { strokeDasharray: length, strokeDashoffset: length }, {
            strokeDashoffset: 0, duration: .8
          }, .15);
        });
      });
    });

    const landscape = document.querySelector<HTMLElement>('.landscape__visual');
    if (landscape) {
      reveal(landscape, (timeline) => {
        timeline.from(landscape.querySelector('.landscape-grid'), { opacity: 0 }, 0)
          .from(landscape.querySelectorAll('.landscape-nodes circle'), { opacity: 0, scale: .8, transformOrigin: 'center', stagger: .045 }, .08);
        landscape.querySelectorAll<SVGPathElement>('[data-landscape-edge]').forEach((edge, index) => {
          const length = edge.getTotalLength();
          timeline.fromTo(edge, { strokeDasharray: length, strokeDashoffset: length }, {
            strokeDashoffset: 0, duration: .75
          }, .15 + index * .025);
        });
        timeline.from(landscape.querySelectorAll('.landscape-nodes text'), { opacity: 0, duration: .45 }, .35)
          .from(landscape.querySelector('.landscape__list'), { opacity: 0, y: 12 }, .25);
      });
    }

    const mix = document.querySelector<HTMLElement>('.activity-mix');
    if (mix) reveal(mix, (timeline) => {
      timeline.from(mix.querySelectorAll('.activity-mix__bar i'), { scaleX: 0, transformOrigin: 'left center', duration: .8, stagger: .04 });
    });

    gsap.utils.toArray<HTMLElement>('[data-experience-row]').forEach((row) => {
      reveal(row, (timeline) => {
        timeline.from(row.querySelector('.experience-timeline__segment'), { scaleY: 0, duration: .85, ease: 'power2.out' }, 0)
          .from(row.querySelectorAll('.experience-timeline__date > *'), { opacity: 0, y: 8, stagger: .04 }, 0)
          .from(row.querySelector('.experience-timeline__role'), { opacity: 0, y: 16 }, .08)
          .from(row.querySelector('.experience-timeline__body'), { opacity: 0, y: 12 }, .18);
      });
    });

    if (desktop.matches && finePointer.matches) {
      cleanups.push(setupMagneticNav(), setupCursorBlob());
    }
  });

  const revealKeyboardFocus = () => {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement) || !focused.matches(':focus-visible')) return;
    const bounds = focused.getBoundingClientRect();
    const headerBottom = document.querySelector('[data-site-header]')?.getBoundingClientRect().bottom ?? 0;
    if (bounds.bottom <= headerBottom || bounds.top >= window.innerHeight) {
      // Native smooth focus scrolling can be interrupted by GSAP's initial
      // measurements. Restore the focused target, only on focus or mounting.
      focused.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  };
  document.addEventListener('focusin', revealKeyboardFocus);
  if (initialMount) revealKeyboardFocus();
  cleanups.push(() => document.removeEventListener('focusin', revealKeyboardFocus));

  let refreshFrame = 0;
  let disposed = false;
  const refresh = () => {
    if (disposed || refreshFrame) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      // A forced refresh resets the scroller and can interrupt a native
      // smooth anchor jump halfway through. Wait for scrolling to settle.
      ScrollTrigger.refresh(true);
    });
  };
  const imageLoad = (event: Event) => { if (event.target instanceof HTMLImageElement) refresh(); };
  document.addEventListener('load', imageLoad, true);
  document.addEventListener('toggle', refresh, true);
  window.addEventListener('load', refresh);
  window.addEventListener('hashchange', refresh);
  void document.fonts.ready.then(refresh);
  refresh();

  const visibility = () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else { gsap.globalTimeline.resume(); refresh(); }
  };
  document.addEventListener('visibilitychange', visibility);
  cleanups.push(() => {
    disposed = true;
    cancelAnimationFrame(refreshFrame);
    context.revert();
    document.documentElement.classList.remove('has-motion');
    document.removeEventListener('load', imageLoad, true);
    document.removeEventListener('toggle', refresh, true);
    window.removeEventListener('load', refresh);
    window.removeEventListener('hashchange', refresh);
    document.removeEventListener('visibilitychange', visibility);
    gsap.globalTimeline.resume();
  });
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanup = () => {
    cleanups.splice(0).forEach((item) => item());
    preference.removeEventListener('change', cleanup);
    window.removeEventListener('pagehide', cleanup);
  };
  preference.addEventListener('change', cleanup, { once: true });
  window.addEventListener('pagehide', cleanup, { once: true });
  return cleanup;
}

function setupMagneticNav() {
  const navLinks = [...document.querySelectorAll<HTMLElement>('.primary-nav a')];
  const removeListeners = navLinks.map((link) => {
    const xTo = gsap.quickTo(link, 'x', { duration: .4, ease: 'power3.out' });
    const yTo = gsap.quickTo(link, 'y', { duration: .4, ease: 'power3.out' });
    const move = (event: PointerEvent) => {
      const rect = link.getBoundingClientRect();
      const relX = (event.clientX - (rect.left + rect.width / 2)) * .28;
      const relY = (event.clientY - (rect.top + rect.height / 2)) * .28;
      xTo(relX);
      yTo(relY);
    };
    const leave = () => { xTo(0); yTo(0); };
    link.addEventListener('pointermove', move);
    link.addEventListener('pointerleave', leave);
    return () => {
      link.removeEventListener('pointermove', move);
      link.removeEventListener('pointerleave', leave);
    };
  });
  return () => removeListeners.forEach((remove) => remove());
}

function setupCursorBlob() {
  const blob = document.querySelector<HTMLElement>('[data-cursor]');
  if (!blob) return () => {};
  const xTo = gsap.quickTo(blob, 'x', { duration: .35, ease: 'power3.out' });
  const yTo = gsap.quickTo(blob, 'y', { duration: .35, ease: 'power3.out' });
  const activate = () => blob.classList.add('is-active');
  const deactivate = () => blob.classList.remove('is-active');
  const move = (event: PointerEvent) => {
    if (!blob.classList.contains('is-active')) activate();
    xTo(event.clientX - 7);
    yTo(event.clientY - 7);
  };
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerleave', deactivate);
  window.addEventListener('blur', deactivate);
  const hoverSelectors = 'a, button, summary, [role="button"], .project-row, [data-hero-layer]';
  const removeListeners = [...document.querySelectorAll(hoverSelectors)].map((element) => {
    const enter = () => blob.classList.add('is-hover');
    const leave = () => blob.classList.remove('is-hover');
    element.addEventListener('pointerenter', enter);
    element.addEventListener('pointerleave', leave);
    return () => {
      element.removeEventListener('pointerenter', enter);
      element.removeEventListener('pointerleave', leave);
    };
  });
  return () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerleave', deactivate);
    window.removeEventListener('blur', deactivate);
    removeListeners.forEach((remove) => remove());
    blob.classList.remove('is-active', 'is-hover');
  };
}
