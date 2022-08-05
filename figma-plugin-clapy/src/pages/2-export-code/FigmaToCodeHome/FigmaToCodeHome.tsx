import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Radio from '@mui/material/Radio';
import type { RadioGroupProps } from '@mui/material/RadioGroup';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { Button_SizeSmHierarchyLinkColo2 } from '../../4-Generator/quotaBar/Button_SizeSmHierarchyLinkColo2/Button_SizeSmHierarchyLinkColo2.js';
import { Button_SizeSmHierarchyLinkColo } from '../../4-Generator/quotaBar/Button_SizeSmHierarchyLinkColo/Button_SizeSmHierarchyLinkColo.js';
import { track } from '../../../common/analytics';
import type { ExtractionProgress, UserMetadata } from '../../../common/app-models.js';
import { handleError } from '../../../common/error-utils';
import { useCallbackAsync2 } from '../../../common/front-utils';
import { getDuration } from '../../../common/general-utils';
import { apiGet, apiPost } from '../../../common/http.utils.js';
import { perfMeasure, perfReset } from '../../../common/perf-front-utils.js';
import type { Disposer } from '../../../common/plugin-utils';
import { fetchPlugin, subscribePlugin } from '../../../common/plugin-utils';
import type {
  CSBResponse,
  ExportCodePayload,
  ExportImageMap2,
  UserSettings,
} from '../../../common/sb-serialize.model.js';
import { UserSettingsTarget } from '../../../common/sb-serialize.model.js';
import { Button } from '../../../components-used/Button/Button';
import { Loading } from '../../../components-used/Loading/Loading.js';
import { selectGithubEnabled, selectIsAlphaDTCUser, selectNoCodesandboxUser } from '../../../core/auth/auth-slice';
import { dispatchOther } from '../../../core/redux/redux.utils.js';
import { env } from '../../../environment/env.js';
import { selectIsUserMaxQuotaReached, selectUserMetadata, setStripeData } from '../../user/user-slice.js';
import { uploadAssetFromUintArrayRaw } from '../cloudinary.js';
import { downloadFile } from '../export-code-utils.js';
import { BackToCodeGen } from './BackToCodeGen/BackToCodeGen';
import { EditCodeButton } from './EditCodeButton/EditCodeButton';
import type { UserSettingsKeys, UserSettingsValues } from './figmaToCode-model.js';
import classes from './FigmaToCodeHome.module.css';
import { GithubOption } from './GithubOption.js';
import { LivePreviewButton } from './LivePreviewButton/LivePreviewButton';
import { LockIcon } from './lockIcon/lock.js';
import { SelectionPreview } from './SelectionPreview/SelectionPreview';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selectionko' | 'selection' | 'generated';

interface Props {
  selectionPreview: string | false | undefined;
}

let defaultSettings: UserSettings = {
  // framework: 'angular',
  framework: 'react',
  target: UserSettingsTarget.csb,
  // scss: env.isDev,
  // bem: env.isDev,
};

const userSettings = { ...defaultSettings };

