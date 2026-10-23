const test = require('node:test');
const assert = require('node:assert/strict');

const { createNavigationState, navigateProgressively } = require('../navigation.js');

const slideIds = ['inicio', 'historia', 'cierre'];
const fragmentCounts = [2, 0, 1];

function start(index = 0, revealed = 0) {
  return { state: createNavigationState(slideIds, index), revealed };
}

test('la derecha revela cada concepto antes de avanzar de diapositiva', () => {
  const initial = start();
  const firstReveal = navigateProgressively(initial, 'next', slideIds, fragmentCounts);
  const secondReveal = navigateProgressively(firstReveal, 'next', slideIds, fragmentCounts);
  const nextSlide = navigateProgressively(secondReveal, 'next', slideIds, fragmentCounts);

  assert.deepEqual(firstReveal, { state: initial.state, revealed: 1 });
  assert.deepEqual(secondReveal, { state: initial.state, revealed: 2 });
  assert.equal(nextSlide.state.currentId, 'historia');
  assert.equal(nextSlide.revealed, 0);
});

test('la izquierda oculta antes de volver con los conceptos previos revelados', () => {
  const fromSecondSlide = start(1);
  const priorSlide = navigateProgressively(fromSecondSlide, 'previous', slideIds, fragmentCounts);
  const hideLastConcept = navigateProgressively(priorSlide, 'previous', slideIds, fragmentCounts);

  assert.equal(priorSlide.state.currentId, 'inicio');
  assert.equal(priorSlide.revealed, 2);
  assert.equal(hideLastConcept.state.currentId, 'inicio');
  assert.equal(hideLastConcept.revealed, 1);
});

test('los límites conservan estado y la navegación directa revela contenido razonable', () => {
  const first = start();
  const last = start(2, 1);

  assert.equal(navigateProgressively(first, 'previous', slideIds, fragmentCounts), first);
  assert.equal(navigateProgressively(last, 'next', slideIds, fragmentCounts), last);
  assert.deepEqual(navigateProgressively(first, 'home', slideIds, fragmentCounts), {
    state: first.state,
    revealed: 2,
  });
  assert.deepEqual(navigateProgressively(last, 'home', slideIds, fragmentCounts), {
    state: createNavigationState(slideIds, 0),
    revealed: 2,
  });
  assert.deepEqual(navigateProgressively(first, { index: 2 }, slideIds, fragmentCounts), {
    state: createNavigationState(slideIds, 2),
    revealed: 1,
  });
});
