import { memo } from 'react';
import type { FC, ReactNode } from 'react';

import { Button_SizeXlHierarchyPrimaryI } from '../Button_SizeXlHierarchyPrimaryI/Button_SizeXlHierarchyPrimaryI';
import { Button_SizeXlHierarchySecondar } from '../Button_SizeXlHierarchySecondar/Button_SizeXlHierarchySecondar';
import { CheckItemText_SizeSmColorPrima } from '../CheckItemText_SizeSmColorPrima/CheckItemText_SizeSmColorPrima';
import classes from './_PricingTierCard_TypeIconBreak.module.css';

interface Props {
  className?: string;
  classes?: {
    header?: string;
    checkItems?: string;
    content?: string;
    footer?: string;
    root?: string;
    headingAndPrice?: string;
  };
  swap?: {
    checkItemText?: ReactNode;
    checkItemText2?: ReactNode;
    checkItemText3?: ReactNode;
    checkItemText4?: ReactNode;
  };
  hide?: {
    checkItemText?: boolean;
    checkItemText2?: boolean;
    checkItemText3?: boolean;
    checkItemText4?: boolean;
    checkItemText5?: boolean;
    button?: boolean;
    checkIcon?: boolean;
    supportingText?: boolean;
  };
  text?: {
    heading?: ReactNode;
    price?: ReactNode;
    supportingText?: ReactNode;
    text?: ReactNode;
    text2?: ReactNode;
  };
  href?: string;
  callback?: () => Promise<void>;
}
/* @figmaId 666:98815 */
export const _PricingTierCard_TypeIconBreak: FC<Props> = memo(function _PricingTierCard_TypeIconBreak(props = {}) {
  return (
    <div className={`${classes.root} ${props.classes?.root || ''} ${props.className || ''}`}>
      <div className={`${classes.header} ${props.classes?.header || ''}`}>
        <div className={`${classes.headingAndPrice} ${props.classes?.headingAndPrice || ''}`}>
          <div className={classes.headingAndIcon}>
            {props.text?.heading != null ? props.text?.heading : <div className={classes.heading}>Basic plan</div>}
          </div>
          {props.text?.price != null ? props.text?.price : <div className={classes.price}>$10/mth</div>}
          {!props.hide?.supportingText &&
            (props.text?.supportingText != null ? (
              props.text?.supportingText
            ) : (
              <div className={classes.supportingText}>Our most popular plan.</div>
            ))}
        </div>
      </div>
      <div className={`${classes.content} ${props.classes?.content || ''}`}>
        <div className={`${classes.checkItems} ${props.classes?.checkItems || ''}`}>
          <CheckItemText_SizeSmColorPrima
            hide={{
              checkIcon: props.hide?.checkIcon,
            }}
            text={{
              text: props.text?.text || <div className={classes.text}>Access to all basic features</div>,
            }}
          />
          {props.swap?.checkItemText || (
            <CheckItemText_SizeSmColorPrima
              text={{
                text: <div className={classes.text2}>Basic reporting and analytics</div>,
              }}
            />
          )}
          {props.swap?.checkItemText2 || (
            <CheckItemText_SizeSmColorPrima
              text={{
                text: <div className={classes.text3}>Up to 10 individual users</div>,
              }}
            />
          )}
          {props.swap?.checkItemText3 || (
            <CheckItemText_SizeSmColorPrima
              text={{
                text: <div className={classes.text4}>20GB individual data each user</div>,
              }}
            />
          )}
          {props.swap?.checkItemText4 || (
            <CheckItemText_SizeSmColorPrima
              text={{
                text: <div className={classes.text5}>Basic chat and email support</div>,
              }}
            />
          )}
          {props.hide?.checkItemText === false && <CheckItemText_SizeSmColorPrima />}
          {props.hide?.checkItemText2 === false && <CheckItemText_SizeSmColorPrima />}
          {props.hide?.checkItemText3 === false && <CheckItemText_SizeSmColorPrima />}
          {props.hide?.checkItemText4 === false && <CheckItemText_SizeSmColorPrima />}
          {props.hide?.checkItemText5 === false && <CheckItemText_SizeSmColorPrima />}
        </div>
      </div>
      <div className={`${classes.footer} ${props.classes?.footer || ''}`}>
        <div className={classes.actions}>
          <Button_SizeXlHierarchyPrimaryI
            className={classes.button}
            classes={{ _ButtonBase: classes._ButtonBase }}
            href={props.href || undefined}
            callback={props.callback || undefined}
            text={{
              text: props.text?.text2 || <div className={classes.text6}>Get started</div>,
            }}
          />
          {props.hide?.button === false && <Button_SizeXlHierarchySecondar />}
        </div>
      </div>
    </div>
  );
});