export const FigmaToCodeHome: FC<Props> = memo(function FigmaToCodeHome(props) {
  const { selectionPreview } = props;
  const [sandboxId, setSandboxId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExtractionProgress | undefined>();
  const [scssSelected, setScssSelected] = useState<boolean>(!!defaultSettings.scss);
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);
  const isQuotaReached = useSelector(selectIsUserMaxQuotaReached);
  const isNoCodeSandboxUser = useSelector(selectNoCodesandboxUser);
  const { picture } = useSelector(selectUserMetadata);
  const isGithubEnabled = useSelector(selectGithubEnabled);

  useEffect(
    () => () => {
      // When the component is unloaded (e.g. navigate to another view), the user settings are backed up in the defaultSettings object.
      // When the component will be re-mounted, those default settings will be used to pre-fill the form inputs (using the default value attributes).
      defaultSettings = { ...userSettings };
    },
    [],
  );

  const state: MyStates = isLoading
    ? 'loading'
    : sandboxId
    ? 'generated'
    : selectionPreview
    ? 'selection'
    : selectionPreview === false
    ? 'selectionko'
    : 'noselection';

  const updateAdvancedOption = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, checked: UserSettingsValues) => {
      if (!event.target.name) {
        handleError(
          new Error('BUG advanced option input must have the name of the corresponding option as `name` attribute.'),
        );
        return;
      }
      (userSettings as any)[event.target.name as UserSettingsKeys] = checked;

      // Specific state updates for the UI
      if (event.target.name === 'scss') {
        setScssSelected(checked as boolean);
      }
    },
    [],
  );

  const generateCode = useCallbackAsync2(async () => {
    const timer = performance.now();
    let unsubscribe: Disposer | undefined;
    try {
      setIsLoading(true);
      setSandboxId('loading');
      track('gen-code', 'start', userSettings);
      perfReset();

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
      const { extraConfig, root, components, nodeIdsToExtractAsSVG, imageHashesToExtract, styles, tokens } =
        await fetchPlugin('serializeSelectedNode');
      unsubscribe?.();
      perfMeasure(`Figma configuration extracted in`);

      setProgress({ stepId: 'extractSVGs', stepNumber: 5 });
      const svgs = await fetchPlugin('extractSVGs', nodeIdsToExtractAsSVG);
      perfMeasure(`SVGs extracted in`);

      setProgress({ stepId: 'extractImages', stepNumber: 6 });
      const imagesExtracted = await fetchPlugin('extractImages', imageHashesToExtract);
      perfMeasure(`Images extracted in`);

      if (components && styles && imagesExtracted) {
        const images: ExportImageMap2 = {};
        const nodes: ExportCodePayload = {
          root,
          components,
          svgs,
          images,
          styles,
          extraConfig: {
            ...extraConfig,
            enableMUIFramework: isAlphaDTCUser,
            // output: to remove later. It's defined in the webservice.
            output: userSettings.zip || isNoCodeSandboxUser ? 'zip' : 'csb',
            ...userSettings,
          },
          tokens,
        };

        // Upload assets to a CDN before generating the code
        const imagesEntries = Object.entries(imagesExtracted);
        let i = 0;
        for (const [imageHash, imageFigmaEntry] of imagesEntries) {
          setProgress({ stepId: 'uploadAsset', stepNumber: 7, nodeName: `Asset ${++i} / ${imagesEntries.length}` });
          const { bytes, ...imageEntryRest } = imageFigmaEntry;
          // If required, I can upload to CDN here. Figma can provide the image hash and the URL.
          // const assetUrl = await uploadAsset(fileAsUint8ArrayRaw);

          // Replace Figma asset URL with our own CDN. Benefits:
          // - Avoid CORS issue in codesandbox when exporting the project as zip
          // - Allows image compression if useful later, instead of keeping the original HD image.
          let url = await uploadAssetFromUintArrayRaw(Uint8Array.from(bytes), imageHash);
          if (!url) {
            handleError(`BUG Failed to upload the image with hash ${imageHash} on the CDN.`);
          } else {
            images[imageHash] = { ...imageEntryRest, url };
          }
          perfMeasure(`Image uploaded`);
        }

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
          setProgress({ stepId: 'generateCode', stepNumber: 8 });

          // /!\ this `if` block is necessary for users with role "noCodesandbox". Don't modify unless you know what you are doing.
          if (isNoCodeSandboxUser) {
            nodes.extraConfig.zip = true;
            nodes.extraConfig.output = 'zip';
          }

          const { data } = await apiPost<CSBResponse>('code/export', nodes);
          if (!data.quotas) {
            const { data } = await apiGet<UserMetadata>('stripe/get-user-quota');
            dispatchOther(setStripeData(data));
          } else {
            dispatchOther(setStripeData(data));
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
      setProgress(undefined);
    }
  }, [isAlphaDTCUser, isNoCodeSandboxUser]);

  const backToSelection = useCallback(() => {
    setSandboxId(undefined);
  }, []);

  return (
    <>
      <div className={classes.previewTitle}>
        {state === 'noselection' && <>Choose an element to code</>}
        {(state === 'selection' || state === 'selectionko') && <>Ready to code</>}
        {isLoading && <>Your code is loading...</>}
        {state === 'generated' && <>And... it’s done!</>}
      </div>
      <SelectionPreview state={state} selectionPreview={selectionPreview} progress={progress} />
      {!isQuotaReached && typeof picture !== 'undefined' && (
        <>
          <Tooltip
            title='If enabled, the selected element will be stretched to use all width and height available, even if "Fill container" is not set. Useful for top-level frames that are pages.'
            disableInteractive
            placement='bottom-start'
            className={state === 'generated' ? classes.hide : undefined}
          >
            <FormControl disabled={isLoading} className={classes.outerOption}>
              <FormControlLabel
                control={<Switch name='page' onChange={updateAdvancedOption} defaultChecked={!!defaultSettings.page} />}
                label='Full width/height (for pages)'
                disabled={isLoading}
              />
            </FormControl>
          </Tooltip>
          <GithubOption
            className={state === 'generated' ? classes.hide : undefined}
            isLoading={isLoading}
            defaultSettings={defaultSettings}
            updateAdvancedOption={updateAdvancedOption}
          />
          <Accordion
            classes={{ root: classes.accordionRoot }}
            className={state === 'generated' ? classes.hide : undefined}
          >
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
                <Tooltip title='Framework' disableInteractive placement='bottom-start'>
                  <FormControl disabled={isLoading}>
                    <RadioGroup
                      row
                      name='framework'
                      onChange={updateAdvancedOption as RadioGroupProps['onChange']}
                      defaultValue={defaultSettings.framework}
                    >
                      <FormControlLabel value='react' control={<Radio />} label='React' />
                      <FormControlLabel value='angular' control={<Radio />} label='Angular (alpha)' />
                    </RadioGroup>
                  </FormControl>
                </Tooltip>
                {!isGithubEnabled && (
                  <Tooltip
                    title={
                      isNoCodeSandboxUser
                        ? 'The code is downloaded as zip file instead of being sent to CodeSandbox for preview. This option is enforced for your account as a security measure.'
                        : 'If enabled, the code is downloaded as zip file instead of being sent to CodeSandbox for preview. This is the best option for confidentiality.'
                    }
                    disableInteractive
                    placement='bottom-start'
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          name='zip'
                          onChange={updateAdvancedOption}
                          defaultChecked={!!defaultSettings.zip || isNoCodeSandboxUser}
                        />
                      }
                      label='Download as zip'
                      disabled={isLoading || isNoCodeSandboxUser}
                    />
                  </Tooltip>
                )}
                <Tooltip
                  title='If enabled, styles will be written in .scss files instead of .css.'
                  disableInteractive
                  placement='bottom-start'
                >
                  <FormControlLabel
                    control={
                      <Switch name='scss' onChange={updateAdvancedOption} defaultChecked={!!defaultSettings.scss} />
                    }
                    label='SCSS instead of CSS (beta)'
                    disabled={isLoading}
                  />
                </Tooltip>
                {scssSelected && (
                  <Tooltip
                    title='If enabled, the generated SCSS is a tree of classes following the BEM convention instead of top-level classes only. CSS modules make most of BEM obsolete, but it is useful for legacy projects.'
                    disableInteractive
                    placement='bottom-start'
                  >
                    <FormControlLabel
                      control={
                        <Switch name='bem' onChange={updateAdvancedOption} defaultChecked={!!defaultSettings.bem} />
                      }
                      label='Indent classes with BEM convention'
                      disabled={isLoading}
                    />
                  </Tooltip>
                )}
                {env.isDev && (
                  <Tooltip
                    title={`If enabled, style resets like \`display: flex\` are declared once in a global ${
                      scssSelected ? 'S' : ''
                    }CSS file instead of once per component. Enable to reduce duplicate styles, if you make sure you use the whole project generated by Clapy, or include the ${
                      scssSelected ? 'S' : ''
                    }CSS resets required by Clapy in your project.`}
                    disableInteractive
                    placement='bottom-start'
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          name='globalResets'
                          onChange={updateAdvancedOption}
                          defaultChecked={!!defaultSettings.globalResets}
                        />
                      }
                      label={`Global ${scssSelected ? 'S' : ''}CSS resets`}
                      disabled={isLoading}
                    />
                  </Tooltip>
                )}
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
          disabled={state === 'loading' || state === 'noselection' || isQuotaReached}
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
      {state === 'generated' && (
        <>
          <div className={classes.openResult}>
            <LivePreviewButton url={`https://${sandboxId}.csb.app/`} />
            <EditCodeButton url={`https://codesandbox.io/s/${sandboxId}`} />
          </div>
          <BackToCodeGen onClick={backToSelection} />
        </>
      )}
    </>
  );
});
