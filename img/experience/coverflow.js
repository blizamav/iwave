/* UX-022 — original circular coverflow. DOM navigation remains available without WebGL. */
const host = document.querySelector('.logo-showcase');
if (host) {
  const abort = new AbortController();
  const on = (el, name, fn, options = {}) => el.addEventListener(name, fn, {...options, signal: abort.signal});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const brands = [...document.querySelectorAll('.trust-brand')].map(a => ({name:a.querySelector('img').alt, src:a.querySelector('img').src, url:a.href}));
  const original = host.querySelector('.logo-viewport');
  const stage = document.createElement('div'); stage.className = 'coverflow-stage';
  original.before(stage); stage.append(original);
  const cards = brands.map((brand, i) => {
    const card = i ? original.cloneNode(true) : original;
    card.removeAttribute('data-logo-art'); card.classList.add('logo-card');
    card.href = brand.url; card.dataset.index = i;
    const img = card.querySelector('img'); img.src = brand.src; img.alt = brand.name;
    if (i) stage.append(card);
    return card;
  });
  let index = 0, paused = false, hover = false, focused = false, visible = false, remaining = 7500, started = 0, timer = 0, animation = null, motionPaused = false;
  const pause = host.querySelector('[data-logo-pause]');
  const label = host.querySelector('[data-logo-link]');
  const count = host.querySelector('output');
  const canPlay = () => visible && !document.hidden && !paused && !hover && !focused && !reduced.matches && !animation;
  const stop = () => { if (timer) { remaining = Math.max(0, remaining - (performance.now()-started)); clearTimeout(timer); timer = 0; } };
  const schedule = () => { stop(); if (canPlay()) { started = performance.now(); timer = setTimeout(() => { timer = 0; change(1); }, remaining); } };
  const position = (i, current) => { const n = (i-current+4)%4; return n === 3 ? -1 : n; };
  const notify = (phase, previous = index, progress = 0) => host.dispatchEvent(new CustomEvent('coverflowchange', {detail:{index, previous, phase, progress}}));
  const labelCards = (hiddenPosition = 2) => {
    cards.forEach((card, i) => {
      const pos = position(i,index); card.dataset.position = pos === 2 ? hiddenPosition : pos;
      card.inert = pos === 2;
      card.setAttribute('aria-hidden', String(pos === 2));
      card.setAttribute('role', pos === 0 ? 'link' : 'button');
      card.setAttribute('aria-label', pos === 0 ? 'Visitar sitio oficial de '+brands[i].name : (pos === -1 ? 'Marca anterior: ' : 'Marca siguiente: ')+brands[i].name);
      if (pos === 0) card.setAttribute('data-logo-art',''); else card.removeAttribute('data-logo-art');
    });
    label.textContent = brands[index].name; label.href = brands[index].url;
    count.value = `${index+1} / 4`; host.dataset.logo = index;
    host.dataset.brand = ['metlife','bancoestado','bancochile','scotiabank'][index];
  };
  const finishMotion = () => {
    if (animation) { animation.timeline.kill(); animation.cards.forEach(a => a.cancel()); }
    animation = null; host.dataset.transition = 'complete'; notify('complete'); schedule();
  };
  const syncMotion = () => {
    const hold = motionPaused || !visible || document.hidden;
    if (hold) host.dataset.motionPaused = 'true'; else delete host.dataset.motionPaused;
    if (animation) animation.timeline.paused(hold);
  };
  function change(direction) {
    // Short lock: all input paths share this policy and cannot overlap transitions.
    if (animation) return;
    stop(); remaining = 7500;
    const previous = index;
    const hidden = cards.find((_,i)=>position(i,index)===2);
    hidden.style.transition='none'; hidden.dataset.position=direction===1?2:-2;
    hidden.getBoundingClientRect(); hidden.style.removeProperty('transition');
    const frames = cards.map(card => { const css=getComputedStyle(card); return {transform:css.transform,opacity:css.opacity}; });
    index = (index+direction+4)%4;
    host.dataset.transition = 'running';
    motionPaused = false; delete host.dataset.motionPaused;
    labelCards(direction===1?-2:2);
    if (reduced.matches) { finishMotion(); return; }
    // One GSAP clock seeks persistent-card WAAPI tracks and both GPU marks.
    const tracks = cards.map((card,i) => {
      const css=getComputedStyle(card);
      const track=card.animate([frames[i],{transform:css.transform,opacity:css.opacity}],
        {duration:800,easing:'cubic-bezier(.22,.7,.2,1)',fill:'both'});
      track.pause(); track.currentTime=0; return track;
    });
    const state = {progress:0};
    const timeline = gsap.timeline({paused:true,onUpdate:()=>{
      tracks.forEach(track=>{track.currentTime=state.progress*800;});
      notify('progress',previous,state.progress);
    },onComplete:finishMotion});
    animation = {timeline,cards:tracks};
    notify('start',previous);
    timeline.to(state,{progress:1,duration:.8,ease:'none'});
    syncMotion();
  }
  cards.forEach((card,i) => on(card,'click',e => {
    const p = position(i,index);
    if (p !== 0 || animation) { e.preventDefault(); if (p === -1 || p === 1) change(p); }
  }));
  cards.forEach(card => on(card,'keydown',e => {
    // Anchors already activate with Enter; Space must activate without scrolling.
    if (e.key === ' ') { e.preventDefault(); if (!e.repeat) card.click(); }
  }));
  on(host.querySelector('[data-logo-prev]'),'click',()=>change(-1));
  on(host.querySelector('[data-logo-next]'),'click',()=>change(1));
  on(pause,'click',()=>{ paused=!paused; pause.textContent=paused?'Reanudar':'Pausar'; pause.setAttribute('aria-pressed',String(paused)); host.classList.toggle('is-paused',paused); if(animation || host.dataset.fragment) motionPaused=paused; syncMotion(); schedule(); });
  on(host,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();change(e.key==='ArrowRight'?1:-1);}});
  on(host,'pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;schedule();}});
  on(host,'pointerleave',()=>{hover=false;schedule();});
  on(host,'focusin',()=>{focused=true;schedule();});
  on(host,'focusout',e=>{focused=host.contains(e.relatedTarget);schedule();});
  let touch = null, swiped = false;
  on(stage,'pointerdown',e=>{swiped=false;if(e.pointerType!=='mouse')touch=[e.clientX,e.clientY];},{passive:true});
  on(stage,'pointerup',e=>{if(!touch)return;const dx=e.clientX-touch[0],dy=e.clientY-touch[1];touch=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3){swiped=true;change(dx<0?1:-1);}},{passive:true});
  on(stage,'click',e=>{if(swiped&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();swiped=false;}},{capture:true});
  on(stage,'pointercancel',()=>{touch=null;});
  on(document,'visibilitychange',()=>{host.classList.toggle('is-hidden',document.hidden);syncMotion();schedule();});
  on(reduced,'change',()=>{if(reduced.matches&&animation){animation.timeline.progress(1);finishMotion();}schedule();});
  const observer = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;host.classList.toggle('is-outside',!visible);syncMotion();schedule();},{threshold:.2}); observer.observe(host);
  on(window,'pagehide',e=>{stop();if(!e.persisted){abort.abort();observer.disconnect();if(animation){animation.timeline.kill();animation.cards.forEach(a=>a.cancel());}}});
  on(window,'pageshow',schedule);
  host.querySelectorAll('button').forEach(b=>{b.disabled=false;});
  host.classList.add('is-coverflow'); labelCards(); host.dataset.transition='complete';
}
