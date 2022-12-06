import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { FigmaToCodeHome } from '../2-export-code/FigmaToCodeHome/FigmaToCodeHome';
import { selectIsQuotaDisabled } from '../user/user-slice.js';
import classes from './Generator.module.css';
import { PluginComponentCounter_License } from './quotaBar/PluginComponentCounter_License/PluginComponentCounter_License.js';

export const Generator: FC = () => {
  return <GeneratorInner />;
};

export const GeneratorInner: FC = memo(function GeneratorInner() {
  const quotaDisabled = useSelector(selectIsQuotaDisabled);
  return (
    <>
      <div className={classes.content}>
        {!quotaDisabled && <PluginComponentCounter_License />}
        <FigmaToCodeHome />
      </div>
    </>
  );
});
