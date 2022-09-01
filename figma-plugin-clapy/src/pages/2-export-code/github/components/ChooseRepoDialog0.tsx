import type { FC } from 'react';
import { useCallback, useMemo, useRef, memo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectGHHasRepoSelected, selectGHReposOrJustSelection } from '../github-slice.js';
import classes from '../GithubOption.module.css';
import List from '@mui/material/List/List.js';
import ListItem from '@mui/material/ListItem/ListItem.js';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton.js';
import ListItemText from '@mui/material/ListItemText/ListItemText.js';
import Divider from '@mui/material/Divider/Divider.js';
import AddIcon from '@mui/icons-material/Add';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon.js';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle.js';
import { env } from '../../../../environment/env.js';
import IconButton from '@mui/material/IconButton/IconButton.js';
import CloseIcon from '@mui/icons-material/Close';
import Pagination from '@mui/material/Pagination/Pagination.js';
import { useCallbackAsync2 } from '../../../../front-utils/front-utils.js';
import TextField from '@mui/material/TextField/TextField.js';
import Button from '@mui/material/Button/Button.js';
import Dialog from '@mui/material/Dialog/Dialog.js';

interface Props {}

// We add a '&' because it's a forbidden character in github, so it won't collide with other entries.
const newRepoKey = '&new_repo';

export const ChooseRepoDialog0: FC<Props> = memo(function ChooseRepoDialog0(props) {
  const [open, setOpen] = useState(false);
  const repoSelectionRef = useRef<string | null>(null);
  const hasRepoSelected = useSelector(selectGHHasRepoSelected);
  const repos = useSelector(selectGHReposOrJustSelection);

  const handleClickOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleChangePage = useCallbackAsync2(() => {}, []);

  const reposList = useMemo(
    () => (
      <List dense disablePadding className={classes.repoList}>
        <Divider />
        <ListItem key={newRepoKey} disablePadding>
          <ListItemButton disableRipple={true}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary={'New repository'} />
          </ListItemButton>
        </ListItem>
        {repos && (
          <>
            <Divider />
            {repos.map(repo => (
              <ListItem key={repo.full_name} disablePadding>
                <ListItemButton disableRipple={true}>
                  <ListItemText primary={repo.full_name} />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    ),
    [repos],
  );

  return (
    <>
      {/* <div className={classes.repoSelector}>
        <p className={classes.selectionPreview}>Repository: clapy-app/clapy-plugin</p>
        <Button variant='outlined' onClick={handleClickOpen}>
          {hasRepoSelected ? 'Change' : 'Choose'}
        </Button>
      </div> */}
      <div className={classes.repoSelector}>
        <TextField
          // id='outlined-read-only-input'
          label='Repository'
          defaultValue={'clapy-app/clapy-plugin' /* repoSelectionRef.current */}
          className={classes.selectionPreview}
          InputProps={{
            readOnly: true,
          }}
          // disabled
          InputLabelProps={{ shrink: true }}
          size='small'
        />
        <Button variant='outlined' onClick={handleClickOpen}>
          {hasRepoSelected ? 'Change' : 'Choose'}
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        container={env.isPreviewInBrowser ? document.getElementById('clapy-devpreview-wrapper') : undefined}
      >
        <DialogTitle>
          Choose a repository
          <IconButton
            aria-label='close'
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 12,
              // color: theme => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {/* <DialogContent> */}
        {/* <DialogContentText>Choose a repository</DialogContentText> */}
        {/* <TextField
            autoFocus
            margin='dense'
            id='name'
            label='Email Address'
            type='email'
            fullWidth
            variant='standard'
          /> */}
        {/* </DialogContent> */}
        {reposList}
        {/* <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions> */}
        <Pagination onChange={handleChangePage} count={10} className={classes.repoPagination} />
      </Dialog>
    </>
  );
});
