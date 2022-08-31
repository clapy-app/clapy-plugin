import TextField from '@mui/material/TextField/TextField.js';
import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectGHHasRepoSelected } from './github-slice.js';

interface Props {}

export const ChooseClapyBranch: FC<Props> = memo(function ChooseClapyBranch(props) {
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  if (!hasRepoSelected) {
    return null;
  }
  return <TextField disabled label='Clapy branch' defaultValue='gencode' size='small' />;
});
