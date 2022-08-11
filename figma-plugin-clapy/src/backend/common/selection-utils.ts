export function getFigmaSelections() {
  try {
    return figma.currentPage.selection;
  } catch (error: any) {
    if ((error?.message as string | undefined)?.match(/The node with id "[\d:]+" does not exist/)) {
      // Figma bug? When a node is not visible, calling .selection fails with the above error.
      // Let's fall back to an empty selection.
      return [];
    }
    throw error;
  }
}

export function getFigmaSelectionOrThrow() {
  const selection = getFigmaSelections();
  if (selection?.length !== 1) {
    throw new Error('Selection is not exactly one node, which is not compatible with serialization.');
  }
  return selection[0];
}

export function getFigmaSelection() {
  const selection = getFigmaSelections();
  if (selection?.length !== 1) return;
  return selection[0];
}
