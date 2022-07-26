import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { FC } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { track } from '../../../common/analytics';
import type { ExtractionProgress } from '../../../common/app-models.js';
import { handleError } from '../../../common/error-utils';
import { useCallbackAsync2 } from '../../../common/front-utils';
import { getDuration } from '../../../common/general-utils';
import { apiGet, apiPost } from '../../../common/http.utils.js';
import { perfMeasure, perfReset } from '../../../common/perf-front-utils.js';
import type { Disposer } from '../../../common/plugin-utils';
import { fetchPlugin, subscribePlugin } from '../../../common/plugin-utils';
import type { CSBResponse, ExportCodePayload, ExportImageMap2 } from '../../../common/sb-serialize.model.js';
import { Button } from '../../../components-used/Button/Button';
import { selectIsAlphaDTCUser } from '../../../core/auth/auth-slice';
import { dispatchOther } from '../../../core/redux/redux.utils.js';
import { env } from '../../../environment/env.js';
import { setQuota } from '../../user/user-slice.js';
import { uploadAssetFromUintArrayRaw } from '../cloudinary.js';
import { downloadFile } from '../export-code-utils.js';
import { BackToCodeGen } from './BackToCodeGen/BackToCodeGen';
import { EditCodeButton } from './EditCodeButton/EditCodeButton';
import classes from './FigmaToCodeHome.module.css';
import { LivePreviewButton } from './LivePreviewButton/LivePreviewButton';
import { SelectionPreview } from './SelectionPreview/SelectionPreview';

// Flag for development only. Will be ignored in production.
// To disable sending to codesandbox, open the API controller and change the default of uploadToCsb
// backend-clapy/src/features/export-code/1-code-controller.ts
const sendToApi = true;

export type MyStates = 'loading' | 'noselection' | 'selectionko' | 'selection' | 'generated';

interface Props {
  selectionPreview: string | false | undefined;
}

interface AdvancedOptions {
  zip?: boolean;
  scss?: boolean;
}

export const FigmaToCodeHome: FC<Props> = memo(function FigmaToCodeHome(props) {
  const { selectionPreview } = props;
  const [sandboxId, setSandboxId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExtractionProgress | undefined>();
  const isAlphaDTCUser = useSelector(selectIsAlphaDTCUser);

  const state: MyStates = isLoading
    ? 'loading'
    : sandboxId
    ? 'generated'
    : selectionPreview
    ? 'selection'
    : selectionPreview === false
    ? 'selectionko'
    : 'noselection';

  const advancedOptionsRef = useRef<AdvancedOptions>({});

  const updateAdvancedOption = useCallback((event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (!event.target.name) {
      handleError(
        new Error('BUG advanced option input must have the name of the corresponding option as `name` attribute.'),
      );
      return;
    }
    advancedOptionsRef.current[event.target.name as keyof AdvancedOptions] = checked;
  }, []);

  const generateCode = useCallbackAsync2(async () => {
    const timer = performance.now();
    let unsubscribe: Disposer | undefined;
    try {
      setIsLoading(true);
      setSandboxId('loading');
      track('gen-code', 'start');
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
      const { extraConfig, parent, root, components, nodeIdsToExtractAsSVG, imageHashesToExtract, styles, tokens } =
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
        const { zip, ...userSettings } = advancedOptionsRef.current;
        const nodes: ExportCodePayload = {
          parent,
          root,
          components,
          svgs,
          images,
          styles,
          extraConfig: {
            ...extraConfig,
            enableMUIFramework: isAlphaDTCUser,
            output: zip ? 'zip' : 'csb',
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
          const { data } = await apiPost<CSBResponse>('code/export', nodes);
          if (!data.quotas) {
            const { data } = await apiGet('stripe/getUserQuota');
            console.log(data);
            dispatchOther(setQuota(data));
          } else {
            dispatchOther(setQuota(data));
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
  }, [isAlphaDTCUser]);

  const backToSelection = useCallback(() => {
    setSandboxId(undefined);
  }, []);

  return (
    <>
      <div className={classes.previewTitle}>
        {state === 'noselection' && (
          <>
            Choose the element <br />
            you need to code
          </>
        )}
        {(state === 'selection' || state === 'selectionko') && <>Ready to code</>}
        {isLoading && <>Your code is loading...</>}
        {state === 'generated' && <>And... it’s done!</>}
      </div>
      <SelectionPreview state={state} selectionPreview={selectionPreview} progress={progress} />
      {state !== 'generated' && (
        <>
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
                <Tooltip
                  title='If enabled, the code is downloaded as zip file instead of being sent to CodeSandbox for preview.'
                  disableInteractive
                >
                  <FormControlLabel
                    control={
                      <Switch
                        name='zip'
                        onChange={updateAdvancedOption}
                        defaultChecked={advancedOptionsRef.current.zip}
                      />
                    }
                    label='Download as zip'
                    disabled={isLoading}
                  />
                </Tooltip>
                <Tooltip title='If enabled, styles will be written in .scss files instead of .css.' disableInteractive>
                  <FormControlLabel
                    control={
                      <Switch
                        name='scss'
                        onChange={updateAdvancedOption}
                        defaultChecked={advancedOptionsRef.current.scss}
                      />
                    }
                    label='SCSS instead of CSS (beta)'
                    disabled={isLoading}
                  />
                </Tooltip>
              </FormGroup>
            </AccordionDetails>
          </Accordion>
          <Button onClick={generateCode} disabled={state === 'loading' || state === 'noselection'} loading={isLoading}>
            &lt; Generate code &gt;
          </Button>
        </>
      )}
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
