import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiGet } from '../common/http.utils';
import { Dispatcher, useAppDispatch } from '../core/redux/hooks';
import { RootState } from '../core/redux/store';

// -- RTK Query version
// /!\ it seems to add a significant overhead in auto-completion. The extra typings may be too heavy and complex.
// Copy the import:
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export const sampleApi = createApi({
//   reducerPath: 'sampleApi',
//   baseQuery: fetchBaseQuery({
//     baseUrl: `${env.apiBaseUrl}/sample`,
//     prepareHeaders: addAuthHeader,
//   }),
//   endpoints: (builder) => ({
//     getWorks: builder.query<SampleApiModel, void>({
//       query: () => `works`,
//     }),
//   }),
// });

// async function addAuthHeader(headers: Headers) {
//   const { accessToken, tokenType } = await getTokens();
//   if (accessToken) {
//     headers.set('authorization', `${tokenType || 'Bearer'} ${accessToken}`);
//   }
//   return headers;
// }

// -- RTK vanilla version

export interface FetchWorksState {
  isLoading?: boolean;
  error?: any;
  data?: SampleApiModel;
}

const initialState: FetchWorksState = { isLoading: true };

const slice = createSlice({
  name: 'sampleApi',
  initialState,
  reducers: {
    fetchWorksStartLoading: state => {
      state.isLoading = true;
      state.error = undefined;
      state.data = undefined;
    },
    fetchWorksSuccess: (state, { payload }: PayloadAction<SampleApiModel>) => {
      state.isLoading = false;
      state.error = undefined;
      state.data = payload;
    },
    fetchWorksError: (state, { payload }: PayloadAction<any>) => {
      state.isLoading = false;
      state.error = payload;
      state.data = undefined;
    },
  },
});

export const { fetchWorksStartLoading, fetchWorksSuccess, fetchWorksError } = slice.actions;

const selectSampleApi = (state: RootState) => state.sampleApi;

export const sampleApi = {
  reducer: slice.reducer,
  reducerPath: slice.name,

  useGetWorksQuery: () => {
    const state = useSelector(selectSampleApi);
    const dispatch = useAppDispatch();
    useEffect(() => {
      refetch(dispatch);
    }, [dispatch]);
    return {
      ...state,
      refetch: () => {
        refetch(dispatch);
      },
    };
  },
};

function refetch(dispatch: Dispatcher) {
  apiGet<SampleApiModel>(`sample/works`)
    .then(({ data }) => dispatch(fetchWorksSuccess(data)))
    .catch(error => {
      console.error(error);
      dispatch(fetchWorksError(error));
    });
}

// -- end

type SampleApiModel = {
  works: boolean;
};

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetWorksQuery } = sampleApi;
