import { FC, memo } from 'react';
import { ErrorCompProps } from '../../2-export-code/4-ExportCode';
import classes from '../1-ImportSb.module.scss';

export const ErrorComp: FC<ErrorCompProps> = memo(function ErrorComp({ error }) {
  if (!error) return null;
  if (error === 'Interrupted') {
    return (
      <div>
        <em>{error}</em>
      </div>
    );
  }
  let errorStr = error?.stack || JSON.stringify(error, Object.getOwnPropertyNames(error));
  if (error?.nodeName) {
    errorStr = `${error.nodeName}\n${errorStr}`;
  }
  // Mail link generated with https://mailtolink.me/
  const emailLink =
    `mailto:support@clapy.co?subject=Reporting%20an%20error%20I%20faced%20using%20Clapy&body=Hi%20Clapy%20team%2C%0D%0A%0D%0AI%20faced%20the%20following%20error%20while%20using%20the%20Clapy.%0D%0A%0D%0AHere%20are%20the%20steps%20to%20reproduce%3A%0D%0A%0D%0A-%20XXX%0D%0A-%20XXX%0D%0A%0D%0AThe%20error%3A%0D%0A%0D%0A${encodeURIComponent(
      errorStr,
    )}`.substring(0, 1800);
  return (
    <div className={classes.errorWrapper}>
      <p>
        Oops, something went wrong! Please contact us.{' '}
        <a href={emailLink} target='_blank' rel='noopener noreferrer'>
          Here is an email prefilled with the error message below
        </a>
        .
      </p>
      <p className={classes.errorWrapper2}>
        <em>{error?.message || errorStr}</em>
      </p>
      <hr />
    </div>
  );
});
