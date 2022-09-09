import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import type { FC } from 'react';
import { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { Button_SizeSmHierarchyLinkColo2 } from '../../4-Generator/quotaBar/Button_SizeSmHierarchyLinkColo2/Button_SizeSmHierarchyLinkColo2.js';
import { Button_SizeSmHierarchyLinkColo } from '../../4-Generator/quotaBar/Button_SizeSmHierarchyLinkColo/Button_SizeSmHierarchyLinkColo.js';
import { track } from '../../../common/analytics';
import type { ExtractionProgress, UserMetadata } from '../../../common/app-models.js';
import { getDuration } from '../../../common/general-utils';
import { perfMeasure, perfReset } from '../../../common/perf-front-utils.js';
import type { Disposer } from '../../../common/plugin-utils';
import { fetchPlugin, subscribePlugin } from '../../../common/plugin-utils';
import type { GenCodeResponse, ExportCodePayload, ExportImageMap2 } from '../../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../../common/sb-serialize.model.js';
import { Button } from '../../../components-used/Button/Button';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { selectIsAlphaDTCUser, selectNoCodesandboxUser } from '../../../core/auth/auth-slice';
import { useAppDispatch } from '../../../core/redux/hooks.js';
import { env } from '../../../environment/env.js';
import { handleError, useCallbackAsync2 } from '../../../front-utils/front-utils';
import { apiGet, apiPost } from '../../../front-utils/http.utils.js';
import { selectIsUserMaxQuotaReached, selectUserMetadata, setStripeData } from '../../user/user-slice.js';
import { uploadAssetFromUintArrayRaw } from '../cloudinary.js';
import {
  selectIsCodeGenReady,
  selectIsLoadingUserSettings,
  selectSelectionPreview,
  selectSelectionPreviewError,
  setLoading,
} from '../export-code-slice.js';
import { downloadFile, readUserSettingsWithDefaults, useLoadUserSettings } from '../export-code-utils.js';
import { AddCssOption } from '../user-settings/CustomCssSetting/CustomCssSetting.js';
import { BackToCodeGen } from './BackToCodeGen/BackToCodeGen';
import { EditCodeButton } from './EditCodeButton/EditCodeButton';
import classes from './FigmaToCodeHome.module.css';
import { LivePreviewButton } from './LivePreviewButton/LivePreviewButton';
import { LockIcon } from './lockIcon/lock.js';
import { SelectionPreview } from './SelectionPreview/SelectionPreview';
import { GenTargetOptions } from '../user-settings/TargetSetting.js';
import { loadGHSettings } from '../github/github-service.js';
import { githubPost } from '../../../front-utils/http-github-utils.js';
import { PageSetting } from '../user-settings/PageSetting.js';
import { FrameworkSetting } from '../user-settings/FrameworkSetting.js';
import { LegacyZipSetting } from '../user-settings/LegacyZipSetting.js';
import { ScssSetting } from '../user-settings/ScssSetting.js';
import { ScssBemSetting } from '../user-settings/ScssBemSetting.js';
import { AngularPrefixSetting } from '../user-settings/AngularPrefixSetting.js';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selectionko' | 'selection' | 'selection_too_many' | 'generated';

interface Props {}

// TODO
// After removing the old/new user, FigmaToCodeHome should be used at one single place.
// Once done, move this user settings loading one level above, around tabs but after login, so that it doesn't re-run each time the user changes of tab. To avoid a blink when changing of tab.
export const FigmaToCodeHome: FC<Props> = memo(function FigmaToCodeHome(props) {
  useLoadUserSettings();
  const loadingUserSettings = useSelector(selectIsLoadingUserSettings);
  if (loadingUserSettings) return <Loading />;
  return <FigmaToCodeHomeInner />;
});

export const FigmaToCodeHomeInner: FC<Props> = memo(function FigmaToCodeHomeInner(props) {
  const selectionPreview = useSelector(selectSelectionPreview);
  const selectionPreviewError = useSelector(selectSelectionPreviewError);
  const [sandboxId, setSandboxId] = useState<string | undefined>();
  const [githubPRUrl, setGithubPRUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExtractionProgress | undefined>();
  const isNoCodeSandboxUser = useSelector(selectNoCodesandboxUser);
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);
  const isQuotaReached = useSelector(selectIsUserMaxQuotaReached);
  const { picture } = useSelector(selectUserMetadata);
  const isCodeGenReady = useSelector(selectIsCodeGenReady);
  const dispatch = useAppDispatch();

  const state: MyStates = isLoading
    ? 'loading'
    : sandboxId || githubPRUrl
    ? 'generated'
    : selectionPreview
    ? 'selection'
    : selectionPreviewError === 'too_many_elements'
    ? 'selection_too_many'
    : selectionPreview === false
    ? 'selectionko'
    : 'noselection';

  const generateCode = useCallbackAsync2(async () => {
    const timer = performance.now();
    let unsubscribe: Disposer | undefined;
    try {
      perfReset();
      setIsLoading(true);
      dispatch(setLoading(true));
      setSandboxId('loading');

      // Read user settings
      let userSettings = await readUserSettingsWithDefaults();

      track('gen-code', 'start', userSettings);

      // Extract the Figma configuration

      unsubscribe = subscribePlugin('figmaConfigExtractionProgress', (error, progress) => {
        if (error) {
          const durationInS = getDuration(timer, performance.now());
          track('gen-code-progress', 'error', { error: error?.message, durationInS });
          handleError(error);
        } else {
          setProgress(progress);
        }
      });

      setProgress({ stepId: 'init', stepNumber: 1 });
      const { extraConfig, root, components, nodeIdsToExtractAsSVG, imageHashesToExtract, styles, tokens, page } =
        await fetchPlugin('serializeSelectedNode');
      unsubscribe?.();
      perfMeasure(`Figma configuration extracted in`);

      setProgress({ stepId: 'extractSVGs', stepNumber: 5 });
      const svgs = await fetchPlugin('extractSVGs', nodeIdsToExtractAsSVG);
      perfMeasure(`SVGs extracted in`);

      setProgress({ stepId: 'uploadAsset', stepNumber: 6, nodeName: `Preparing...` });

      const images: ExportImageMap2 = {};
      let i = 0;
      for (const imageHashToExtract of imageHashesToExtract) {
        const image = await fetchPlugin('extractImage', imageHashToExtract);
        if (image) {
          setProgress({
            stepId: 'uploadAsset',
            stepNumber: 6,
            nodeName: `Asset ${++i} / ${imageHashesToExtract.length}`,
          });
          const { bytes, ...imageEntryRest } = image;
          // If required, I can upload to CDN here. Figma can provide the image hash and the URL.
          // const assetUrl = await uploadAsset(fileAsUint8ArrayRaw);

          // Replace Figma asset URL with our own CDN. Benefits:
          // - Avoid CORS issue in codesandbox when exporting the project as zip
          // - Allows image compression if useful later, instead of keeping the original HD image.
          try {
            let url = await uploadAssetFromUintArrayRaw(Uint8Array.from(bytes), imageHashToExtract);
            if (!url) {
              handleError(`BUG Failed to upload the image with hash ${imageHashToExtract} on the CDN.`);
            } else {
              images[imageHashToExtract] = { ...imageEntryRest, url };
            }
          } catch (error) {
            handleError(error);
          }
          perfMeasure(`Image uploaded`);
        }
      }
      perfMeasure(`Images extracted in`);

      if (components && styles) {
        const nodes: ExportCodePayload = {
          root,
          components,
          svgs,
          images,
          styles,
          extraConfig: {
            ...extraConfig,
            enableMUIFramework: isAlphaDTCUser,
            ...userSettings,
          },
          tokens,
          page,
        };

        // TODO gestion de l'unicité : utiliser le hash de l'image comme ID unique
        // TODO improvements for images
        // Small UI update: 2 steps loading (show a loader?)
        // Check if the hash is already in database. If yes, reuse the URL.
        // If not, upload to CDN and save the hash + URL in database.
        // When a node has an image, apply relevant formattings using the info from the node.
        // Include the image in the generated project using codesandbox binary feature and point to it in the HTML

        if (env.isDev) {
          console.log(JSON.stringify(nodes));
        }
        if (!env.isDev || sendToApi) {
          // Fix legacy zip config
          if (!nodes.extraConfig.target) {
            nodes.extraConfig.target = nodes.extraConfig.zip ? UserSettingsTarget.zip : UserSettingsTarget.csb;
          }

          // /!\ this `if` block is necessary for users with role "noCodesandbox". Don't modify unless you know what you are doing.
          if (isNoCodeSandboxUser && nodes.extraConfig.target === 'csb') {
            nodes.extraConfig.target = UserSettingsTarget.zip;
          }

          // Get the github settings
          let fetchApiMethod: typeof apiPost;
          if (nodes.extraConfig.target === UserSettingsTarget.github) {
            setProgress({ stepId: 'readGhSettings', stepNumber: 7 });
            const githubSettings = await loadGHSettings();
            if (!githubSettings) {
              throw new Error('No github settings found although GitHub has been selected as target');
            }
            nodes.extraConfig.githubSettings = githubSettings;
            fetchApiMethod = githubPost;
          } else {
            fetchApiMethod = apiPost;
          }

          setProgress({ stepId: 'generateCode', stepNumber: 8 });

          const { data } = await fetchApiMethod<GenCodeResponse>('code/export', nodes);
          if (!data.quotas) {
            const { data } = await apiGet<UserMetadata>('stripe/get-user-quota');
            dispatch(setStripeData(data));
          } else {
            dispatch(setStripeData(data));
          }

          perfMeasure(`Code generated and ${data?.sandbox_id ? 'uploaded to CSB' : 'downloaded'} in`);
          const durationInS = getDuration(timer, performance.now());

          if (data?.sandbox_id) {
            if (env.isDev) {
              console.log('sandbox preview:', `https://${data.sandbox_id}.csb.app/`, `(in ${durationInS} seconds)`);
            }
            // window.open(url, '_blank', 'noopener');
            setSandboxId(data.sandbox_id);
            track('gen-code', 'completed', { url: `https://${data.sandbox_id}.csb.app/`, durationInS });
            return;
          } else if (data?.url) {
            if (env.isDev) {
              console.log('sandbox preview:', `https://${data.url}.csb.app/`, `(in ${durationInS} seconds)`);
            }
            setGithubPRUrl(data.url);
            track('gen-code', 'completed', { url: `https://${data.url}.csb.app/`, durationInS, github: true });
            return;
          } else {
            track('gen-code', 'completed-no-data', { durationInS });
          }

          // Tmp code:
          downloadFile(data as unknown as Blob, 'Code export.zip');
        }
      }

      // Dont put in Finally, there is a return above. Set to undefined is only if not successfully completed.
      setSandboxId(undefined);
    } catch (error: any) {
      setSandboxId(undefined);
      const durationInS = getDuration(timer, performance.now());
      track('gen-code', 'error', { error: error?.message, durationInS });
      if (error?.message === 'NODE_NOT_VISIBLE') {
        error = `Node ${error.nodeName} is not visible, you must select a visible node to export as code.`;
      }
      throw error;
    } finally {
      unsubscribe?.();
      setIsLoading(false);
      dispatch(setLoading(false));
      setProgress(undefined);
    }
  }, [dispatch, isAlphaDTCUser, isNoCodeSandboxUser]);

  const backToSelection = useCallback(() => {
    setSandboxId(undefined);
    setGithubPRUrl(undefined);
  }, []);
  return (
    <div className={classes.root}>
      <div className={classes.previewTitle}>
        {(state === 'noselection' || state === 'selection_too_many') && <>Choose an element to code</>}
        {(state === 'selection' || state === 'selectionko') && <>Ready to code</>}
        {isLoading && <>Your code is loading...</>}
        {state === 'generated' && <>And... it’s done!</>}
      </div>
      <SelectionPreview state={state} selectionPreview={selectionPreview} progress={progress} />
      {!isQuotaReached && typeof picture !== 'undefined' && state !== 'generated' && (
        <>
          <PageSetting />
          <GenTargetOptions />
          <Accordion classes={{ root: classes.accordionRoot }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls='panel1a-content'
              id='panel1a-header'
              disabled={isLoading}
            >
              <Typography>Advanced options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FrameworkSetting />
                <LegacyZipSetting />
                <ScssSetting />
                <ScssBemSetting />
                <AddCssOption />
                {/* Angular-specific setting: component prefix */}
                <AngularPrefixSetting />
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        </>
      )}
      {typeof picture === 'undefined' ? (
        <Loading />
      ) : (
        <Button
          onClick={generateCode}
          disabled={state === 'loading' || state === 'noselection' || isQuotaReached || !isCodeGenReady}
          loading={isLoading}
          className={state === 'generated' ? classes.hide : undefined}
        >
          {isQuotaReached ? (
            <>
              <LockIcon />
              &nbsp;&nbsp; <span> Generate code</span>
            </>
          ) : (
            <>&lt; Generate code &gt;</>
          )}
        </Button>
      )}
      {isQuotaReached && state !== 'generated' ? (
        <div className={classes.fullQuotaTextContainer}>
          You have used up all your monthly credits.
          <span className={classes.links}>
            <Button_SizeSmHierarchyLinkColo
              text={{
                text: <span className={classes.links}>Give us feedback</span>,
              }}
            />
          </span>{' '}
          to earn more credits
          <br /> or{' '}
          <span className={classes.links}>
            <Button_SizeSmHierarchyLinkColo2
              text={{
                text: <span className={classes.links}>upgrade</span>,
              }}
            />
          </span>{' '}
          for unlimited access.
        </div>
      ) : null}
      {state === 'generated' &&
        (githubPRUrl ? (
          <>
            <div className={classes.openResult}>
              {/* <LivePreviewButton url={githubPRUrl} /> */}
              <Button href={githubPRUrl} target='_blank' size='medium' className={classes.resultButton}>
                View PR on GitHub
              </Button>
            </div>
            <BackToCodeGen onClick={backToSelection} />
          </>
        ) : (
          <>
            <div className={classes.openResult}>
              <LivePreviewButton url={`https://${sandboxId}.csb.app/`} />
              <EditCodeButton url={`https://codesandbox.io/s/${sandboxId}`} />
            </div>
            <BackToCodeGen onClick={backToSelection} />
          </>
        ))}
    </div>
  );
});
