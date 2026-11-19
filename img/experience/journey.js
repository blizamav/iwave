import { createEffects } from './exp009.js?v=ux014';
/* EXP-002 — motor visual aislado. El HTML no depende de WebGL. */
const canvas = document.querySelector('#journey-canvas');
const host = canvas?.parentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 820px)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const constrained = navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2);

// En ahorro de datos o movimiento reducido se conserva el esquema CSS sin descargar Three.
if (canvas && !reduced.matches && !constrained) {
  import('./vendor/three.module.min.js').then(THREE => {
    if (reduced.matches) return;
    startJourney(THREE);
  }).catch(() => host.classList.remove('is-ready'));
}

function startJourney(T) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return; // WebGL desactivado: el esquema CSS permanece visible.
  }
  const effects = createEffects(T, renderer, canvas);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, .1, 80);
  const system = new T.Group();
  scene.add(system);
  const geometry = new T.BoxGeometry(.64, .13, .44);
  const edges = new T.EdgesGeometry(geometry);
  const surface = new T.MeshBasicMaterial({ color: 0x102c3d, transparent: true, opacity: .78 });
  const ink = new T.LineBasicMaterial({ color: 0x79d7ff, transparent: true, opacity: .52 });
  const pulseMaterial = new T.MeshBasicMaterial({ color: 0xa6edff, transparent:true, opacity:.65 });
  const pulseGeometry = new T.BoxGeometry(.04, .04, .04);
  const count = compact.matches ? 12 : 24;
  const records = [];
  const wires = [];
  const lanes = [];
  const temporary = new T.Vector3();
  for (let i = 0; i < count; i++) {
    const object = new T.Group();
    object.add(new T.Mesh(geometry, surface), new T.LineSegments(edges, ink));
    system.add(object);
    const lane = i % 4;
    // Disposición determinista: fuentes → canales de procesamiento → matriz organizada.
    const scattered = new T.Vector3((i % 6 - 2.5) * 1.28, Math.sin(i * 2.4) * 2.1, Math.cos(i * 1.7) * 1.3);
    const connected = new T.Vector3((Math.floor(i / 4) - (count / 4 - 1) / 2) * .88, (lane - 1.5) * .8, 0);
    const intelligence = new T.Vector3((i % 6 - 2.5) * .72, -1.4 + (Math.floor(i / 6) + 1) * (.35 + (i % 6) * .12), (Math.floor(i / 6) - 1.5) * .55);
    const identity = new T.Vector3(Math.cos(i / count * Math.PI * 2) * 2.8, Math.sin(i / count * Math.PI * 2) * 2.1, Math.sin(i / count * Math.PI * 4) * .6);
    const organized = new T.Vector3((i % 4 - 1.5) * .86, (Math.floor(i / 4) - (count / 4 - 1) / 2) * .48, -.15 * lane);
    records.push({ object, scattered, connected, organized, identity, intelligence });
    if (i >= 4) {
      const g = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
      const line = new T.Line(g, ink);
      system.add(line);
      wires.push({ line, from: i - 4, to: i });
    }
  }
  for (let lane = 0; lane < 4; lane++) {
    const pulse = new T.Mesh(pulseGeometry, pulseMaterial);
    system.add(pulse);
    lanes.push(pulse);
  }
  const anchors = ['inicio', 'transformacion', 'servicios', 'experiencia', 'capacidades', 'proceso', 'contacto'].map(id => document.getElementById(id));
  let offsets = [];
  const scrollState = { value: 0 };
  const triggers = [];
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    anchors.slice(0, -1).forEach((element, i) => {
      triggers.push(ScrollTrigger.create({ trigger: element, start: 'top 25%', endTrigger: anchors[i + 1], end: 'top 25%',
        onUpdate: self => { scrollState.value = i + self.progress; } }));
    });
  }
  // UX-011: deterministic data layers, persistent buffers, one shared render loop.
  const field = document.createElement('canvas'); field.width = field.height = 128;
  const brush = field.getContext('2d');
  const texture = new T.CanvasTexture(field);
  const palette = getComputedStyle(document.documentElement);
  const cyan = new T.Color(palette.getPropertyValue('--accent-primary').trim() || '#35D6FF');
  const blue = new T.Color(palette.getPropertyValue('--accent-depth').trim() || '#246BFD');
  const uniforms = {
    uSpecialty: { value: 0 }, uTouch: { value: texture }, uTime: { value: 0 },
    uPixel: { value: 1 }, uActivity: { value: .55 }, uBrightness: { value: .7 },
    uCyan: { value: cyan }, uBlue: { value: blue }, uTint: { value: .28 }
  };
  // UX-014: actual DOM chapter order, shared by scroll and atmosphere.
  const atmospheres = [
    { activity:.50, brightness:.82, tint:.25, glow:.16, x:76, y:40 },
    { activity:1.0, brightness:.85, tint:.20, glow:.20, x:52, y:50 },
    { activity:.42, brightness:.55, tint:.65, glow:.13, x:80, y:52 },
    { activity:.18, brightness:.28, tint:.48, glow:.045,x:65, y:40 },
    { activity:.72, brightness:.72, tint:.58, glow:.18, x:25, y:50 },
    { activity:.65, brightness:.65, tint:.15, glow:.13, x:45, y:60 },
    { activity:.12, brightness:.32, tint:.30, glow:.065,x:75, y:60 }
  ];
  const seed = i => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const particleCount = compact.matches ? 270 : 660;
  const points = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const seeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const layer = i % 3;
    points.set([(seed(i) - .5) * 16, (seed(i + 701) - .5) * 12,
      [-9, -3, 2.5][layer] + seed(i + 57) * 1.5], i * 3);
    sizes[i] = 1.0 + seed(i + 47) * 1.6 + (layer === 2 ? .65 : 0);
    seeds[i] = seed(i + 29);
  }
  const motionShader = `
    uniform float uTime; uniform float uActivity; uniform float uSpecialty;
    attribute float aSeed;
    vec3 dataPosition(vec3 p){
      float t=uTime*(.035+aSeed*.018)+aSeed*6.283;
      p.xy+=vec2(cos(t+p.z*.14),sin(t*.7+p.x*.12))*(.22+uActivity*.18);
      p.z+=sin(t*.6+aSeed*9.)*.35;
      p.y+=sin(uTime*.022+aSeed*12.)*.35;
      return p;
    }`;
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute('position', new T.BufferAttribute(points, 3));
  dustGeometry.setAttribute('aSize', new T.BufferAttribute(sizes, 1));
  dustGeometry.setAttribute('aSeed', new T.BufferAttribute(seeds, 1));
  const dustMaterial = new T.ShaderMaterial({ uniforms, transparent:true, depthWrite:false,
    blending:T.AdditiveBlending,
    vertexShader: motionShader + `
      attribute float aSize; uniform sampler2D uTouch; uniform float uPixel;
      varying float vLight; varying float vTint;
      void main(){
        vec3 p=dataPosition(position);
        vec4 clip=projectionMatrix*modelViewMatrix*vec4(p,1.);
        float touch=texture2D(uTouch,clip.xy/clip.w*.5+.5).r;
        p.xy+=normalize(p.xy+vec2(.001))*touch*.16;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        vLight=mix(.40,1.0,smoothstep(-23.,-8.,mv.z))+touch*.15;
        vTint=aSeed;
        gl_PointSize=clamp(aSize*40./-mv.z,1.75,7.5)*uPixel;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform vec3 uCyan; uniform vec3 uBlue; uniform float uTint; uniform float uBrightness;
      varying float vLight; varying float vTint;
      void main(){
        float r=length(gl_PointCoord-.5)*2.;
        float halo=exp(-r*r*5.)*(1.-smoothstep(.72,1.,r));
        float core=1.-smoothstep(.0,.30,r);
        vec3 color=mix(uCyan,uBlue,smoothstep(.2,.9,vTint)*uTint);
        color=mix(color,vec3(.82,.94,1.),core*.42);
        gl_FragColor=vec4(color,halo*vLight*uBrightness);
      }`
  });
  const dust = new T.Points(dustGeometry,dustMaterial); dust.frustumCulled=false; scene.add(dust);
  system.visible=!compact.matches;
  surface.visible=false;
  ink.opacity=.22;
  // Sparse local links breathe in and out: data relationships, not a dense star mesh.
  const linkPoints=[], linkSeeds=[], linkPhases=[];
  for(let i=0;i<particleCount && linkPhases.length<96;i+=7){
    let nearest=-1, distance=2.2;
    for(let j=i+3;j<particleCount;j+=3){
      const d=Math.hypot(points[i*3]-points[j*3],points[i*3+1]-points[j*3+1],points[i*3+2]-points[j*3+2]);
      if(d<distance && d>.65){nearest=j;distance=d;}
    }
    if(nearest<0)continue;
    for(const j of [i,nearest]){
      linkPoints.push(points[j*3],points[j*3+1],points[j*3+2]);
      linkSeeds.push(seeds[j]);linkPhases.push(seed(i+91));
    }
  }
  const linkGeometry=new T.BufferGeometry();
  linkGeometry.setAttribute('position',new T.Float32BufferAttribute(linkPoints,3));
  linkGeometry.setAttribute('aSeed',new T.Float32BufferAttribute(linkSeeds,1));
  linkGeometry.setAttribute('aPhase',new T.Float32BufferAttribute(linkPhases,1));
  const linkMaterial=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:motionShader+`attribute float aPhase;varying float vAlpha;
      void main(){vec3 p=dataPosition(position);
        float cycle=fract(uTime*.045+aPhase);
        vAlpha=smoothstep(.08,.30,cycle)*(1.-smoothstep(.52,.80,cycle));
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform vec3 uCyan;uniform vec3 uBlue;uniform float uActivity;uniform float uBrightness;
      varying float vAlpha;void main(){gl_FragColor=vec4(mix(uCyan,uBlue,.45),vAlpha*uActivity*uBrightness*.26);}`
  });
  const network=new T.LineSegments(linkGeometry,linkMaterial);network.frustumCulled=false;scene.add(network);
  const smoothPointer = { x: 0, y: 0 };
  let previousX = .5, previousY = .5;

  let target = 0;
  let progress = 0;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let sceneX = 2.2;
  let specialty = 0;
  let stopped = false;
  let disposed = false;
  let inView = true;
  let slowFrames = 0;
  let frameInterval = 1000 / 30;
  // Resolución física hasta 2×, con presupuesto de 8 MP para pantallas grandes.
  const resolution = () => Math.min(devicePixelRatio || 1, 2, Math.max(1, Math.sqrt(8000000 / Math.max(1, innerWidth * innerHeight))));
  const pointer = { x: 0, y: 0 };
  const controller = new AbortController();
  const listen = (where, name, handler, options = {}) => where.addEventListener(name, handler, { ...options, signal: controller.signal });
  const readProgress = () => {
    const position = scrollY + innerHeight * .25;
    let stage = 0;
    while (stage < offsets.length - 2 && position > offsets[stage + 1]) stage++;
    const span = Math.max(1, offsets[stage + 1] - offsets[stage]);
    target = Math.max(0, Math.min(anchors.length - 1, stage + (position - offsets[stage]) / span));
  };
  const resize = () => {
    system.visible = !compact.matches;
    renderer.setPixelRatio(resolution());
    renderer.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight, false);
    effects.resize();
    uniforms.uPixel.value = renderer.getPixelRatio();
    dust.scale.x = network.scale.x = innerWidth / Math.max(1, innerHeight) * .95;
    camera.aspect = innerWidth / Math.max(1, innerHeight);
    camera.updateProjectionMatrix();
    const heroBounds = document.querySelector('.hero-system').getBoundingClientRect();
    const visibleWidth = 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * 12.5 * camera.aspect;
    sceneX = ((heroBounds.left + heroBounds.width / 2) / innerWidth - .5) * visibleWidth;
    const nextOffsets = anchors.map(element => element.getBoundingClientRect().top + scrollY);
    const layoutChanged = nextOffsets.some((value, i) => value !== offsets[i]);
    offsets = nextOffsets;
    if (layoutChanged && triggers.length) ScrollTrigger.refresh();
    readProgress();
    wake();
  };
  const draw = (delta, wallDelta = delta) => {
    target = triggers.length ? scrollState.value : target;
    progress += (target - progress) * Math.min(1, delta * 5);
    elapsed += wallDelta;
    uniforms.uTime.value = elapsed;
    const stage = Math.min(atmospheres.length - 2, Math.floor(progress));
    const blend = T.MathUtils.smoothstep(progress - stage, 0, 1);
    const from = atmospheres[stage], to = atmospheres[stage + 1];
    const mix = key => T.MathUtils.lerp(from[key], to[key], blend);
    const processWeight = Math.max(0, 1 - Math.abs(progress - 5));
    const cycle = Number(anchors[5].style.getPropertyValue('--lifecycle-progress')) || 0;
    uniforms.uActivity.value = mix('activity') * (1 + processWeight * Math.sin(cycle * Math.PI * 8) * .16);
    uniforms.uBrightness.value = mix('brightness');
    uniforms.uTint.value = mix('tint');
    host.style.setProperty('--space-glow', mix('glow').toFixed(4));
    host.style.setProperty('--space-x', mix('x').toFixed(2) + '%');
    host.style.setProperty('--space-y', mix('y').toFixed(2) + '%');
    host.dataset.atmosphere = anchors[Math.round(progress)].id;
    brush.globalCompositeOperation = 'destination-out'; brush.fillStyle = 'rgba(0,0,0,.055)'; brush.fillRect(0, 0, 128, 128);
    brush.globalCompositeOperation = 'source-over'; texture.needsUpdate = true;
    smoothPointer.x += (pointer.x - smoothPointer.x) * Math.min(1, delta * 4);
    smoothPointer.y += (pointer.y - smoothPointer.y) * Math.min(1, delta * 4);
    const disperse = Math.max(0, 1 - Math.abs(progress - 1));
    const organized = T.MathUtils.smoothstep(progress, 2, 4);
    const intelligence = T.MathUtils.smoothstep(progress, 4, 6);
    uniforms.uSpecialty.value = specialty;
    const ecosystem = Math.max(0, 1 - Math.abs(progress - 4));
    const experience = Math.max(0, 1 - Math.abs(progress - 3));
    const identity = 1 - T.MathUtils.smoothstep(progress, 0, 1);
    const quiet = 1 - T.MathUtils.smoothstep(progress, 5, 6);
    ink.opacity = .18 * quiet * (1 - experience * .65);
    pulseMaterial.opacity = .65 * quiet * (1 - experience * .65);
    if (system.visible) {
    records.forEach((record, i) => {
      record.object.position.copy(record.connected).lerp(record.scattered, disperse).lerp(record.organized, organized).lerp(record.intelligence, intelligence).lerp(record.identity, identity);
      const angle = i / count * Math.PI * 2;
      temporary.set(Math.cos(angle) * 2.5, Math.sin(angle) * 1.7, Math.sin(angle * 3) * .7);
      record.object.position.lerp(temporary, ecosystem);
      temporary.set(Math.sin(angle * 2) * 2.5, (i / count - .5) * 3.8, Math.cos(angle * 2));
      record.object.position.lerp(temporary, experience);
      record.object.rotation.set(disperse * Math.sin(i) * .5, disperse * Math.cos(i) * .5, 0);
    });
    wires.forEach(({ line, from, to }) => {
      const attribute = line.geometry.attributes.position;
      const a = records[from].object.position;
      const b = records[to].object.position;
      attribute.setXYZ(0, a.x, a.y, a.z);
      attribute.setXYZ(1, b.x, b.y, b.z);
      attribute.needsUpdate = true;
      line.frustumCulled = false;
    });
    lanes.forEach((pulse, lane) => {
      const step = (elapsed * .24 + lane * .23) % 1;
      // Seguir segmentos reales de cada canal; nunca atravesar el vacío.
      const segments = count / 4 - 1;
      const segment = Math.min(segments - 1, Math.floor(step * segments));
      const a = records[lane + segment * 4].object.position;
      const b = records[lane + (segment + 1) * 4].object.position;
      pulse.position.copy(a).lerp(b, step * segments - segment);
      pulse.visible = disperse < .7;
    });
    system.rotation.set(.32 + Math.sin(elapsed * .18) * .018 + smoothPointer.y * .07, -.35 + progress * .13 + smoothPointer.x * .12, -.18 + organized * .18);
    system.position.set(compact.matches ? 0 : sceneX, compact.matches ? -.7 : .1, -1.2);
    system.scale.setScalar(compact.matches ? .8 : 1.12);
    }
    camera.position.set(Math.sin(elapsed * .07) * .045 + smoothPointer.x * .07,
      .35 + Math.sin(elapsed * .055) * .035 + smoothPointer.y * .04, compact.matches ? 15 : 12.5);
    temporary.set(0, 0, 0);
    camera.lookAt(temporary);
    effects.render(scene, camera, wallDelta, elapsed);
  };
  const tick = now => {
    frame = 0;
    if (stopped || disposed || document.hidden || !inView || reduced.matches) return;
    if (now - last >= frameInterval) {
      const gap = now - last;
      if (last && gap > frameInterval * 1.8) slowFrames++;
      // En dispositivos lentos se reduce la cadencia, nunca la nitidez.
      if (slowFrames > 45) {
        frameInterval = 1000 / 20;
        slowFrames = 0;
      }
      const wallDelta = last ? Math.min(gap / 1000, 1) : 1 / 30;
      draw(Math.min(wallDelta, .1), wallDelta);
      last = now;
      host.classList.add('is-ready');
      host.style.setProperty('--scene-progress', (progress / (anchors.length - 1)).toFixed(4));
    }
    // Ambient motion continues while visible; visibility and preferences own the pause.
    frame = requestAnimationFrame(tick);
  };
  function wake() {
    if (disposed || stopped || document.hidden || !inView || reduced.matches) return;

    if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
  }
  const pause = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
  listen(document, 'click', event => {
    const tab = event.target.closest('.solution-tab,[data-capability]');
    if (!tab) return;
    const siblings = [...tab.parentElement.querySelectorAll('.solution-tab,[data-capability]')];
    specialty = Math.max(0, siblings.indexOf(tab));
    ink.color.copy(specialty % 2 ? blue : cyan);
  });
  listen(window, 'scroll', () => { readProgress(); wake(); }, { passive: true });
  listen(window, 'resize', resize, { passive: true });
  listen(document, 'pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches) return;
    effects.pointerMove(event);
    paint(event);
    pointer.x = event.clientX / innerWidth - .5;
    pointer.y = event.clientY / innerHeight - .5;
    wake();
  }, { passive: true });
  function paint(event) {
    const x = event.clientX / innerWidth, y = 1 - event.clientY / innerHeight;
    const velocity = Math.min(1, Math.hypot(x - previousX, y - previousY) * 20);
    const gradient = brush.createRadialGradient(x * 128, (1-y) * 128, 0, x * 128, (1-y) * 128, 12);
    gradient.addColorStop(0, `rgba(255,255,255,${.12 + velocity * .5})`); gradient.addColorStop(1, 'rgba(255,255,255,0)');
    brush.fillStyle = gradient; brush.fillRect(x * 128 - 12, (1-y) * 128 - 12, 24, 24);
    previousX = x; previousY = y;
  }
  listen(document, 'pointerdown', event => { effects.pointerDown(event); if (event.pointerType !== 'mouse') paint(event); }, { passive: true });
  listen(document.documentElement, 'pointerleave' , () => { effects.clearPointer(); pointer.x = 0; pointer.y = 0; wake(); });
  listen(window, 'blur', effects.clearPointer);
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); else wake(); });
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) wake(); else pause();
  }) : null;
  observer?.observe(document.querySelector('main'));
  const layoutObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  layoutObserver?.observe(document.querySelector('main'));
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    pause();
    controller.abort();
    triggers.forEach(trigger => trigger.kill());
    texture.dispose();
    observer?.disconnect();
    layoutObserver?.disconnect();
    const geometries = new Set();
    const materials = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(item => item.dispose());
    materials.forEach(item => item.dispose());
    effects.dispose();
    renderer.dispose();
    host.classList.remove('is-ready');
  };
  listen(canvas, 'webglcontextlost', event => { event.preventDefault(); dispose(); });
  // El cambio de preferencia se aplica de inmediato, sin recrear el contexto.
  listen(reduced, 'change', event => { if (event.matches) dispose(); });
  listen(window, 'pagehide', event => {
    if (event.persisted) { stopped = true; pause(); } else dispose();
  });
  listen(window, 'pageshow', () => { stopped = false; resize(); });
  resize();
}
