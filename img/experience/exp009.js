/* EXP-009. Implementación original; Three r170 y GSAP locales existentes.
 * Un renderer, cámaras por viewport DOM y buffers persistentes. */
export function createEffects(T, renderer, canvas) {
  const abort = new AbortController();
  const on = (el, event, fn, options = {}) => el.addEventListener(event, fn, { ...options, signal: abort.signal });
  const mobile = matchMedia('(max-width: 820px)');
  const slots = [];
  const viewport = new T.Vector2();
  const textures = new Set();
  const timelines = new Set();
  let alive = true;
  const originalParent = canvas.parentElement;
  document.body.append(canvas);
  canvas.classList.add('exp009-layer');
  canvas.setAttribute('aria-hidden', 'true');
  const target = new T.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const screen = new T.Scene();
  const screenCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const screenMaterial = new T.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: { uMap: { value: target.texture } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}',
    // Keep the original environment behind reading, even though this canvas is above DOM.
    fragmentShader: `uniform sampler2D uMap; varying vec2 vUv;
      void main(){vec4 c=texture2D(uMap,vUv);gl_FragColor=vec4(c.rgb,c.a*mix(.38,.78,smoothstep(.28,.92,vUv.x)));}`
  });
  screen.add(new T.Mesh(new T.PlaneGeometry(2, 2), screenMaterial));
  const addSlot = element => {
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, 1, .1, 60);
    camera.position.z = 11;
    const slot = { element, scene, camera, visible: false, rect: null };
    slots.push(slot);
    return slot;
  };
  const seed = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const tween = options => { const t = gsap.timeline({ paused: true, ...options }); timelines.add(t); return t; };
  const advance = (timeline, dt) => { if (timeline) timeline.totalTime(timeline.totalTime() + dt); };

  // 01 — textured physical fragments, each with a home, UV cell and 3-axis rotation.
  const logoHost = document.querySelector('.logo-showcase');
  const logoStage = logoHost.querySelector('.coverflow-stage');
  const logoSlot = addSlot(logoStage || logoHost.querySelector('.logo-viewport'));
  const brands = [...document.querySelectorAll('.trust-brand')].map(a => ({
    name: a.querySelector('img').alt, url: a.href, src: a.querySelector('img').src
  }));
  const logoMaterials = [], logoMeshes = [];
  const logoSizes = [];
  let selectedLogo = 0, outgoingLogo = 0;
  const clearLogo = () => {
    logoMeshes.forEach((mesh,i) => { mesh.visible=false; logoMaterials[i].uniforms.uOpacity.value=0; });
    logoHost.querySelectorAll('[data-fragment-active]').forEach(card=>card.removeAttribute('data-fragment-active'));
    delete logoHost.dataset.fragment;
  };
  on(logoHost, 'coverflowchange', ({detail}) => {
    selectedLogo = detail.index;
    if (detail.phase === 'complete') {
      clearLogo();
      // Remove the last rasterized fragments before revealing the original DOM assets,
      // even if visibility/reduced-motion has suspended the shared render loop.
      const r=logoSlot.rect;
      if(r && viewport.x && r.bottom>0 && r.top<viewport.y) {
        renderer.setRenderTarget(null);renderer.setScissorTest(true);
        renderer.setScissor(Math.max(0,r.left),Math.max(0,viewport.y-r.bottom),
          Math.max(0,Math.min(viewport.x,r.right)-Math.max(0,r.left)),
          Math.max(0,Math.min(viewport.y,r.bottom)-Math.max(0,r.top)));
        renderer.clear(true,true,false);renderer.setScissorTest(false);
      }
      layoutDirty=true; return;
    }
    if (detail.phase === 'start') {
      clearLogo(); outgoingLogo = detail.previous;
      // A not-yet-warm GPU uses the working DOM transition; never wait for textures.
      if (!logoHost.classList.contains('is-webgl')) return;
      logoHost.dataset.fragment='running';
      [outgoingLogo,selectedLogo].forEach(i=>logoHost.querySelector(`.logo-card[data-index="${i}"]`)?.setAttribute('data-fragment-active',''));
      layoutDirty=true;
    }
    if (!logoHost.dataset.fragment) return;
    const p = detail.progress;
    // Shared clock: outgoing disintegrates while incoming reassembles in flight.
    logoMaterials[outgoingLogo].uniforms.uProgress.value = .65 * Math.sin(Math.PI*p);
    logoMaterials[outgoingLogo].uniforms.uOpacity.value = 1;
    logoMaterials[selectedLogo].uniforms.uProgress.value = .48 * (1-p);
    logoMaterials[selectedLogo].uniforms.uOpacity.value = 1;
  });
  const logoVertex = `attribute vec3 aHome; attribute vec3 aOffset; attribute vec3 aRotation;
    attribute vec2 aUvOffset; uniform float uProgress; uniform vec2 uCell;
    uniform vec2 uHalfSize; uniform vec2 uBounds; uniform float uRadius; uniform float uCameraZ;
    uniform mat4 uCardMatrix; uniform vec2 uCardSize; uniform vec4 uStage;
    uniform vec2 uViewport; uniform float uPerspective; uniform float uCardOpacity;
    varying vec2 vUv; varying float vAlpha;
    mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
    mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
    mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
    void main(){float p=smoothstep(0.,1.,uProgress);vec3 r=aRotation*p;
      vec3 transformedPosition=rz(r.z)*ry(r.y)*rx(r.x)*position;
      transformedPosition+=aHome+aOffset*p;
      // Conservative envelope includes every rotated cell, offset and perspective Z.
      // Scale the whole fragmented mark uniformly: no clipped fragments at the plate edge.
      float reach=uRadius*min(2.,14.*p);
      vec2 envelope=uHalfSize+vec2(1.25,.75)*p+vec2(reach);
      float depth=1.-(p+reach)/uCameraZ;
      vec2 fit=uBounds*depth/envelope;
      transformedPosition.xy*=min(1.,min(fit.x,fit.y));
      vUv=aUvOffset+uv*uCell; vAlpha=(1.-smoothstep(.4,1.,p))*uCardOpacity;
      vec4 local=projectionMatrix*modelViewMatrix*vec4(transformedPosition,1.);
      vec2 card=local.xy/local.w*uCardSize*.5;
      vec4 moved=uCardMatrix*vec4(card.x,-card.y,0.,1.);
      vec2 screen=uStage.xy+uStage.zw*.5+(moved.xy+uCardSize*.5)/(1.-moved.z/uPerspective);
      gl_Position=vec4(screen.x/uViewport.x*2.-1.,1.-screen.y/uViewport.y*2.,0.,1.);}`;
  const logoFragment = `uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv; varying float vAlpha;
    void main(){vec4 c=texture2D(uMap,vUv);if(c.a<.015)discard;gl_FragColor=vec4(c.rgb,c.a*vAlpha*uOpacity);
    #include <colorspace_fragment>
    }`;
  const ready = Promise.all(brands.map(async (brand, index) => {
    const texture = await new T.TextureLoader().loadAsync(brand.src);
    if (!alive) { texture.dispose(); return; }
    textures.add(texture); texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const aspect = texture.image.width / texture.image.height;
    const width = Math.min(6.4, 2.1 * aspect), height = width / aspect;
    logoSizes[index] = { width, height };
    const cols = mobile.matches ? 16 : 24, rows = Math.max(8, Math.round(cols / aspect));
    const n = cols * rows;
    const geometry = new T.PlaneGeometry(width / cols, height / rows);
    const homes = new Float32Array(n * 3), offsets = new Float32Array(n * 3);
    const rotations = new Float32Array(n * 3), uvs = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const x = i % cols, y = Math.floor(i / cols);
      homes.set([(x + .5) / cols * width - width / 2, (y + .5) / rows * height - height / 2, 0], i * 3);
      offsets.set([(seed(i + 3) - .5) * 2.5, (seed(i + 17) - .5) * 1.5, (seed(i + 29) - .5) * 2], i * 3);
      rotations.set([(seed(i + 41) - .5) * 10, (seed(i + 53) - .5) * 10, (seed(i + 67) - .5) * 8], i * 3);
      uvs.set([x / cols, y / rows], i * 2);
    }
    geometry.setAttribute('aHome', new T.InstancedBufferAttribute(homes, 3));
    geometry.setAttribute('aOffset', new T.InstancedBufferAttribute(offsets, 3));
    geometry.setAttribute('aRotation', new T.InstancedBufferAttribute(rotations, 3));
    geometry.setAttribute('aUvOffset', new T.InstancedBufferAttribute(uvs, 2));
    const material = new T.ShaderMaterial({ uniforms: { uMap: { value: texture }, uProgress: { value: 0 },
      uCardMatrix: { value: new T.Matrix4() }, uCardSize: { value: new T.Vector2() },
      uStage: { value: new T.Vector4() }, uViewport: { value: viewport },
      uPerspective: { value: 1100 }, uCardOpacity: { value: 1 },
      uHalfSize: { value: new T.Vector2(width / 2, height / 2) },
      uBounds: { value: new T.Vector2(1, 1) }, uRadius: { value: Math.hypot(width / cols, height / rows) / 2 },
      uCameraZ: { value: 8.5 }, uOpacity: { value: 1 }, uCell: { value: new T.Vector2(1 / cols, 1 / rows) } },
      vertexShader: logoVertex, fragmentShader: logoFragment, transparent: true, side: T.DoubleSide, depthWrite: false });
    const mesh = new T.InstancedMesh(geometry, material, n);
    const identity = new T.Matrix4();
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, identity);
    mesh.frustumCulled = false; mesh.visible = index === 0;
    logoSlot.scene.add(mesh); logoMeshes[index] = mesh; logoMaterials[index] = material;
  })).then(() => {
    if (!alive) return;
    logoMeshes.forEach(mesh => { mesh.visible = true; });
    renderer.compile(logoSlot.scene, logoSlot.camera);
    textures.forEach(texture => renderer.initTexture(texture));
    logoMeshes.forEach((mesh, index) => { mesh.visible = index === selectedLogo; });
    logoHost.classList.add('is-webgl');
    layoutDirty = true;
    logoMaterials.forEach(material => { material.uniforms.uOpacity.value = 0; });
  }).catch(() => { logoHost.dataset.textureError = 'true'; });
  // 03 — five different systems; persistent CPU Bézier buffers + GLSL breathing/noise.
  const morphHost = document.querySelector('.morph-system');
  const morphSlot = addSlot(morphHost.querySelector('.morph-viewport'));
  const keys = ['fragmented', 'integrated', 'automated', 'analytics', 'platforms', 'productivity', 'control'];
  const names = ['Datos fragmentados', 'Integración', 'Automatización', 'Business Intelligence', 'Plataformas', 'Productividad', 'Control operativo'];
  const n = mobile.matches ? 480 : 1200;
  const shapes = Object.fromEntries(keys.map(key => [key, new Float32Array(n * 3)]));
  const nodes = [[-2.7,1.2,0],[-2.7,-1.2,0],[0,0,.7],[2.6,1.2,-.3],[2.6,-1.2,.2]];
  for (let i = 0; i < n; i++) {
    const u = (i % 100) / 99, a = i * 2.399963;
    shapes.fragmented.set([(seed(i) - .5) * 6.6, (seed(i + 12) - .5) * 3.7, (seed(i + 51) - .5) * 3], i * 3);
    const branch = i % 4, node = nodes[branch < 2 ? branch : branch + 1];
    shapes.integrated.set([node[0] * u, node[1] * u + Math.sin(a) * .055, .7 * (1 - u) + node[2] * u + Math.cos(a) * .055], i * 3);
    const lane = i % 3;
    shapes.automated.set([-3.1 + u * 6.2, Math.sin(u * Math.PI * 4 + lane * .8) * .38 + (lane - 1) * .85, Math.cos(u * Math.PI * 4 + lane) * .5], i * 3);
    shapes.productivity.set([-3 + u * 6, (lane - 1) * (.15 + (1-u)*.8), Math.sin(a)*.08], i * 3);
    const ring = i % 3, theta = u * Math.PI * 2;
    shapes.control.set([Math.cos(theta)*(1.0+ring*.55),Math.sin(theta)*(1.0+ring*.55),Math.sin(theta*3+ring)*.25],i*3);
    const bar = i % 5, h = [.8,1.7,1.2,2.5,3.1][bar];
    shapes.analytics.set([(bar - 2) * 1.15 + Math.cos(a) * .27, -1.65 + u * h, Math.sin(a) * .35], i * 3);
    const module = i % 6, side = Math.floor(i / 6) % 4, w = .75;
    const x = side === 0 ? -w : side === 1 ? w : (u * 2 - 1) * w;
    const y = side === 2 ? -.55 : side === 3 ? .55 : (u * 2 - 1) * .55;
    shapes.platforms.set([(module % 3 - 1) * 2.1 + x, (Math.floor(module / 3) - .5) * 1.8 + y, Math.sin(a) * .25], i * 3);
  }
  const sourcePositions = shapes.fragmented.slice(), targetPositions = shapes.fragmented.slice();
  const currentPositions = shapes.fragmented.slice(), swarmPositions = new Float32Array(n * 3);
  const morphGeometry = new T.BufferGeometry();
  morphGeometry.setAttribute('position', new T.BufferAttribute(currentPositions, 3).setUsage(T.DynamicDrawUsage));
  const morphUniforms = { uTime: { value: 0 }, uEnergy: { value: 0 }, uColor: { value: new T.Color(0x35d6ff) }, uPixel: { value: renderer.getPixelRatio() } };
  const morphMaterial = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: morphUniforms,
    vertexShader: `uniform float uTime;uniform float uEnergy;uniform float uPixel;varying float vDepth;
      float noise(vec3 p){return sin(p.x*1.7+sin(p.z*1.3))*sin(p.y*1.4+cos(p.x));}
      void main(){vec3 p=position;float breathe=1.+sin(uTime*.8)*.018;p*=breathe;
        p+=vec3(noise(p+uTime*.3),noise(p.zxy-uTime*.2),noise(p.yzx+uTime*.2))*(.025+uEnergy*.09);
        vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=clamp((mv.z+13.)/6.,.25,1.);
        gl_PointSize=clamp(30.*uPixel/-mv.z,1.5,6.*uPixel);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 uColor;varying float vDepth;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
      float halo=1.-smoothstep(.05,.5,d);gl_FragColor=vec4(mix(uColor,vec3(.85,.97,1.),halo*.6),halo*(.55+.45*vDepth));}` });
  const particles = new T.Points(morphGeometry, morphMaterial); particles.frustumCulled = false; morphSlot.scene.add(particles);
  let morphIndex = 0, morphHold = 0, manualHold = 0, morphTimeline = null, morphPaused = false;
  const morphPause = morphHost.querySelector('[data-morph-pause]'); morphPause.disabled = false;
  on(morphPause, 'click', () => {
    morphPaused = !morphPaused; morphPause.setAttribute('aria-pressed', String(morphPaused));
    morphPause.textContent = morphPaused ? 'Reanudar ciclo' : 'Pausar ciclo';
  });
  const morphProgress = { value: 1 };
  const morphButtons = [...morphHost.querySelectorAll('[data-morph]')];
  const selectMorph = (index, manual = false) => {
    if (manual) manualHold = 12;
    if (index === morphIndex) return;
    morphIndex = index; morphHold = 0;
    if (morphTimeline) { timelines.delete(morphTimeline); morphTimeline.kill(); }
    sourcePositions.set(currentPositions); targetPositions.set(shapes[keys[index]]);
    for (let i = 0; i < n; i++) {
      const p = i * 3, angle = i * 2.399963;
      swarmPositions[p] = (sourcePositions[p] + targetPositions[p]) * .5 + Math.cos(angle) * 1.8;
      swarmPositions[p + 1] = (sourcePositions[p + 1] + targetPositions[p + 1]) * .5 + Math.sin(angle) * 1.5;
      swarmPositions[p + 2] = (seed(i + 64) - .5) * 5;
    }
    morphProgress.value = 0;
    morphTimeline = tween().to(morphProgress, { value: 1, duration: 2.6, ease: 'power2.inOut' });
    morphButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    morphHost.querySelector('[data-morph-name]').textContent = names[index];
    morphHost.dataset.shape = keys[index];
  };
  morphButtons.forEach((button, i) => { button.disabled = false; on(button, 'click', () => selectMorph(i, true)); });
  morphHost.classList.add('is-webgl'); morphHost.dataset.shape = keys[0];

  // 04 — rotating integration toruses, fixed quadratic arcs and moving shader pulses.
  const energy = new T.Group(); energy.position.z = -1.1; morphSlot.scene.add(energy);
  const energyMaterials = [], rings = [];
  const energyMaterial = (color, opacity = .65) => {
    const material = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 }, uEnergy: { value: .4 }, uColor: { value: new T.Color(color) }, uPhase: { value: 0 }, uOpacity: { value: opacity } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float uTime;uniform float uEnergy;uniform float uPhase;uniform float uOpacity;uniform vec3 uColor;varying vec2 vUv;
        void main(){float travel=fract(vUv.x-uTime*.2+uPhase);float packet=exp(-pow((travel-.5)*19.,2.));
          float pulse=.5+.5*sin(uTime*2.+uPhase*6.283);float glow=.14+packet*.8+uEnergy*.17*pulse;
          float rim=.45+.55*pow(abs(cos(vUv.y*6.283)),4.);gl_FragColor=vec4(uColor*(.5+glow)*rim,glow*uOpacity);}` });
    energyMaterials.push(material); return material;
  };
  for (let i = 0; i < 3; i++) {
    const ring = new T.Mesh(new T.TorusGeometry(.66 + i * .23, .018 + i * .004, 8, 96), energyMaterial([0x35d6ff,0x246bfd,0x35d6ff][i]));
    ring.material.uniforms.uPhase.value = i / 3; energy.add(ring); rings.push(ring);
  }
  const coreMaterial = new T.MeshBasicMaterial({ color: 0x35d6ff, wireframe: true, transparent: true, opacity: .55 });
  const core = new T.Mesh(new T.IcosahedronGeometry(.28, 1), coreMaterial); energy.add(core);
  const arcCurves = [], packets = [];
  const packetGeometry = new T.SphereGeometry(.045, 8, 6), packetMaterial = new T.MeshBasicMaterial({ color: 0xc6f5ff });
  nodes.filter((_, i) => i !== 2).forEach((node, i) => {
    const end = new T.Vector3(...node);
    const curve = new T.QuadraticBezierCurve3(new T.Vector3(), new T.Vector3(end.x * .45, end.y + .7, .9), end);
    const geometry = new T.TubeGeometry(curve, 48, .018, 6, false);
    const material = energyMaterial(0x35d6ff, .8); material.uniforms.uPhase.value = i * .25;
    energy.add(new T.Mesh(geometry, material)); arcCurves.push(curve);
    const packet = new T.Mesh(packetGeometry, packetMaterial); energy.add(packet); packets.push(packet);
    const module = new T.Mesh(new T.BoxGeometry(.28, .22, .22), new T.MeshBasicMaterial({ color: 0x35d6ff, wireframe: true, transparent: true, opacity: .65 }));
    module.position.copy(end); energy.add(module);
  });

  function resize() {
    renderer.getSize(viewport);
    const size = renderer.getDrawingBufferSize(new T.Vector2()); target.setSize(size.x, size.y);

    morphUniforms.uPixel.value = renderer.getPixelRatio();
    layoutDirty = true;
    layout();
  }
  let layoutDirty = true;
  function layout() {
    if (!layoutDirty) return;
    layoutDirty = false;
    slots.forEach(slot => {
      const r = slot.element.getBoundingClientRect(); slot.rect = r;
      slot.visible = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      slot.camera.aspect = r.width / Math.max(1, r.height);
      // Frame all geometry on compact viewports without distorting logo/particles.
      slot.camera.position.z = Math.max(slot === logoSlot ? 8.5 : 5.8, (slot === logoSlot ? 3.8 : 3.9) / Math.tan(Math.PI / 9) / slot.camera.aspect);
      slot.camera.updateProjectionMatrix();
      if (slot === logoSlot && logoSizes[selectedLogo]) {
        // These CSS lengths are fixed for every brand. Read only after layout changes.
        const card = logoHost.querySelector('.logo-card') || slot.element;
        const plateWidth = card.clientWidth, plateHeight = card.clientHeight;
        slot.camera.aspect=plateWidth/plateHeight; slot.camera.updateProjectionMatrix();
        const safeWidth = plateWidth - 48, safeHeight = plateHeight - 48;
        slot.clipRect = { left: r.left + (r.width - plateWidth) / 2 + 8, right: r.left + (r.width + plateWidth) / 2 - 8,
          top: r.top + (r.height - plateHeight) / 2 + 8, bottom: r.top + (r.height + plateHeight) / 2 - 8 };
        const px = plateHeight / (2 * slot.camera.position.z * Math.tan(Math.PI / 9));
        logoSizes.forEach((size, index) => {
          const scale = Math.min(safeWidth / (size.width * px), safeHeight / (size.height * px));
          logoMeshes[index].scale.setScalar(scale);
          logoMaterials[index].uniforms.uBounds.value.set(safeWidth / (2 * px * scale), safeHeight / (2 * px * scale));
          logoMaterials[index].uniforms.uCameraZ.value = slot.camera.position.z / scale;
        });
        const size = logoSizes[selectedLogo], scale = logoMeshes[selectedLogo].scale.x;
        logoHost.style.setProperty('--logo-width', `${size.width * px * scale}px`);
        logoHost.style.setProperty('--logo-height', `${size.height * px * scale}px`);
      }
    });
  }
  const invalidateLayout = () => { layoutDirty = true; };
  on(window, 'scroll', invalidateLayout, { passive: true });
  const observer = new ResizeObserver(invalidateLayout); slots.forEach(s => observer.observe(s.element));
  function update(dt, time) {

    // Logo progress is supplied by the Coverflow controller, never a second timeline.
    if (!morphSlot.visible) return;
    if (!morphPaused) advance(morphTimeline, Math.min(dt, .1));
    manualHold = Math.max(0, manualHold - dt);
    const t = morphProgress.value, s = 1 - t;
    if (t < 1) {
      for (let j = 0; j < currentPositions.length; j++) currentPositions[j] = s*s*sourcePositions[j] + 2*s*t*swarmPositions[j] + t*t*targetPositions[j];
      morphGeometry.attributes.position.needsUpdate = true;
    } else {
      currentPositions.set(targetPositions); morphGeometry.attributes.position.needsUpdate = true;
      if (!morphPaused) morphHold += dt;
      if (!morphPaused && morphHold > 4.5 && !manualHold) selectMorph((morphIndex + 1) % keys.length);
    }
    morphHost.dataset.progress = t.toFixed(3);
    morphUniforms.uTime.value = time; morphUniforms.uEnergy.value = Math.sin(t * Math.PI);
    particles.rotation.y = Math.sin(time * .17) * .12;
    rings.forEach((ring, i) => { ring.rotation.set(time * (.18 + i * .06) + i, time * (.12 + i * .04), i * .7); });
    const arrival = Math.pow(Math.max(0, Math.cos(time * 1.4)), 10);
    energyMaterials.forEach(m => { m.uniforms.uTime.value = time; m.uniforms.uEnergy.value = .4 + arrival + Math.sin(t * Math.PI); });
    core.rotation.y = time * .4; core.scale.setScalar(1 + arrival * .28); coreMaterial.opacity = .4 + arrival * .4;
    packets.forEach((packet, i) => arcCurves[i].getPoint((time * .22 + i * .25) % 1, packet.position));
  }
  function render(scene, camera, dt, time) {
    layout();
    update(dt, time);
    layout();
    renderer.setScissorTest(false); renderer.setViewport(0, 0, viewport.x, viewport.y);
    renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.clear(); renderer.render(screen, screenCamera);
    renderer.autoClear = false;
    slots.forEach(slot => {
      if (!slot.visible || !slot.rect) return;
      const r = slot.rect;
      if (slot === logoSlot) {
        if (logoHost.dataset.fragment !== 'running') return;
        renderer.setViewport(0,0,viewport.x,viewport.y);
        // Match each persistent card's actual CSS 3D matrix, with the same stage perspective.
        // Local vertex envelope retains FIX-021; stage + moving plate scissor is independent.
        [outgoingLogo,selectedLogo].sort((a,b)=>a===selectedLogo?1:b===selectedLogo?-1:0).forEach(i=>{
          const card=logoHost.querySelector(`.logo-card[data-index="${i}"]`);
          if (!card) return;
          const bounds=card.getBoundingClientRect(), css=getComputedStyle(card);
          const c={left:Math.max(r.left,bounds.left+8,0),right:Math.min(r.right,bounds.right-8,viewport.x),
            top:Math.max(r.top,bounds.top+8,0),bottom:Math.min(r.bottom,bounds.bottom-8,viewport.y)};
          if(c.right<=c.left || c.bottom<=c.top)return;
          const u=logoMaterials[i].uniforms;
          const m=new DOMMatrixReadOnly(css.transform);
          u.uCardMatrix.value.fromArray(m.toFloat32Array());
          u.uCardSize.value.set(card.clientWidth,card.clientHeight);
          u.uStage.value.set(r.left,r.top,r.width,r.height);u.uCardOpacity.value=Number(css.opacity);
          logoMeshes.forEach((mesh,j)=>{mesh.visible=j===i;});
          renderer.setScissor(c.left,viewport.y-c.bottom,c.right-c.left,c.bottom-c.top);
          renderer.setScissorTest(true);
          renderer.render(slot.scene,slot.camera);
        });
        logoMeshes.forEach(mesh=>{mesh.visible=false;});
        return;
      }
      renderer.setViewport(r.left, viewport.y - r.bottom, r.width, r.height);
      renderer.setScissor(Math.max(0, r.left), Math.max(0, viewport.y - r.bottom), Math.min(viewport.x, r.right) - Math.max(0, r.left), Math.min(viewport.y, r.bottom) - Math.max(0, r.top));
      renderer.setScissorTest(true); renderer.clear(true, true, false);
      renderer.render(slot.scene, slot.camera);
    });
    renderer.setScissorTest(false); renderer.setViewport(0, 0, viewport.x, viewport.y);

    renderer.autoClear = true;
    document.body.classList.add('exp009-ready');
  }
  function dispose() {
    alive = false; abort.abort(); observer.disconnect(); timelines.forEach(t => t.kill()); textures.forEach(t => t.dispose());
    const geometries = new Set(), materials = new Set();
    [screen, ...slots.map(s => s.scene)].forEach(s => s.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); }));
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); target.dispose();
    logoHost.classList.remove('is-webgl'); morphHost.classList.remove('is-webgl');
    delete logoHost.dataset.fragment; morphButtons.forEach(b => { b.disabled = true; }); morphPause.disabled = true;
    document.body.classList.remove('exp009-ready'); canvas.classList.remove('exp009-layer'); originalParent.append(canvas);
  }
  void ready;
  return { render, resize, dispose };
}
