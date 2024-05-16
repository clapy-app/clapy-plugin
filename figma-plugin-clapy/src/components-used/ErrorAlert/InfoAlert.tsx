export {};
// import alertClasses from './NewUpdateAlert.module.css';
// import { toast } from 'react-toastify';
// import { fetchPluginNoResponse } from '../../common/plugin-utils.js';
// import { Alert, ErrorAlertButtons as AlertButtons } from './ErrorAlert.js';
//
// export function InfoAlert() {
//   toast(
//     <Alert isInfo={true} infoText={'Professional plans are here'}>
//       <p className={alertClasses.textWrapper}>
//         After months of Beta, we are launching Pro plans for{' '}
//         <span className={alertClasses.label2}>priority support</span>, early access to{' '}
//         <span className={alertClasses.label2}>new features</span>, and{' '}
//         <span className={alertClasses.label2}>unlimited</span> code exports. Free plan includes monthly credits.
//       </p>
//     </Alert>,
//     {
//       className: `${alertClasses.root}`,
//       closeButton: ({ closeToast }) => (
//         <AlertButtons
//           isInfo={true}
//           closeToast={e => {
//             closeToast(e);
//             fetchPluginNoResponse('setCachedIsFirstLogin');
//           }}
//           emailLink={'https://blog.clapy.co/professional-plans-are-here'}
//         />
//       ),
//     },
//   );
// }
