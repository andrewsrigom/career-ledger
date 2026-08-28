import * as THREE from 'three';

function layerGeometry(width: number, depth: number) {
  const box = new THREE.BoxGeometry(width, .06, depth);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
  return edges;
}

export function mountArchitectureScene(container: HTMLElement) {
  if (window.__careerArchitecture) return window.__careerArchitecture;
  const hero = container.closest<HTMLElement>('[data-hero]') ?? container;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return null;
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 6.4, -6.4, .1, 100);
  camera.position.set(9, 7.5, 11);
  camera.lookAt(0, -.4, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  container.replaceChildren(renderer.domElement);

  const root = new THREE.Group();
  root.rotation.y = -.28;
  root.position.set(3.4, .6, 0);
  scene.add(root);

  const layerColors = [0xe88a5c, 0x9dc4b3, 0x6f9e8a, 0x88a89c];
  const dimensions: Array<[number, number]> = [[5.4, 3.4], [6.4, 4.1], [7.4, 4.9], [8.4, 5.6]];
  const layerMaterials: THREE.LineBasicMaterial[] = [];
  const layers: THREE.LineSegments[] = [];
  dimensions.forEach(([width, depth], index) => {
    const material = new THREE.LineBasicMaterial({
      color: layerColors[index],
      transparent: true,
      opacity: .16
    });
    const layer = new THREE.LineSegments(layerGeometry(width, depth), material);
    layer.position.y = 2.6 - index * 1.35;
    root.add(layer);
    layers.push(layer);
    layerMaterials.push(material);
  });

  const clusterCount = 4;
  const clusterMaterials: THREE.MeshBasicMaterial[] = [];
  const clusterHaloMaterials: THREE.MeshBasicMaterial[] = [];
  const nodeGeometry = new THREE.SphereGeometry(.065, 10, 10);
  const haloGeometry = new THREE.SphereGeometry(.15, 10, 10);
  const clusterPositions: THREE.Vector3[][] = [];
  for (let clusterIndex = 0; clusterIndex < clusterCount; clusterIndex += 1) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: layerColors[clusterIndex], transparent: true, depthWrite: false });
    const halo = new THREE.MeshBasicMaterial({
      color: layerColors[clusterIndex],
      transparent: true,
      opacity: .22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    clusterMaterials.push(material);
    clusterHaloMaterials.push(halo);
    const y = 2.6 - clusterIndex * 1.35;
    const nodeCount = 6;
    const positions: THREE.Vector3[] = [];
    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
      const angle = (nodeIndex / nodeCount) * Math.PI * 2 + clusterIndex * .4;
      const radius = 2.1 + clusterIndex * .55 + (nodeIndex % 2) * .35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const node = new THREE.Mesh(nodeGeometry, material);
      node.position.set(x, y, z);
      group.add(node);
      const haloMesh = new THREE.Mesh(haloGeometry, halo);
      haloMesh.position.copy(node.position);
      group.add(haloMesh);
      positions.push(new THREE.Vector3(x, y, z));
    }
    root.add(group);
    clusterPositions.push(positions);
  }

  // Each layer owns its local connections and the handoff to the next layer.
  const bondMaterials: THREE.LineBasicMaterial[] = [];
  const bondGeometries: THREE.BufferGeometry[] = [];
  clusterPositions.forEach((positions, clusterIndex) => {
    const bondPoints: number[] = [];
    for (let i = 0; i < positions.length; i += 1) {
      const next = positions[(i + 1) % positions.length];
      bondPoints.push(positions[i]!.x, positions[i]!.y, positions[i]!.z, next!.x, next!.y, next!.z);
    }
    const nextCluster = clusterPositions[clusterIndex + 1];
    if (nextCluster) {
      for (let i = 0; i < 3; i += 1) {
        const a = positions[i * 2 % positions.length]!;
        const b = nextCluster[(i * 2 + 1) % nextCluster.length]!;
        bondPoints.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(bondPoints, 3));
    const material = new THREE.LineBasicMaterial({ color: layerColors[clusterIndex], transparent: true, depthWrite: false });
    root.add(new THREE.LineSegments(geometry, material));
    bondGeometries.push(geometry);
    bondMaterials.push(material);
  });

  const inactiveOpacity = .35;
  const activeOpacity = 1;
  const inactiveHalo = .04;
  const activeHalo = .24;

  let activeLayer = 0;
  const layerVisualTargets: number[] = new Array(clusterCount).fill(0).map((_, i) => (i === 0 ? 1 : 0));
  const layerVisualCurrent: number[] = layerVisualTargets.slice();
  const layerVisualStart: number[] = layerVisualTargets.slice();
  let layerTransitionStarted = performance.now();

  let pointerX = 0;
  let pointerY = 0;
  let progress = 0;
  let destroyed = false;
  let frame = 0;
  let visible = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const applyLayerVisuals = () => {
    const elapsed = Math.min(1, (performance.now() - layerTransitionStarted) / 360);
    const eased = reducedMotion.matches ? 1 : 1 - (1 - elapsed) ** 3;
    for (let i = 0; i < clusterCount; i += 1) {
      const target = layerVisualTargets[i]!;
      const start = layerVisualStart[i]!;
      layerVisualCurrent[i] = start + (target - start) * eased;
      const t = layerVisualCurrent[i]!;
      const material = clusterMaterials[i]!;
      const halo = clusterHaloMaterials[i]!;
      material.opacity = inactiveOpacity + (activeOpacity - inactiveOpacity) * t;
      halo.opacity = inactiveHalo + (activeHalo - inactiveHalo) * t;
      const layerMaterial = layerMaterials[i]!;
      layerMaterial.opacity = .2 + t * .6;
      bondMaterials[i]!.opacity = .15 + t * .7;
    }
  };

  const resize = () => {
    if (destroyed) return;
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    const aspect = width / Math.max(1, height);
    camera.left = -6.4 * aspect;
    camera.right = 6.4 * aspect;
    camera.top = 6.4;
    camera.bottom = -6.4;
    camera.updateProjectionMatrix();
    requestRender();
  };

  const render = () => {
    frame = 0;
    if (destroyed || document.hidden || !visible) return;
    root.rotation.y = -.28 + pointerX * .06 + progress * .16;
    root.rotation.x = -.08 + pointerY * .025;
    root.position.y = .6 - progress * .8;
    applyLayerVisuals();
    renderer.render(scene, camera);
    const stillAnimating = layerVisualCurrent.some((c, i) => Math.abs(c - layerVisualTargets[i]!) > .001);
    // Only a finite layer transition can schedule another frame without input.
    if (stillAnimating) frame = requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (!frame && !destroyed && !document.hidden && visible) frame = requestAnimationFrame(render);
  };

  const setProgress = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = THREE.MathUtils.clamp(value, 0, 1);
    if (next === progress) return;
    progress = next;
    requestRender();
  };

  const setActiveLayer = (index: number) => {
    if (!Number.isFinite(index)) return;
    const clamped = Math.max(0, Math.min(clusterCount - 1, Math.floor(index)));
    if (clamped === activeLayer) return;
    activeLayer = clamped;
    layerTransitionStarted = performance.now();
    for (let i = 0; i < clusterCount; i += 1) {
      layerVisualStart[i] = layerVisualCurrent[i]!;
      layerVisualTargets[i] = i === clamped ? 1 : 0;
    }
    requestRender();
  };

  const onActive = (event: Event) => setActiveLayer((event as CustomEvent<number>).detail);
  const onProgress = (event: Event) => setProgress((event as CustomEvent<number>).detail);
  const onPointer = (event: PointerEvent) => {
    pointerX = (event.clientX / Math.max(1, window.innerWidth) - .5) * 2;
    pointerY = (event.clientY / Math.max(1, window.innerHeight) - .5) * 2;
    requestRender();
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (visible) requestRender();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const viewObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      visible = entry.isIntersecting;
      if (visible) requestRender();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }
  }, { threshold: .05 });
  viewObserver.observe(container);
  // The editorial overlay covers the canvas, so listen on the enclosing hero.
  hero.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('career:architecture-active', onActive);
  window.addEventListener('career:architecture-progress', onProgress);
  document.addEventListener('visibilitychange', onVisibility);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    viewObserver.disconnect();
    hero.removeEventListener('pointermove', onPointer);
    window.removeEventListener('career:architecture-active', onActive);
    window.removeEventListener('career:architecture-progress', onProgress);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', destroy);
    nodeGeometry.dispose();
    haloGeometry.dispose();
    bondMaterials.forEach((material) => material.dispose());
    bondGeometries.forEach((geometry) => geometry.dispose());
    clusterMaterials.forEach((material) => material.dispose());
    clusterHaloMaterials.forEach((material) => material.dispose());
    layerMaterials.forEach((material) => material.dispose());
    layers.forEach((layer) => layer.geometry.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    container.closest('[data-architecture-scene]')?.classList.remove('is-webgl-ready');
    delete window.__careerArchitecture;
  };
  canvas.addEventListener('webglcontextlost', destroy, { once: true });

  container.closest('[data-architecture-scene]')?.classList.add('is-webgl-ready');
  setProgress(Number(hero.dataset.progress ?? 0));
  setActiveLayer(Number(hero.dataset.activeLayer ?? 0));
  const controller = { setActiveLayer, destroy, setProgress };
  window.__careerArchitecture = controller;
  requestRender();
  return controller;
}
