import { memo } from 'react';
import type { FC } from 'react';

import { handleError } from '../../../common/error-utils.js';
import { useCallbackAsync2 } from '../../../common/front-utils.js';
import { upgradeUser } from '../../../common/stripeLicense.js';
import { checkSessionComplete } from '../../../core/auth/auth-service.js';
import { dispatchOther } from '../../../core/redux/redux.utils.js';
import { env } from '../../../environment/env.js';
import { setStripeData } from '../../user/user-slice.js';
import { showPaymentConfirmation, startLoadingStripe, stopLoadingStripe } from '../stripe-slice.js';
import { _3Layers } from './components/_3Layers/_3Layers';
import { _3LayersIcon } from './components/_3LayersIcon';
import { _PricingTierCard_TypeIconBreak } from './components/_PricingTierCard_TypeIconBreak/_PricingTierCard_TypeIconBreak';
import { Book } from './components/Book/Book';
import { BookIcon } from './components/BookIcon';
import { Checkbox_CheckedFalseIndetermi } from './components/Checkbox_CheckedFalseIndetermi/Checkbox_CheckedFalseIndetermi';
import { Code } from './components/Code/Code';
import { CodeIcon } from './components/CodeIcon';
import { Codesandbox } from './components/Codesandbox/Codesandbox';
import { CodesandboxIcon } from './components/CodesandboxIcon';
import { DiscordFill } from './components/DiscordFill/DiscordFill';
import { DiscordLogoSvgIcon } from './components/DiscordLogoSvgIcon';
import { Download } from './components/Download/Download';
import { DownloadIcon } from './components/DownloadIcon';
import { Github } from './components/Github/Github';
import { GithubIcon } from './components/GithubIcon';
import { Link } from './components/Link/Link';
import { LinkIcon } from './components/LinkIcon';
import { PluginPageHeadline } from './components/PluginPageHeadline/PluginPageHeadline';
import { Rocket } from './components/Rocket/Rocket';
import { RocketIcon } from './components/RocketIcon';
import { Share2 } from './components/Share2/Share2';
import { Share2Icon } from './components/Share2Icon';
import { Upload } from './components/Upload/Upload';
import { UploadIcon } from './components/UploadIcon';
import { Users } from './components/Users/Users';
import { UsersIcon } from './components/UsersIcon';
import { Zap } from './components/Zap/Zap';
import { ZapIcon } from './components/ZapIcon';
import classes from './Pricing.module.css';

interface Props {
  className?: string;
}

interface ApiResponse {
  ok: boolean;
  quotas?: number;
  isLicenceExpired?: boolean;
}

