const isPreviewInFigma = process.env.PREVIEW_ENV === 'figma';

export function showUI() {
  figma.showUI(__html__);
  if (isPreviewInFigma) {
    figma.ui.resize(300, 200);
  } else {
    // Must match src/core/dev-preview-mode/PreviewMode.module.css
    figma.ui.resize(404, 600);
  }
}

export function reloadUI() {
  figma.ui.close();
  showUI();
}
