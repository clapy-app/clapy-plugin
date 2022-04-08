// https://math.stackexchange.com/a/13165
function getGradientDegreeFromMatrix(gradientTransform) {
  // const a = gradientTransform[0][0];
  // const c = gradientTransform[0][1];
  // const b = gradientTransform[1][0];
  // const d = gradientTransform[1][1];
  // const tx = gradientTransform[0][2];
  // const ty = gradientTransform[1][2];
  // const [[a, b, tx], [c, d, ty]] = gradientTransform;
  const [[a, c, tx], [b, d, ty]] = gradientTransform;
  const sx = Math.sign(a) * Math.sqrt(a * a + b * b);
  const sy = Math.sign(d) * Math.sqrt(c * c + d * d);
  const rotation = Math.atan2(-b, a);
  const rotation2 = Math.atan2(c, d);
  console.log(sx, sy, radiansToDegrees(rotation), radiansToDegrees(rotation2));

  const angle = Math.atan2(-gradientTransform[1][0], gradientTransform[0][0]) * (180 / Math.PI);
  if (angle >= -180 && angle <= 90) {
    return angle + 90;
  } else {
    return angle - 270;
  }
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

// getGradientDegreeFromMatrix([
//   [1.052304744720459, 0.06253653764724731, -0.20673057436943054],
//   [-0.06253653019666672, 0.0077216229401528835, 0.5260858535766602],
// ]);
// getGradientDegreeFromMatrix([
//   [1.9323850870132446, -1.2097758054733276, 0.17285645008087158],
//   [-0.10049082338809967, 0.09204621613025665, 0.506160318851471],
// ]);
// getGradientDegreeFromMatrix([
//   [1.000001072883606, -5.4272894859313965, 2.713643789291382],
//   [-8.004726481658508e-8, 0.32987162470817566, 0.33506426215171814],
// ]);

getGradientDegreeFromMatrix([
  [1.0000007152557373, -5.427292346954346, 5.427291393280029],
  [-2.5535316083846737e-8, 0.3298717439174652, 0.17012827098369598],
]);
