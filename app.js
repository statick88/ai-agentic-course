(function () {
  const navigation = window.CourseNavigation;
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!navigation || !slides.length) return;

  const ids = slides.map((slide) => slide.id);
  const counter = document.querySelector('#slide-counter');
  const progress = document.querySelector('#progress-bar');
  const readAll = document.querySelector('#read-all');
  const moduleMenu = document.querySelector('.module-menu');
  const fragmentSelector = ':scope > p:not(.kicker), :scope > figure, :scope > pre, :scope > details';
  const fragments = slides.map((slide) => Array.from(slide.querySelectorAll(fragmentSelector)));
  const fragmentCounts = fragments.map((slideFragments) => slideFragments.length);
  const hashIndex = navigation.resolveSlideHash(window.location.hash, ids);
  let readingAll = false;
  let progressiveState = {
    state: navigation.createNavigationState(ids, hashIndex ?? 0),
    revealed: hashIndex === null ? 0 : fragmentCounts[hashIndex],
  };

  document.documentElement.classList.add('js');
  fragments.flat().forEach((fragment) => fragment.classList.add('fragment'));

  function render({ updateHash = false, focus = false, direction = 'forward' } = {}) {
    const { state, revealed } = progressiveState;
    const visibleSlides = navigation.getSlideVisibility(state, ids, readingAll);
    slides.forEach((slide, index) => {
      const visible = visibleSlides[index];
      const active = index === state.index;
      slide.classList.toggle('is-active', active);
      slide.dataset.direction = direction;
      slide.setAttribute('aria-hidden', String(!visible));
      slide.querySelector('h2').tabIndex = -1;
      fragments[index].forEach((fragment, fragmentIndex) => {
        const shown = readingAll || (active && fragmentIndex < revealed);
        const hidden = !shown;
        fragment.hidden = hidden;
        fragment.inert = hidden;
        fragment.setAttribute('aria-hidden', String(hidden));
        fragment.classList.toggle('is-revealed', shown);
      });
    });
    counter.textContent = readingAll ? `Lectura completa · ${state.total} diapositivas` : `Diapositiva ${state.counter}`;
    progress.style.width = `${state.progress}%`;
    if (updateHash) history.pushState(null, '', `#${state.currentId}`);
    if (focus) {
      document.querySelector('.slide.is-active h2')?.focus({ preventScroll: true });
      document.querySelector('.slide.is-active')?.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function setReadAll(enabled) {
    readingAll = enabled;
    document.documentElement.classList.toggle('read-all', enabled);
    readAll.setAttribute('aria-pressed', String(enabled));
    readAll.textContent = enabled ? 'Modo diapositivas' : 'Leer todo';
    render();
  }

  function move(instruction, options = {}) {
    const next = navigation.navigateProgressively(progressiveState, instruction, ids, fragmentCounts);
    const changed = next !== progressiveState;
    if (changed) progressiveState = next;
    if (changed || options.focus) render(options);
  }

  document.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action) {
      move(action, { updateHash: true, focus: true, direction: action === 'previous' ? 'backward' : 'forward' });
      return;
    }
    const moduleLink = event.target.closest('.module-index a[href^="#"]');
    if (moduleLink) {
      const index = navigation.resolveSlideHash(moduleLink.hash, ids);
      if (index !== null) {
        event.preventDefault();
        setReadAll(false);
        move({ index }, { updateHash: true, focus: true, direction: 'forward' });
        moduleMenu.open = false;
      }
    }
  });

  readAll.addEventListener('click', () => setReadAll(!readingAll));

  window.addEventListener('hashchange', () => {
    const index = navigation.resolveSlideHash(window.location.hash, ids);
    if (index !== null) move({ index }, { focus: true, direction: 'forward' });
  });

  document.addEventListener('keydown', (event) => {
    const interactive = event.target.closest('input, textarea, select, button, a, summary, [contenteditable="true"]');
    if (interactive || event.altKey || event.ctrlKey || event.metaKey || readingAll) return;
    const keys = { ArrowRight: 'next', ArrowLeft: 'previous', Home: 'home', End: 'end' };
    if (keys[event.key]) {
      event.preventDefault();
      move(keys[event.key], {
        updateHash: true,
        focus: true,
        direction: event.key === 'ArrowLeft' ? 'backward' : 'forward',
      });
    }
  });

  render();
}());
