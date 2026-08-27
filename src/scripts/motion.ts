import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupMotion() {
  const cleanups: Array<() => void> = [];
  const desktop = window.matchMedia('(min-width: 821px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (desktop.matches) document.documentElement.classList.add('has-motion');
  const context = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
      gsap.from(element, {
        opacity: 0,
        y: 28,
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray<HTMLElement>('.section-heading h2').forEach((heading) => {
      gsap.from(heading, {
        yPercent: 24,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: heading, start: 'top 82%', once: true }
      });
    });

    gsap.utils.toArray<HTMLElement>('.project-row').forEach((row) => {
      gsap.from(row, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 88%', once: true }
      });
    });

    const activityBars = gsap.utils.toArray<HTMLElement>('.activity-mix__bar i');
    if (activityBars.length) {
      gsap.from(activityBars, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power2.out',
        stagger: .08,
        scrollTrigger: { trigger: '.activity-mix', start: 'top 78%', once: true }
      });
    }

    const hero = document.querySelector<HTMLElement>('[data-hero]');
    const layers = [...document.querySelectorAll<HTMLElement>('[data-hero-layer]')];
    if (hero && layers.length && desktop.matches) {
      const update = (progress: number) => {
        const normalized = Math.max(0, Math.min(1, progress));
        const active = Math.min(layers.length - 1, Math.floor(normalized * layers.length));
        hero.dataset.progress = String(normalized);
        layers.forEach((layer, index) => layer.classList.toggle('is-current', index === active));
        window.dispatchEvent(new CustomEvent('career:architecture-progress', { detail: normalized }));
      };
      update(0);
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        onRefresh: (self) => update(self.progress),
        onUpdate: (self) => update(self.progress)
      });
    }

    if (hero && finePointer.matches && desktop.matches) {
      const spotX = gsap.quickTo(hero, '--spot-x' as never, { duration: .8, ease: 'power3.out' });
      const spotY = gsap.quickTo(hero, '--spot-y' as never, { duration: .8, ease: 'power3.out' });
      const spotStrength = gsap.quickTo(hero, '--spot-strength' as never, { duration: .6, ease: 'power2.out' });
      const onMove = (event: PointerEvent) => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 100;
        const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 100;
        spotX(`${x}%` as never);
        spotY(`${y}%` as never);
        spotStrength(1 as never);
      };
      const onLeave = () => spotStrength(0 as never);
      hero.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave);
    }

    if (finePointer.matches && desktop.matches) {
      const navLinks = [...document.querySelectorAll<HTMLElement>('.primary-nav a')];
      navLinks.forEach((link) => {
        const xTo = gsap.quickTo(link, 'x', { duration: .4, ease: 'power3.out' });
        const yTo = gsap.quickTo(link, 'y', { duration: .4, ease: 'power3.out' });
        link.addEventListener('pointermove', (event) => {
          const rect = link.getBoundingClientRect();
          const relX = (event.clientX - (rect.left + rect.width / 2)) * .28;
          const relY = (event.clientY - (rect.top + rect.height / 2)) * .28;
          xTo(relX);
          yTo(relY);
        });
        link.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    const landscape = document.querySelector<HTMLElement>('[data-landscape]');
    if (landscape) {
      const edges = landscape.querySelectorAll<SVGPathElement>('[data-landscape-edge]');
      edges.forEach((edge) => {
        const length = edge.getTotalLength();
        gsap.set(edge, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.to(edges, {
        strokeDashoffset: 0,
        duration: 1.5,
        ease: 'power2.out',
        stagger: .07,
        scrollTrigger: { trigger: landscape, start: 'top 72%', once: true }
      });
    }
  });

  const visibility = () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  };
  document.addEventListener('visibilitychange', visibility);
  cleanups.push(() => {
    context.revert();
    document.documentElement.classList.remove('has-motion');
    document.removeEventListener('visibilitychange', visibility);
    gsap.globalTimeline.resume();
  });
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanup = () => {
    cleanups.splice(0).forEach((item) => item());
    preference.removeEventListener('change', cleanup);
  };
  preference.addEventListener('change', cleanup, { once: true });
  window.addEventListener('pagehide', cleanup, { once: true });
  return cleanup;
}
