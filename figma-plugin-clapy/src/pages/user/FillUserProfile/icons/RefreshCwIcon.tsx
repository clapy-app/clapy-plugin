import type { SVGProps } from 'react';
import { memo } from 'react';

const RefreshCwIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <path
      d='M19.1668 3.33331V8.33332M19.1668 8.33332H14.1668M19.1668 8.33332L15.3002 4.69998C14.4045 3.80391 13.2965 3.14932 12.0795 2.79729C10.8625 2.44527 9.57608 2.40727 8.3404 2.68686C7.10472 2.96645 5.96 3.55451 5.01305 4.39616C4.06611 5.23782 3.3478 6.30564 2.92516 7.49998M0.833496 16.6666V11.6666M0.833496 11.6666H5.8335M0.833496 11.6666L4.70016 15.3C5.59579 16.1961 6.70381 16.8506 7.92084 17.2027C9.13787 17.5547 10.4242 17.5927 11.6599 17.3131C12.8956 17.0335 14.0403 16.4455 14.9873 15.6038C15.9342 14.7621 16.6525 13.6943 17.0752 12.5'
      stroke='currentColor'
      strokeWidth={1.66667}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const Memo = memo(RefreshCwIcon);
export { Memo as RefreshCwIcon };
