const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createNavigationState,
  getSlideVisibility,
  navigate,
  resolveSlideHash,
} = require('../navigation.js');

const slideIds = ['inicio', 'historia', 'agentes'];

test('resuelve hashes válidos y rechaza hashes desconocidos', () => {
  assert.equal(resolveSlideHash('#historia', slideIds), 1);
  assert.equal(resolveSlideHash('#ausente', slideIds), null);
  assert.equal(resolveSlideHash('', slideIds), null);
});

test('crea estado inicial con contador y progreso observables', () => {
  assert.deepEqual(createNavigationState(slideIds), {
    index: 0,
    total: 3,
    currentId: 'inicio',
    counter: '1 / 3',
    progress: 0,
  });
});

test('navega por siguiente, anterior, inicio, fin y un índice explícito', () => {
  let state = createNavigationState(slideIds);
  state = navigate(state, 'next', slideIds);
  assert.deepEqual(state, {
    index: 1,
    total: 3,
    currentId: 'historia',
    counter: '2 / 3',
    progress: 50,
  });

  assert.equal(navigate(state, 'previous', slideIds).currentId, 'inicio');
  assert.equal(navigate(state, 'end', slideIds).currentId, 'agentes');
  assert.equal(navigate(state, { index: 1 }, slideIds).currentId, 'historia');
  assert.equal(navigate(state, 'home', slideIds).currentId, 'inicio');
});

test('conserva el mismo estado ante límites e instrucciones rechazadas', () => {
  const first = createNavigationState(slideIds);
  const last = navigate(first, 'end', slideIds);

  assert.equal(navigate(first, 'previous', slideIds), first);
  assert.equal(navigate(last, 'next', slideIds), last);
  assert.equal(navigate(first, { index: -1 }, slideIds), first);
  assert.equal(navigate(first, { index: 3 }, slideIds), first);
  assert.equal(navigate(first, { index: '1' }, slideIds), first);
  assert.equal(navigate(first, 'desconocido', slideIds), first);
});

test('expone todas las diapositivas a lectores asistivos en modo lectura completa', () => {
  const state = createNavigationState(slideIds, 1);
  assert.deepEqual(getSlideVisibility(state, slideIds, false), [false, true, false]);
  assert.deepEqual(getSlideVisibility(state, slideIds, true), [true, true, true]);
});
