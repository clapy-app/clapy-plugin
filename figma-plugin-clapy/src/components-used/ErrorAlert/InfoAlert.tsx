import alertClasses from './NewUpdateAlert.module.css';
import { toast } from 'react-toastify';
import { fetchPluginNoResponse } from '../../common/plugin-utils.js';
import { ErrorAlert2, ErrorAlertButtons } from './ErrorAlert.js';

export function InfoAlert() {
  toast(
    <ErrorAlert2 isInfo={true} infoText={'Professional plans are here'}>
      <p className={alertClasses.textWrapper}>
        After months of Beta, we are launching Pro plans for{' '}
        <span className={alertClasses.label2}>priority support</span>, early access to{' '}
        <span className={alertClasses.label2}>new features</span>, and{' '}
        <span className={alertClasses.label2}>unlimited</span> code exports. Free plan includes monthly credits.
      </p>
    </ErrorAlert2>,
    {
      className: `${alertClasses.root}`,
      closeButton: ({ closeToast }) => (
        <ErrorAlertButtons
          isInfo={true}
          closeToast={e => {
            closeToast(e);
            fetchPluginNoResponse('setCachedIsFirstLogin');
          }}
          emailLink={'#'}
        />
      ),
    },
  );
}