/* @figmaId 2089:147603 */
export const Pricing: FC<Props> = memo(function Pricing(props = {}) {
  const userUpgrade = useCallbackAsync2(async () => {
    dispatchOther(startLoadingStripe());
    const eventSource = new EventSource(`${env.apiBaseUrl}/stripe/sse`);
    eventSource.onmessage = async e => {
      let data = JSON.parse(e.data);
      if (data.status) {
        try {
          const res = (await checkSessionComplete()) as ApiResponse;
          if (res.quotas != null || !res.isLicenceExpired) {
            dispatchOther(setStripeData(res));
          }
        } catch (e) {
          handleError(e);
        } finally {
          dispatchOther(showPaymentConfirmation());
          dispatchOther(stopLoadingStripe());
        }
      }
      eventSource.close();
    };
    await upgradeUser();
  }, []);
  return (
    <div className={classes.root}>
      <PluginPageHeadline
        text={{
          pageTitle: <div className={classes.pageTitle}>Pricing</div>,
          loremIpsumDolorSitAmetConsecte: (
            <div className={classes.loremIpsumDolorSitAmetConsecte}>
              Deliver webapps faster with the advanced features included in our pro and enterprise plans.
            </div>
          ),
        }}
      />
      <div className={classes.frame133}>
        <div className={classes._PricingTierCard3}>
          <div className={classes.header3}>
            <div className={classes.headingAndPrice2}>
              <div className={classes.headingAndIcon}>
                <div className={classes.heading3}>Starter</div>
              </div>
              <div className={classes.price3}>Free</div>
              <div className={classes.supportingText2}>Everything to get started</div>
            </div>
          </div>
          <div className={classes.content3}>
            <div className={classes.checkItems3}>
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox}
                swap={{
                  checkbox: (
                    <_3Layers
                      className={classes._3Layers}
                      swap={{
                        icon: <_3LayersIcon className={classes.icon} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text}>3 exports per month</div>,
                }}
              />
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox2}
                swap={{
                  checkbox: (
                    <Code
                      className={classes.code}
                      swap={{
                        icon: <CodeIcon className={classes.icon2} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text2}>React, Angular + 3 CSS formats</div>,
                }}
              />
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <Codesandbox
                      className={classes.codesandbox}
                      swap={{
                        icon: <CodesandboxIcon className={classes.icon3} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text3}>Codesandbox preview</div>,
                }}
              />
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <Download
                      className={classes.download}
                      swap={{
                        icon: <DownloadIcon className={classes.icon4} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text4}>Zip download</div>,
                }}
              />
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <DiscordFill
                      className={classes.discordFill}
                      swap={{
                        discordLogoSvg: <DiscordLogoSvgIcon className={classes.icon5} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text5}>Community support</div>,
                }}
              />
            </div>
          </div>
        </div>
        <_PricingTierCard_TypeIconBreak
          className={classes._PricingTierCard}
          classes={{
            header: classes.header,
            checkItems: classes.checkItems,
            content: classes.content,
            footer: classes.footer,
          }}
          swap={{
            checkItemText: (
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox3}
                swap={{
                  checkbox: (
                    <Rocket
                      className={classes.rocket}
                      swap={{
                        icon: <RocketIcon className={classes.icon6} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text7}>Unlimited code exports</div>,
                }}
              />
            ),
            checkItemText2: (
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <Github
                      className={classes.github}
                      swap={{
                        icon: <GithubIcon className={classes.icon7} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text8}>Github integration</div>,
                }}
              />
            ),
            checkItemText3: (
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <Book
                      className={classes.book}
                      swap={{
                        icon: <BookIcon className={classes.icon8} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text9}>Storybook integration</div>,
                }}
              />
            ),
            checkItemText4: (
              <Checkbox_CheckedFalseIndetermi
                swap={{
                  checkbox: (
                    <Zap
                      className={classes.zap}
                      swap={{
                        icon: <ZapIcon className={classes.icon9} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text10}>Priority support</div>,
                }}
              />
            ),
          }}
          hide={{
            checkIcon: true,
          }}
          text={{
            heading: <div className={classes.heading}>Professional</div>,
            price: <div className={classes.price}>$99/month</div>,
            supportingText: <div className={classes.supportingText}>Billed monthly</div>,
            text: <div className={classes.text6}>Everything in Free plan, plus:</div>,
            text2: <div className={classes.text11}>Upgrade now</div>,
          }}
          callback={userUpgrade}
        />
        <_PricingTierCard_TypeIconBreak
          className={classes._PricingTierCard2}
          classes={{
            headingAndPrice: classes.headingAndPrice,
            header: classes.header2,
            checkItems: classes.checkItems2,
            content: classes.content2,
            footer: classes.footer2,
          }}
          swap={{
            checkItemText: (
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox4}
                swap={{
                  checkbox: (
                    <Users
                      className={classes.users}
                      swap={{
                        icon: <UsersIcon className={classes.icon10} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text13}>Teams &amp; Roles management</div>,
                }}
              />
            ),
            checkItemText2: (
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox5}
                swap={{
                  checkbox: (
                    <Share2
                      className={classes.share2}
                      swap={{
                        icon: <Share2Icon className={classes.icon11} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text14}>Design Systems workflows</div>,
                }}
              />
            ),
            checkItemText3: (
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox6}
                swap={{
                  checkbox: (
                    <Upload
                      className={classes.upload}
                      swap={{
                        icon: <UploadIcon className={classes.icon12} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text15}>Mapping with existing code</div>,
                }}
              />
            ),
            checkItemText4: (
              <Checkbox_CheckedFalseIndetermi
                className={classes.checkbox7}
                swap={{
                  checkbox: (
                    <Link
                      className={classes.link}
                      swap={{
                        icon: <LinkIcon className={classes.icon13} />,
                      }}
                    />
                  ),
                }}
                text={{
                  text: <div className={classes.text16}>Advanced integrations</div>,
                }}
              />
            ),
          }}
          hide={{
            supportingText: true,
            checkIcon: true,
          }}
          text={{
            heading: <div className={classes.heading2}>Enterprise</div>,
            price: <div className={classes.price2}>Custom</div>,
            text: <div className={classes.text12}>Everything in Pro plan, plus:</div>,
            text2: <div className={classes.text17}>Schedule a call</div>,
          }}
          href='https://bit.ly/clapy-product-tour'
        />
      </div>
    </div>
  );
});
