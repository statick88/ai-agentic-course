(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CourseNavigation = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function resolveSlideHash(hash, slideIds) {
    if (typeof hash !== 'string' || !Array.isArray(slideIds)) return null;
    const id = hash.replace(/^#/, '');
    const index = slideIds.indexOf(id);
    return index === -1 ? null : index;
  }

  function createNavigationState(slideIds, index) {
    const total = Array.isArray(slideIds) ? slideIds.length : 0;
    const safeIndex = Number.isInteger(index) && index >= 0 && index < total ? index : 0;
    return {
      index: safeIndex,
      total,
      currentId: total ? slideIds[safeIndex] : null,
      counter: total ? `${safeIndex + 1} / ${total}` : '0 / 0',
      progress: total > 1 ? Math.round((safeIndex / (total - 1)) * 100) : 0,
    };
  }

  function getSlideVisibility(state, slideIds, readAll) {
    if (!state || !Array.isArray(slideIds)) return [];
    return slideIds.map((_, index) => Boolean(readAll || index === state.index));
  }

  function navigate(state, instruction, slideIds) {
    if (!state || !Array.isArray(slideIds) || state.total !== slideIds.length) return state;
    let target = null;
    if (instruction === 'next') target = state.index + 1;
    if (instruction === 'previous') target = state.index - 1;
    if (instruction === 'home') target = 0;
    if (instruction === 'end') target = slideIds.length - 1;
    if (instruction && typeof instruction === 'object' && Number.isInteger(instruction.index)) target = instruction.index;
    if (!Number.isInteger(target) || target < 0 || target >= slideIds.length || target === state.index) return state;
    return createNavigationState(slideIds, target);
  }

  function navigateProgressively(progressiveState, instruction, slideIds, fragmentCounts) {
    if (!progressiveState || !progressiveState.state || !Array.isArray(fragmentCounts)) return progressiveState;
    const current = progressiveState.state;
    if (!Array.isArray(slideIds) || current.total !== slideIds.length || fragmentCounts.length !== slideIds.length) return progressiveState;
    const fragmentCount = (index) => Math.max(0, Number.isInteger(fragmentCounts[index]) ? fragmentCounts[index] : 0);
    const revealed = Math.min(Math.max(0, progressiveState.revealed || 0), fragmentCount(current.index));

    if (instruction === 'next' && revealed < fragmentCount(current.index)) {
      return { state: current, revealed: revealed + 1 };
    }
    if (instruction === 'previous' && revealed > 0) {
      return { state: current, revealed: revealed - 1 };
    }

    const targetState = navigate(current, instruction, slideIds);
    const directNavigation = instruction === 'home' || instruction === 'end' || (instruction && typeof instruction === 'object' && Number.isInteger(instruction.index));
    if (targetState === current) {
      if (directNavigation && revealed !== fragmentCount(current.index)) {
        return { state: current, revealed: fragmentCount(current.index) };
      }
      return progressiveState;
    }
    return {
      state: targetState,
      revealed: instruction === 'next' ? 0 : fragmentCount(targetState.index),
    };
  }

  return { createNavigationState, getSlideVisibility, navigate, navigateProgressively, resolveSlideHash };
}));
