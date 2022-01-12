export function createRectangles(count: number) {
  const nodes: SceneNode[] = [];

  for (let i = 0; i < count; i++) {
    const rect = figma.createRectangle();
    rect.x = i * 150;
    rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
    figma.currentPage.appendChild(rect);
    nodes.push(rect);
  }

  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);

  return `Created ${count} Rectangles`;

  // figma.closePlugin();
}