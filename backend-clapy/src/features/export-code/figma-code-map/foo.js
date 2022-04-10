const {
  extractLinearGradientParamsFromTransform,
  extractRadialOrDiamondGradientParams,
} = require('@figma-plugin/helpers');

function parseTransformationMatrix(transformationMatrix) {
  const [[a, c, tx], [b, d, ty]] = transformationMatrix;
  const sx = round(Math.sign(a) * Math.sqrt(a * a + b * b));
  const sy = round(Math.sign(d) * Math.sqrt(c * c + d * d));
  const rotation = round(radiansToDegrees(Math.atan2(-b, a)));
  const rotation2 = round(radiansToDegrees(Math.atan2(c, d)));
  const res = {
    tx,
    ty,
    sx,
    sy,
    rotation,
    rotation2,
  };
}

// https://math.stackexchange.com/a/13165
function getGradientDegreeFromMatrix(label, gradientTransform) {
  // const a = gradientTransform[0][0];
  // const c = gradientTransform[0][1];
  // const b = gradientTransform[1][0];
  // const d = gradientTransform[1][1];
  // const tx = gradientTransform[0][2];
  // const ty = gradientTransform[1][2];
  // const [[a, b, tx], [c, d, ty]] = gradientTransform;
  const [[a, c, tx], [b, d, ty]] = gradientTransform;
  // const sx = round(Math.sign(a) * Math.sqrt(a * a + b * b));
  // const sy = round(Math.sign(d) * Math.sqrt(c * c + d * d));
  const rotation = round(radiansToDegrees(Math.atan2(-b, a)));
  const rotation2 = round(radiansToDegrees(Math.atan2(c, d)));
  const res = {
    // tx,
    // ty,
    // sx,
    // sy,
    rotation,
    rotation2,
  };
  if (label) {
    console.log(`${label}:`, res);
  } else {
    console.log(res);
  }

  // let angle = Math.atan2(-b, a) * (180 / Math.PI);
  // if (angle >= -180 && angle <= 90) {
  //   angle = round(angle + 90);
  // } else {
  //   angle = round(angle - 270);
  // }
  // console.log('angle:', angle);
  // return angle;
}

function round(num, precision = 4) {
  let res = Math.round(num * 10 ** precision) / 10 ** precision;
  // To avoid -0 (not nice for display)
  return res === 0 ? 0 : res;
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

// getGradientDegreeFromMatrix([
//   [1.052304744720459, 0.06253653764724731, -0.20673057436943054],
//   [-0.06253653019666672, 0.0077216229401528835, 0.5260858535766602],
// ]);

function formatStartEnd({ start: [startX, startY], end: [endX, endY] }) {
  return { startX: round(startX), startY: round(startY), endX: round(endX), endY: round(endY) };
}

console.log(
  'Vertical:',
  formatStartEnd(
    extractLinearGradientParamsFromTransform(237, 49, [
      [6.123234262925839e-17, 1, 0],
      [-1, 6.123234262925839e-17, 1],
    ]),
  ),
);
console.log(
  'Horizontal:',
  formatStartEnd(
    extractLinearGradientParamsFromTransform(237, 49, [
      [3.537313461303711, -2.1659798455083914e-16, -1.7686567306518555],
      [-3.35800520936353e-17, 0.15120600163936615, 0.5],
    ]),
  ),
);
// extractLinearGradientParamsFromTransform('Un peu penché', [
//   [3.322249412536621, 0.22363488376140594, -1.6611247062683105],
//   [-0.22363488376140594, 0.14201287925243378, 0.6118174195289612],
// ]);
console.log(
  'Un peu penché:',
  formatStartEnd(
    extractLinearGradientParamsFromTransform(237, 49, [
      [3.322249412536621, 0.22363488376140594, -1.6611247062683105],
      [-0.22363488376140594, 0.14201287925243378, 0.6118174195289612],
    ]),
  ),
);

// extractLinearGradientParamsFromTransform('Très penché', [
//   [2.500908613204956, 1.1472382545471191, -1.2504544258117676],
//   [-1.1472383737564087, 0.10690384358167648, 1.0736191272735596],
// ]);

// getGradientDegreeFromMatrix([
//   [1.9323850870132446, -1.2097758054733276, 0.17285645008087158],
//   [-0.10049082338809967, 0.09204621613025665, 0.506160318851471],
// ]);
// getGradientDegreeFromMatrix([
//   [1.000001072883606, -5.4272894859313965, 2.713643789291382],
//   [-8.004726481658508e-8, 0.32987162470817566, 0.33506426215171814],
// ]);

// getGradientDegreeFromMatrix([
//   [1.0000007152557373, -5.427292346954346, 5.427291393280029],
//   [-2.5535316083846737e-8, 0.3298717439174652, 0.17012827098369598],
// ]);

// getGradientDegreeFromMatrix([
//   [0.7198373079299927, -0.6941428184509277, 45.119384765625],
//   [0.6941428184509277, 0.7198373079299927, 0],
// ]);

// getGradientDegreeFromMatrix([
//   [1, 5.551115123125783e-17, 202],
//   [-5.551115123125783e-17, 1, 137],
// ]);
