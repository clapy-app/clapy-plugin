import { FC, memo, useCallback } from 'react';

import { Button } from '../../components/Button';
import { useGetWorksQuery } from '../api-sample';

export const FetchApiSection: FC = memo(function FetchApiSection() {
  const { isLoading, error, data, refetch } = useGetWorksQuery();

  const refetchBtn = useCallback(() => refetch(), [refetch]);
  return (
    <>
      <div>
        <Button onClick={refetchBtn}>Refetch API</Button>
      </div>
      <div>
        {isLoading ? (
          <p>Loading API sample...</p>
        ) : error ? (
          <p>Could not fetch the API sample: {JSON.stringify(error.message || error)}</p>
        ) : (
          <p>API result: {JSON.stringify(data)}</p>
        )}
      </div>
    </>
  );
});
