/* Menú progresivo: sin JavaScript, todos los enlaces permanecen visibles. */
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const mobileQuery = window.matchMedia('(max-width: 760px)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (menuToggle && siteNav) {
  const setMenu = (open, restoreFocus = false) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    siteNav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (window.gsap && !motionQuery.matches && open) {
      gsap.fromTo(siteNav.querySelectorAll('a'), { y: 36, rotateX: -15, opacity: .2 }, { y: 0, rotateX: 0, opacity: 1, stagger: .045, duration: .55, ease: 'power3.out', overwrite: true });
    }
    if (open) siteNav.querySelector('a')?.focus();
    if (restoreFocus) menuToggle.focus();
  };
  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      const destination = document.querySelector(link.hash);
      setMenu(false);
      if (destination) {
        destination.setAttribute('tabindex', '-1');
        destination.focus({ preventScroll: true });
      }
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && siteNav.classList.contains('is-open')) {
      const links = [...siteNav.querySelectorAll('a')];
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); menuToggle.focus(); }
      else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); menuToggle.focus(); }
      else if (document.activeElement === menuToggle) { event.preventDefault(); (event.shiftKey ? links.at(-1) : links[0]).focus(); }
    }
    if (event.key === 'Escape' && siteNav.classList.contains('is-open')) setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (siteNav.classList.contains('is-open') && !siteNav.contains(event.target) && !menuToggle.contains(event.target)) {
      const focusInside = siteNav.contains(document.activeElement);
      setMenu(false, focusInside);
    }
  });
  siteNav.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!siteNav.contains(document.activeElement) && document.activeElement !== menuToggle) setMenu(false);
    });
  });
  mobileQuery.addEventListener('change', () => setMenu(false));
  menuToggle.classList.add('is-enhanced');
  siteNav.classList.add('is-enhanced');
}

/* Aparición finita: ningún contenido se oculta mientras espera al observador. */
if ('IntersectionObserver' in window && !motionQuery.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (!motionQuery.matches) {
        entry.target.classList.add('is-entering');
        entry.target.addEventListener('animationend', () => {
          entry.target.classList.remove('is-entering');
        }, { once: true });
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  motionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      observer.disconnect();
      document.querySelectorAll('.is-entering').forEach((element) => element.classList.remove('is-entering'));
    }
  });
}

/* Navegación contextual: el desplazamiento sigue siendo nativo. */
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('.site-nav a')];
  const sections = [...document.querySelectorAll('main > section')];
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px' });
  sections.forEach(section => navObserver.observe(section));
}

/* EXP-002 — explorador comercial independiente del renderizador. */
const problemDescriptions = {
  manual: ['Tareas que avanzan, sin repetir el trabajo.', 'Automatización de validaciones y acciones para reducir digitación y reprocesos.'],
  dispersa: ['Una base común para trabajar con claridad.', 'Integramos archivos, registros y fuentes para disponer de información estructurada y confiable.'],
  sistemas: ['El siguiente paso comienza donde termina el anterior.', 'Conectamos sistemas y flujos de información para reducir transferencias manuales entre herramientas.'],
  visibilidad: ['De reportes aislados a decisiones informadas.', 'Organizamos indicadores y vistas de gestión para comprender lo que ocurre en tu operación.']
};
document.querySelectorAll('[data-problem]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-problem]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const [title, description] = problemDescriptions[button.dataset.problem];
    document.querySelector('.operation-result h3').textContent = title;
    document.querySelector('.operation-result p').textContent = description;
  });
});

