/* EXP-003: interaction independent of content, navigation and the shared WebGL scene. */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const theatre = document.querySelector('[data-transformation]');
if (theatre) {
  const buttons = [...theatre.querySelectorAll('[data-transform-state]')];
  const play = theatre.querySelector('[data-transform-play]');
  const status = theatre.querySelector('[data-transform-status]');
  const fileNames = [...theatre.querySelectorAll('.transform-file strong')];
  const originalNames = fileNames.map(file => file.textContent);
  let timers = [];
  let started = false;
  const cancel = () => { timers.forEach(clearTimeout); timers = []; theatre.classList.remove('is-playing'); play.disabled = false; };
  const setState = state => {
    theatre.dataset.state = state;
    fileNames.forEach((file, i) => { file.textContent = state === 'after' && i === 5 ? 'Versiones unificadas' : originalNames[i]; });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.transformState === state)));
    status.textContent = state === 'before' ? 'Información dispersa' : state === 'connecting' ? 'Integrando fuentes y activando flujos' : 'Operación conectada';
  };
  const run = () => {
    cancel();
    if (reduced.matches) { setState('after'); return; }
    setState('before'); theatre.classList.add('is-playing'); play.disabled = true;
    timers.push(setTimeout(() => setState('connecting'), 1200));
    timers.push(setTimeout(() => setState('after'), 2600));
    timers.push(setTimeout(cancel, 3900));
  };
  buttons.forEach(button => { button.disabled = false; button.addEventListener('click', () => { started = true; cancel(); setState(button.dataset.transformState); }); });
  play.disabled = false;
  play.addEventListener('click', () => { started = true; run(); });
  if (!reduced.matches) setState('before');
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (visible && !started && !document.hidden) { started = true; run(); }
    if (!visible && timers.length) { cancel(); setState('after'); }
  }, { threshold: .35 }).observe(theatre);
  const settle = () => { cancel(); setState('after'); };
  reduced.addEventListener('change', settle);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  addEventListener('pagehide', settle);
}
const choices = [...document.querySelectorAll('[data-capability]')];
if (choices.length) {
  const panels = choices.map(choice => document.getElementById(`capability-${choice.dataset.capability}`));
  const select = index => choices.forEach((choice, i) => {
    choice.setAttribute('aria-current', String(i === index));
    if (i === index) choice.parentElement.dataset.active = choice.dataset.capability;
    choice.setAttribute('aria-controls', panels[i].id);
    panels[i].hidden = i !== index;
    panels[i].classList.toggle('is-selected', i === index);
  });
  choices.forEach((choice, index) => {
    choice.addEventListener('click', event => { event.preventDefault(); select(index); });
    choice.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % choices.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + choices.length - 1) % choices.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = choices.length - 1;
      if (event.key === ' ') { event.preventDefault(); select(index); }
      if (next !== undefined) { event.preventDefault(); select(next); choices[next].focus(); }
    });
  });
  select(Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash)));
}
