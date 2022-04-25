import { createSlice } from '@reduxjs/toolkit';

import { Query_Root, Subscription_Root } from '../../../generated/schema';

// Model

export type HasuraType = Omit<Query_Root & Subscription_Root, '__typename'>;

interface HasuraModel {
  loadings: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: any;
  };
  values: Partial<HasuraType>;
}

const hasuraSlice = createSlice({
  name: 'hasura',
  initialState: { loadings: {}, errors: {}, values: {} } as HasuraModel,
  reducers: {
    setHasuraLoading: (state, action) => {
      const { field } = action.payload ?? {};
      state.loadings[field] = true;
      state.errors[field] = undefined;
    },
    setHasuraError: (state, action) => {
      const { field, value } = action.payload ?? {};
      state.loadings[field] = false;
      state.errors[field] = value;
      state.values[field as keyof HasuraType] = undefined;
    },
    setHasuraValues: (state, action) => {
      const { field, value } = action.payload ?? {};
      state.loadings[field] = false;
      state.errors[field] = undefined;
      state.values[field as keyof HasuraType] = value;
    },
  },
});

export const { setHasuraLoading, setHasuraError, setHasuraValues } = hasuraSlice.actions;

export const hasuraReducer = hasuraSlice.reducer;
