import * as THREE from 'three';

function layerGeometry(width: number, depth: number) {
  const box = new THREE.BoxGeometry(width, .08, depth);
  const edges = new THREE.EdgesGeometry(box);
  box.dispose();
  return edges;
}

export function mountArchitectureScene(container: HTMLElement) {
  if (window.__careerArchitecture) return window.__careerArchitecture;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return null;
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 5.2, -5.2, .1, 100);
  camera.position.set(8, 8, 10);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  container.replaceChildren(renderer.domElement);

  const root = new THREE.Group();
  root.rotation.y = -.22;
  scene.add(root);

  const layers: THREE.LineSegments[] = [];
  const colors = [0xb44d2f, 0x2f6555, 0x173f34, 0x55766a, 0x7f948b];
  const dimensions = [[3.2, 2.1], [4.1, 2.8], [5, 3.5], [5.8, 4.2], [6.6, 4.9]];

  dimensions.forEach(([width, depth], index) => {
    const material = new THREE.LineBasicMaterial({
      color: colors[index],
      transparent: true,
      opacity: index === 0 ? .95 : .08
    });
    const layer = new THREE.LineSegments(layerGeometry(width!, depth!), material);
    layer.position.y = 2.5 - index * 1.25;
    root.add(layer);
    layers.push(layer);
  });

  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xb44d2f });
  const nodes = new THREE.Group();
  const points = [
    [-1.4, 2.55, -.7], [1.4, 2.55, .7], [-2, 1.3, 1], [2, 1.3, -1],
    [-2.5, .05, -1.2], [0, .05, 1.5], [2.5, .05, .3], [-2.8, -1.2, 1.6],
    [1.2, -1.2, -1.8], [3, -2.45, 1.4], [-1.5, -2.45, -1.7]
  ];
  points.forEach(([x, y, z]) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 10), nodeMaterial);
    node.position.set(x!, y!, z!);
    nodes.add(node);
  });
  root.add(nodes);

  const pathMaterial = new THREE.LineBasicMaterial({ color: 0x769589, transparent: true, opacity: .55 });
  const pathPoints: number[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    pathPoints.push(...points[index]!, ...points[index + 1]!);
  }
  const paths = new THREE.BufferGeometry();
  paths.setAttribute('position', new THREE.Float32BufferAttribute(pathPoints, 3));
  root.add(new THREE.LineSegments(paths, pathMaterial));

  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let destroyed = false;
  let frame = 0;

  const resize = () => {
    if (destroyed) return;
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    const aspect = width / Math.max(1, height);
    camera.left = -5.2 * aspect;
    camera.right = 5.2 * aspect;
    camera.top = 5.2;
    camera.bottom = -5.2;
    camera.updateProjectionMatrix();
    requestRender();
  };

  const render = () => {
    frame = 0;
    if (destroyed || document.hidden) return;
    root.rotation.y = -.22 + progress * .3 + pointerX * .08;
    root.rotation.x = -.06 + pointerY * .04;
    camera.position.y = 8 - progress * 1.1;
    camera.lookAt(0, -.15 - progress * .4, 0);
    layers.forEach((layer, index) => {
      const threshold = index / layers.length;
      const opacity = THREE.MathUtils.smoothstep(progress + .2, threshold, Math.min(1, threshold + .32));
      (layer.material as THREE.LineBasicMaterial).opacity = index === 0 ? .9 : .08 + opacity * .78;
      layer.position.y = 2.5 - index * (1.25 - progress * .08);
    });
    renderer.render(scene, camera);
  };

  // Coalesce input events into at most one frame. No self-scheduling render loop.
  const requestRender = () => {
    if (!frame && !destroyed && !document.hidden) frame = requestAnimationFrame(render);
  };

  const setProgress = (value: number) => {
    progress = THREE.MathUtils.clamp(value, 0, 1);
    requestRender();
  };
  const onProgress = (event: Event) => setProgress((event as CustomEvent<number>).detail);
  const onPointer = (event: PointerEvent) => {
    const bounds = container.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - .5) * 2;
    pointerY = ((event.clientY - bounds.top) / Math.max(1, bounds.height) - .5) * 2;
    requestRender();
  };
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  container.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('career:architecture-progress', onProgress);
  document.addEventListener('visibilitychange', onVisibility);

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    container.removeEventListener('pointermove', onPointer);
    window.removeEventListener('career:architecture-progress', onProgress);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', destroy);
    root.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
    renderer.dispose();
    renderer.domElement.remove();
    container.closest('[data-architecture-scene]')?.classList.remove('is-webgl-ready');
    delete window.__careerArchitecture;
  };
  canvas.addEventListener('webglcontextlost', destroy, { once: true });

  const initial = Number(container.closest<HTMLElement>('[data-hero]')?.dataset.progress ?? 0);
  setProgress(Number.isFinite(initial) ? initial : 0);
  container.closest('[data-architecture-scene]')?.classList.add('is-webgl-ready');
  window.__careerArchitecture = { setProgress, destroy };
  return window.__careerArchitecture;
}
