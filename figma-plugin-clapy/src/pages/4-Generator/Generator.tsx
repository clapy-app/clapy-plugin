import type { FC } from 'react';
import { memo } from 'react';

import { FigmaToCodeHome } from '../2-export-code/FigmaToCodeHome/FigmaToCodeHome';
import classes from './Generator.module.css';
import { PluginComponentCounter_License } from './quotaBar/PluginComponentCounter_License/PluginComponentCounter_License';

export const Generator: FC = () => {
  return <LayoutInner />;
};

export const LayoutInner: FC = memo(function LayoutInner() {
  return (
    <>
      <div className={classes.content}>
        <PluginComponentCounter_License />
        <FigmaToCodeHome />
      </div>
    </>
  );
});