/* Existing reactive surfaces; the cursor now lives in cursor.js. */
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
{
  let activeSurface = null;
  const resetSurface = () => {
    if (!activeSurface) return;
    ['--light-x', '--light-y', '--tilt-x', '--tilt-y'].forEach(name => activeSurface.style.removeProperty(name));
    activeSurface = null;
  };
  const clearSurface = () => {
    resetSurface();
  };
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || motionQuery.matches || event.pointerType !== 'mouse') return;
    const targetX = event.clientX;
    const targetY = event.clientY;
    const surface = event.target.closest('[data-reactive]');
    if (surface !== activeSurface) { resetSurface(); activeSurface = surface; }
    if (surface) {
      const box = surface.getBoundingClientRect();
      const px = (targetX - box.left) / box.width;
      const py = (targetY - box.top) / box.height;
      surface.style.setProperty('--light-x', `${px * 100}%`);
      surface.style.setProperty('--light-y', `${py * 100}%`);
      surface.style.setProperty('--tilt-x', `${(px - .5) * 4}deg`);
      surface.style.setProperty('--tilt-y', `${(.5 - py) * 4}deg`);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clearSurface);
  window.addEventListener('blur', clearSurface);
  window.addEventListener('pagehide', clearSurface);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearSurface(); });
  finePointer.addEventListener('change', clearSurface);
  motionQuery.addEventListener('change', clearSurface);
}

/* UI-003 — mejora progresiva: enlaces y cuatro vistas disponibles sin JS. */
const solutionsExplorer = document.querySelector('.solutions-explorer');
if (solutionsExplorer) {
  const tabs = [...solutionsExplorer.querySelectorAll('.solution-tab')];
  const panels = [...solutionsExplorer.querySelectorAll('.solution-panel')];
  const tablist = solutionsExplorer.querySelector('.solution-tabs');
  let selected = Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash));
  let inView = !('IntersectionObserver' in window);
  let demoTimer;
  const demonstrate = () => {
    clearTimeout(demoTimer);
    panels.forEach(panel => panel.classList.remove('is-demonstrating'));
    if (!inView || document.hidden || motionQuery.matches) return;
    // Lectura de layout solo al seleccionar o repetir la demostración.
    void panels[selected].offsetWidth;
    panels[selected].classList.add('is-demonstrating');
    demoTimer = setTimeout(demonstrate, 10000);
  };
  const selectSolution = (index, focus = false) => {
    selected = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus({ preventScroll: true });
    demonstrate();
  };
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Soluciones de productividad digital');
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      event.preventDefault();
      selectSolution(index);
    });
    tab.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        selectSolution(index);
        return;
      }
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectSolution(next, true);
    });
    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'solution-replay';
    replay.textContent = '↻ Repetir demostración';
    replay.addEventListener('click', demonstrate);
    panel.querySelector('.solution-demo').after(replay);
  });
  solutionsExplorer.classList.add('is-enhanced');
  selectSolution(selected);
  if ('IntersectionObserver' in window) {
    const solutionObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      demonstrate();
    }, { threshold: .15 });
    solutionObserver.observe(solutionsExplorer.querySelector('.solution-stage'));
  }
  document.addEventListener('visibilitychange', demonstrate);
  motionQuery.addEventListener('change', demonstrate);
  window.addEventListener('pagehide', () => clearTimeout(demoTimer));
  window.addEventListener('pageshow', demonstrate);
}


/* UI-005 — pause decorative CSS motion outside the Hero and in hidden tabs. */
const hologramStage = document.querySelector('.hologram-stage');
if (hologramStage) {
  let hologramVisible = true;
  const syncHologram = () => hologramStage.classList.toggle('is-hologram-paused', !hologramVisible || document.hidden || motionQuery.matches);
  if ('IntersectionObserver' in window) {
    const hologramObserver = new IntersectionObserver(entries => {
      hologramVisible = entries[0].isIntersecting;
      syncHologram();
    });
    hologramObserver.observe(hologramStage);
  }
  document.addEventListener('visibilitychange', syncHologram);
  window.addEventListener('pagehide', () => hologramStage.classList.add('is-hologram-paused'));
  window.addEventListener('pageshow', syncHologram);
  motionQuery.addEventListener('change', syncHologram);
  syncHologram();
}

/* Pause decorative CSS motion alongside the shared renderer. */
document.addEventListener('visibilitychange', () => {
  document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
});
