/* EXP-009 — one controllable timeline, independent of WebGL availability. */
const host = document.querySelector('#proceso');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (host && window.gsap) {
  const steps = [...host.querySelectorAll('.timeline-step')];
  const controls = host.querySelector('.lifecycle-controls');
  const track = host.querySelector('.lifecycle-track');
  const buttons = steps.map(step => step.querySelector('button'));
  const state = { value: 0 };
  let manualUntil = 0, visible = false, userPaused = false, destroyed = false;
  const render = () => {
    const p = state.value, index = Math.min(3, Math.floor(p * 4));
    host.style.setProperty('--lifecycle-progress', String(p)); host.dataset.progress = p.toFixed(3);
    controls.querySelector('output').value = `${Math.round(p * 100)}%`;
    track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    buttons.forEach((button, i) => {
      steps[i].classList.toggle('is-active', i === index); steps[i].classList.toggle('is-complete', i < index || p === 1);
      button.setAttribute('aria-pressed', String(i === index));
    });
  };
  const timeline = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .6, onUpdate: render });
  for (let i = 1; i <= 4; i++) timeline.to(state, { value: i / 4, duration: 1.8, ease: 'none' }).to({}, { duration: .65 });
  timeline.to(state, { value: 0, duration: 1, ease: 'power2.inOut' });
  const resume = host.querySelector('[data-lifecycle-resume]'); resume.disabled = false;
  const sync = () => {
    if (destroyed) return;
    const paused = reduced.matches || document.hidden || !visible || userPaused || performance.now() < manualUntil;
    timeline.paused(paused);
    resume.textContent = reduced.matches ? 'Movimiento reducido' : userPaused || performance.now() < manualUntil ? 'Reanudar ciclo' : 'Pausar ciclo';
    resume.setAttribute('aria-pressed', String(userPaused || performance.now() < manualUntil));
    resume.disabled = reduced.matches;
  };
  let timer;
  buttons.forEach((button, i) => {
    button.disabled = false;
    button.addEventListener('click', () => {
      timeline.pause(); timeline.time(i * 2.45, true); state.value = i / 4; manualUntil = performance.now() + 12000; render(); sync();
      clearTimeout(timer); timer = setTimeout(sync, 12050);
    });
  });
  resume.addEventListener('click', () => {
    if (manualUntil > performance.now() || userPaused) { manualUntil = 0; userPaused = false; clearTimeout(timer); }
    else userPaused = true;
    sync();
  });
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); observer.observe(host);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { if (reduced.matches) { timeline.pause(); state.value = 1; render(); } sync(); });
  window.addEventListener('pagehide', e => { timeline.pause(); if (!e.persisted) { destroyed = true; observer.disconnect(); timeline.kill(); clearTimeout(timer); } });
  window.addEventListener('pageshow', sync);
  if (reduced.matches) state.value = 1;
  render(); sync();
}
