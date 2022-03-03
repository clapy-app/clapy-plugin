import { Args, ArgType, ArgTypes, isBooleanArgType, isSelectArgType } from '../../../common/sb-serialize.model';

interface ArgType2 {
  argName: string;
  // argType: ArgType;
  values: ReturnType<typeof argTypesToValues>;
}

export function buildArgsMatrix(argTypes: ArgTypes) {
  let argsMatrix: Args[][] | undefined = undefined;
  let i = -1;
  const argTypes2: ArgType2[] = Object.entries(argTypes).map(([argName, argType]) => ({
    argName,
    // argType,
    values: argTypesToValues(argType),
  }));
  argTypes2.sort((a, b) => {
    if (!b.values) return 1;
    if (!a.values) return -1;
    if (a.values?.length > b.values?.length) {
      return -1;
    }
    if (a.values?.length > b.values?.length) {
      return 1;
    }
    return 0;
  });
  // for (const [argName, argType] of Object.entries(argTypes)) {
  for (const { argName, /* argType, */ values } of argTypes2) {
    // TODO dev filter to remove later.
    // if (argName !== 'active' && argName !== 'outline') {
    //   continue;
    // }
    // if (argType.control?.type !== 'boolean') {
    //   continue;
    // }
    ++i;

    if (!argsMatrix) {
      argsMatrix = [[{}]];
    }

    // Column first
    // const columnDirection = i % 2 === 0;
    const columnDirection = !(argsMatrix[0].length > argsMatrix.length);

    // [[ {} ]]

    // [[ {a: false}, {a: true} ]]

    // [[ {a: false, d: false}, {a: true, d: false} ],
    //  [ {a: false, d: true}, {a: true, d: true} ]]

    // [[ {a: false, d: false, o: false}, {a: true, d: false, o: false}, {a: false, d: false, o: true}, {a: true, d: false, o: true} ],
    //  [ {a: false, d: true, o: false}, {a: true, d: true, o: false}, {a: false, d: true, o: true}, {a: true, d: true, o: true} ]]

    // let values: any[] | undefined = undefined;
    // if (isBooleanArgType(argType)) {
    //   values = [false, true];
    // } else if (isSelectArgType(argType)) {
    //   values = argType.options;
    // }

    if (values) {
      const firstValue = values[0];
      const otherValues = values.slice(1);

      if (columnDirection) {
        for (const row of argsMatrix) {
          for (const args of [...row]) {
            Object.assign(args, { [argName]: firstValue });
            for (const val of otherValues) {
              row.push({ ...args, [argName]: val });
            }
          }
        }
      } else {
        for (const row of [...argsMatrix]) {
          for (const val of otherValues) {
            const newRow: Args[] = [];
            argsMatrix.push(newRow);
            for (const args of row) {
              Object.assign(args, { [argName]: firstValue });
              newRow.push({ ...args, [argName]: val });
            }
          }
        }
      }
    }
  }
  return argsMatrix;
}

function argTypesToValues(argType: ArgType) {
  if (isBooleanArgType(argType)) {
    return [false, true];
  } else if (isSelectArgType(argType)) {
    return argType.options.map(v => v || 'default');
  }
}

// playground

// const ref =
//   '[[{"active":false,"disabled":false,"outline":false},{"active":true,"disabled":false,"outline":false},{"active":false,"disabled":false,"outline":true},{"active":true,"disabled":false,"outline":true}],[{"active":false,"disabled":true,"outline":false},{"active":true,"disabled":true,"outline":false},{"active":false,"disabled":true,"outline":true},{"active":true,"disabled":true,"outline":true}]]';
//
// playground();
// function playground() {
//   const argTypes: ArgTypes = {
//     active: { control: { type: 'boolean' } },
//     disabled: { control: { type: 'boolean' } },
//     // outline: { control: { type: 'boolean' } },
//     color: {
//       control: { type: 'select' },
//       options: ['primary', 'secondary', 'success', 'danger'],
//     },
//     size: {
//       control: { type: 'select' },
//       options: ['', 'sm', 'xl'],
//     },
//   };
//   const argsMatrix = buildArgsMatrix(argTypes as unknown as ArgTypes);

//   // console.log(ref === JSON.stringify(argsMatrix));
//   console.log(argsMatrix);
// }
