import { ArgTypeObj } from '../../../common/app-models';
import { Args, ArgTypes } from '../../../common/sb-serialize.model';
import { argTypesToValuesFiltered } from '../../../common/storybook-utils';

interface ArgType2 {
  argName: string;
  // argType: ArgType;
  values: ReturnType<typeof argTypesToValuesFiltered>;
}

/**
 * @param argTypes The argTypes from Storybook, used to calculate the variants available. argTypes of type boolean or select are used, others are ignored.
 * @param storyArgFilters optional filter to use only some properties instead of all properties available in argTypes.
 * @param initialArgs optional initial args for properties not kept by storyArgFilters. If storyArgFilters is provided, you must also provide initialArgs.
 * @returns `undefined` if there are no argTypes available (empty object), a matrix of Args otherwise, each cell representing a variant to render with the values to use for each arg on that variant.
 */
export function buildArgsMatrix(argTypes: ArgTypes, storyArgFilters?: ArgTypeObj, initialArgs?: Args) {
  if (storyArgFilters && !initialArgs)
    throw new Error(
      'You must provide initialArgs because storyArgFilters was provided. Or remove storyArgFilters if filtering is not expected.',
    );
  let argsMatrix: Args[][] | undefined = undefined;
  let i = -1;
  let entries = Object.entries(argTypes);
  const argTypes2: ArgType2[] = entries.map(([argName, argType]) => ({
    argName,
    // argType,
    values: argTypesToValuesFiltered(argName, argType, storyArgFilters, initialArgs),
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
      if (columnDirection) {
        for (const row of argsMatrix) {
          const originalRow = [...row];
          for (let i = 0; i < values.length; i++) {
            const val = values[i];
            for (const args of originalRow) {
              if (i === 0) {
                Object.assign(args, { [argName]: val });
              } else {
                row.push({ ...args, [argName]: val });
              }
            }
          }
        }
      } else {
        const originalMatrix = [...argsMatrix];
        for (let i = 0; i < values.length; i++) {
          const val = values[i];
          for (const row of originalMatrix) {
            if (i === 0) {
              for (const args of row) {
                Object.assign(args, { [argName]: val });
              }
            } else {
              const newRow: Args[] = [];
              argsMatrix.push(newRow);
              for (const args of row) {
                newRow.push({ ...args, [argName]: val });
              }
            }
          }
        }
      }
    }
  }
  return argsMatrix;
}

// playground

// const ref =
//   '[[{"color":"primary","size":"default","active":false,"disabled":false},{"color":"secondary","size":"default","active":false,"disabled":false},{"color":"success","size":"default","active":false,"disabled":false},{"color":"danger","size":"default","active":false,"disabled":false},{"color":"primary","size":"default","active":false,"disabled":true},{"color":"secondary","size":"default","active":false,"disabled":true},{"color":"success","size":"default","active":false,"disabled":true},{"color":"danger","size":"default","active":false,"disabled":true}],[{"color":"primary","size":"sm","active":false,"disabled":false},{"color":"secondary","size":"sm","active":false,"disabled":false},{"color":"success","size":"sm","active":false,"disabled":false},{"color":"danger","size":"sm","active":false,"disabled":false},{"color":"primary","size":"sm","active":false,"disabled":true},{"color":"secondary","size":"sm","active":false,"disabled":true},{"color":"success","size":"sm","active":false,"disabled":true},{"color":"danger","size":"sm","active":false,"disabled":true}],[{"color":"primary","size":"xl","active":false,"disabled":false},{"color":"secondary","size":"xl","active":false,"disabled":false},{"color":"success","size":"xl","active":false,"disabled":false},{"color":"danger","size":"xl","active":false,"disabled":false},{"color":"primary","size":"xl","active":false,"disabled":true},{"color":"secondary","size":"xl","active":false,"disabled":true},{"color":"success","size":"xl","active":false,"disabled":true},{"color":"danger","size":"xl","active":false,"disabled":true}],[{"color":"primary","size":"default","active":true,"disabled":false},{"color":"secondary","size":"default","active":true,"disabled":false},{"color":"success","size":"default","active":true,"disabled":false},{"color":"danger","size":"default","active":true,"disabled":false},{"color":"primary","size":"default","active":true,"disabled":true},{"color":"secondary","size":"default","active":true,"disabled":true},{"color":"success","size":"default","active":true,"disabled":true},{"color":"danger","size":"default","active":true,"disabled":true}],[{"color":"primary","size":"sm","active":true,"disabled":false},{"color":"secondary","size":"sm","active":true,"disabled":false},{"color":"success","size":"sm","active":true,"disabled":false},{"color":"danger","size":"sm","active":true,"disabled":false},{"color":"primary","size":"sm","active":true,"disabled":true},{"color":"secondary","size":"sm","active":true,"disabled":true},{"color":"success","size":"sm","active":true,"disabled":true},{"color":"danger","size":"sm","active":true,"disabled":true}],[{"color":"primary","size":"xl","active":true,"disabled":false},{"color":"secondary","size":"xl","active":true,"disabled":false},{"color":"success","size":"xl","active":true,"disabled":false},{"color":"danger","size":"xl","active":true,"disabled":false},{"color":"primary","size":"xl","active":true,"disabled":true},{"color":"secondary","size":"xl","active":true,"disabled":true},{"color":"success","size":"xl","active":true,"disabled":true},{"color":"danger","size":"xl","active":true,"disabled":true}]]';
// const ref2 = [
//   [
//     { color: 'primary', size: 'default', active: false, disabled: false },
//     { color: 'secondary', size: 'default', active: false, disabled: false },
//     { color: 'success', size: 'default', active: false, disabled: false },
//     { color: 'danger', size: 'default', active: false, disabled: false },
//     { color: 'primary', size: 'default', active: false, disabled: true },
//     { color: 'secondary', size: 'default', active: false, disabled: true },
//     { color: 'success', size: 'default', active: false, disabled: true },
//     { color: 'danger', size: 'default', active: false, disabled: true },
//   ],
//   [
//     { color: 'primary', size: 'sm', active: false, disabled: false },
//     { color: 'secondary', size: 'sm', active: false, disabled: false },
//     { color: 'success', size: 'sm', active: false, disabled: false },
//     { color: 'danger', size: 'sm', active: false, disabled: false },
//     { color: 'primary', size: 'sm', active: false, disabled: true },
//     { color: 'secondary', size: 'sm', active: false, disabled: true },
//     { color: 'success', size: 'sm', active: false, disabled: true },
//     { color: 'danger', size: 'sm', active: false, disabled: true },
//   ],
//   [
//     { color: 'primary', size: 'xl', active: false, disabled: false },
//     { color: 'secondary', size: 'xl', active: false, disabled: false },
//     { color: 'success', size: 'xl', active: false, disabled: false },
//     { color: 'danger', size: 'xl', active: false, disabled: false },
//     { color: 'primary', size: 'xl', active: false, disabled: true },
//     { color: 'secondary', size: 'xl', active: false, disabled: true },
//     { color: 'success', size: 'xl', active: false, disabled: true },
//     { color: 'danger', size: 'xl', active: false, disabled: true },
//   ],
//   [
//     { color: 'primary', size: 'default', active: true, disabled: false },
//     { color: 'secondary', size: 'default', active: true, disabled: false },
//     { color: 'success', size: 'default', active: true, disabled: false },
//     { color: 'danger', size: 'default', active: true, disabled: false },
//     { color: 'primary', size: 'default', active: true, disabled: true },
//     { color: 'secondary', size: 'default', active: true, disabled: true },
//     { color: 'success', size: 'default', active: true, disabled: true },
//     { color: 'danger', size: 'default', active: true, disabled: true },
//   ],
//   [
//     { color: 'primary', size: 'sm', active: true, disabled: false },
//     { color: 'secondary', size: 'sm', active: true, disabled: false },
//     { color: 'success', size: 'sm', active: true, disabled: false },
//     { color: 'danger', size: 'sm', active: true, disabled: false },
//     { color: 'primary', size: 'sm', active: true, disabled: true },
//     { color: 'secondary', size: 'sm', active: true, disabled: true },
//     { color: 'success', size: 'sm', active: true, disabled: true },
//     { color: 'danger', size: 'sm', active: true, disabled: true },
//   ],
//   [
//     { color: 'primary', size: 'xl', active: true, disabled: false },
//     { color: 'secondary', size: 'xl', active: true, disabled: false },
//     { color: 'success', size: 'xl', active: true, disabled: false },
//     { color: 'danger', size: 'xl', active: true, disabled: false },
//     { color: 'primary', size: 'xl', active: true, disabled: true },
//     { color: 'secondary', size: 'xl', active: true, disabled: true },
//     { color: 'success', size: 'xl', active: true, disabled: true },
//     { color: 'danger', size: 'xl', active: true, disabled: true },
//   ],
// ];

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

//   console.log(JSON.stringify(argsMatrix));

//   console.log(ref === JSON.stringify(argsMatrix));
//   console.log(argsMatrix);
// }
