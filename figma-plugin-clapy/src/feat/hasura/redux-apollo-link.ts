export const foo = true;
// import { ApolloLink, Observable } from '@apollo/client';
// import { getMainDefinition } from '@apollo/client/utilities';
// import { Store } from '@reduxjs/toolkit';
// import { FieldNode, FragmentDefinitionNode, OperationDefinitionNode } from 'graphql';

// import { Query_Root } from '../../../generated/schema';
// import { isEmptyObject } from '../../common/general-utils';
// import { HasuraType, setHasuraError, setHasuraLoading, setHasuraValues } from './redux-apollo-slice';

// export function makeReduxLink(store: Store) {
//   return new ApolloLink((operation, forward) => {
//     let observer = forward(operation);
//     const definition = getMainDefinition(operation.query);
//     const opName = operation.operationName;
//     const requestedTable = getRequestedTable(definition);
//     const reduxField = opName || requestedTable;
//     if (!isIntrospectionQuery(opName)) {
//       store.dispatch(setHasuraLoading({ field: reduxField }));
//     }
//     // Patch because observer doesn't seem to be a full observable by default. It has a
//     // subscribe() method, but not a map().
//     if (!observer.map) {
//       observer = Observable.from(observer);
//     }
//     return (
//       observer.map(result => {
//         if (!isIntrospectionQuery(opName)) {
//           if (result?.errors) {
//             store.dispatch(setHasuraError({ field: reduxField, value: result.errors }));
//           } else {
//             const { __schema, ...data } = (result?.data || {}) as Query_Root & { __schema: any };
//             // For now, we write the response as is in the store. If later we need to make the
//             // distinction between multiple queries of the same table (e.g. different filters), we may
//             // need to update the path in store including query information, as apollo is doing with
//             // its own cache.
//             if (!isEmptyObject(data)) {
//               store.dispatch(setHasuraValues({ field: reduxField, value: data[reduxField as keyof HasuraType] }));
//             }
//           }
//         }
//         return result;
//       }) || null
//     );
//   });
// }

// function isIntrospectionQuery(name: string) {
//   return name === 'IntrospectionQuery';
// }

// function getRequestedTable(definition: OperationDefinitionNode | FragmentDefinitionNode) {
//   return (definition.selectionSet.selections[0] as FieldNode)?.name.value;
// }
