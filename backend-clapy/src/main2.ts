import { waitInfinite } from './common/general-utils.js';
import { perfReset, perfTotal } from './common/perf-utils.js';
import { CodeController } from './features/export-code/1-code-controller.js';
import { devFigmaConfig } from './features/export-code/dev-figma-config header.js';
import { round } from './features/export-code/gen-node-utils/utils-and-reset.js';

// To work on features outside the webservice, and keep live reload.

async function main() {
  perfReset('Starting...');

  // Send to codesandbox
  await new CodeController().exportCode(devFigmaConfig, false);

  // await insertTrackings();

  // let rotation, centerX, centerY, radiusX, radiusY;

  // ({
  //   rotation,
  //   center: [centerX, centerY],
  //   radius: [radiusX, radiusY],
  // } = extractRadialOrDiamondGradientParams(237, 49, [
  //   [-0.04934849217534065, 0.9998960494995117, 0.024674072861671448],
  //   [-1.0020097494125366, -0.002113909926265478, 1.001004934310913],
  // ]));
  // console.log(
  //   'Radial longer:',
  //   formatRadial({
  //     rotation,
  //     center: [centerX, centerY],
  //     radius: [radiusX, radiusY],
  //   }),
  // );

  // ({
  //   rotation,
  //   center: [centerX, centerY],
  //   radius: [radiusX, radiusY],
  // } = extractRadialOrDiamondGradientParams(237, 49, [
  //   [-0.04934849590063095, 0.9998960494995117, 0.024674074724316597],
  //   [-1.7399438619613647, -0.00367070734500885, 1.3699719905853271],
  // ]));
  // console.log(
  //   'Radial shorter:',
  //   formatRadial({
  //     rotation,
  //     center: [centerX, centerY],
  //     radius: [radiusX, radiusY],
  //   }),
  // );

  // ({
  //   rotation,
  //   center: [centerX, centerY],
  //   radius: [radiusX, radiusY],
  // } = extractRadialOrDiamondGradientParams(237, 49, [
  //   [-0.04934849590063095, 0.9998960494995117, 0.024674074724316597],
  //   [-3.5046095848083496, -0.007393569685518742, 2.252304792404175],
  // ]));
  // console.log(
  //   'Radial shorter 2:',
  //   formatRadial({
  //     rotation,
  //     center: [centerX, centerY],
  //     radius: [radiusX, radiusY],
  //   }),
  // );

  // ({
  //   rotation,
  //   center: [centerX, centerY],
  //   radius: [radiusX, radiusY],
  // } = extractRadialOrDiamondGradientParams(237, 49, [
  //   [3.6174778938293457, 0.011418482288718224, -1.310632348060608],
  //   [-0.04002148285508156, 0.5419836044311523, 0.2489766776561737],
  // ]));
  // console.log(
  //   'Radial rotated:',
  //   formatRadial({
  //     rotation,
  //     center: [centerX, centerY],
  //     radius: [radiusX, radiusY],
  //   }),
  // );

  perfTotal();
}

main().catch(err => {
  console.error('Error caught in main2.ts, normally sent to the client.');
  console.error(err);
});

waitInfinite();

function formatRadial({ rotation, center: [centerX, centerY], radius: [radiusX, radiusY] }: any) {
  return {
    rotation: round(rotation),
    centerX: round(centerX),
    centerY: round(centerY),
    radiusX: round(radiusX),
    radiusY: round(radiusY),
  };
}
