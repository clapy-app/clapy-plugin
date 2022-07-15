import type { FC } from 'react';
import { memo, useEffect, useState } from 'react';

import { FigmaToCodeHome } from '../2-export-code/FigmaToCodeHome/FigmaToCodeHome';
import { fetchPluginNoResponse, subscribePlugin } from '../../common/plugin-utils';
import { env } from '../../environment/env';
import classes from './Generator.module.css';

export const Generator: FC = () => {
  return <LayoutInner />;
};

export const LayoutInner: FC = memo(function LayoutInner() {
  // const [activeTab, setActiveTab] = useState(0);
  const [selectionPreview, setSelectionPreview] = useState<string | false | undefined>();

  // Show selection
  useEffect(() => {
    const dispose = subscribePlugin('selectionPreview', (_, prev) => {
      setSelectionPreview(prev ? `data:image/jpeg;base64,${prev}` : prev);
    });
    if (env.isDev) {
      fetchPluginNoResponse('getSelectionPreview');
    }
    return dispose;
  }, []);
  return (
    <>
      <div className={classes.content}>
        <FigmaToCodeHome selectionPreview={selectionPreview} />
      </div>
    </>
  );
});
