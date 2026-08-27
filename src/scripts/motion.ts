import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupMotion() {
  const cleanups: Array<() => void> = [];
  const desktop = window.matchMedia('(min-width: 821px)');
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
