export function getFigmaSelection() {
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
