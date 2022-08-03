import { memo } from 'react';
import type { FC } from 'react';

import { Button_SizeXlHierarchyPrimaryI } from './components/Button_SizeXlHierarchyPrimaryI/Button_SizeXlHierarchyPrimaryI';
import { MessageCircle } from './components/MessageCircle/MessageCircle';
import { MessageCircleIcon } from './components/MessageCircleIcon';
import { PluginPageHeadline } from './components/PluginPageHeadline/PluginPageHeadline';
import classes from './Feedback.module.css';

interface Props {
  className?: string;
}
/* @figmaId 2027:134665 */
export const Feedback: FC<Props> = memo(function Feedback(props = {}) {
  return (
    <div className={classes.root}>
      <div className={classes.frame127}>
        <div className={classes.loggingIn}>
          <div className={classes.container}>
            <PluginPageHeadline
              className={classes.pluginPageHeadline}
              text={{
                pageTitle: <div className={classes.pageTitle}>Get free credits</div>,
                loremIpsumDolorSitAmetConsecte: (
                  <div className={classes.loremIpsumDolorSitAmetConsecte}>
                    Hey, I’m Matt, Clapy cofounder 👋
                    <br />
                    Let’s meet to see how we can improve Clapy!
                  </div>
                ),
              }}
            />
            <div className={classes.player}>
              <div className={classes.wIN_20220629_10_35_10_Pro1}></div>
            </div>
            <div className={classes.frame220}>
              <div className={classes.weRewardUsersWhoHelpUsBuildABe}>
                We reward users who help us build <br />a better Product for everyone 👇
              </div>
              <div className={classes.frame187}>
                <div className={classes.frame98}>
                  <div className={classes.submitButton}>
                    <Button_SizeXlHierarchyPrimaryI
                      className={classes.button}
                      classes={{ _ButtonBase: classes._ButtonBase }}
                      swap={{
                        circle: (
                          <MessageCircle
                            className={classes.messageCircle}
                            swap={{
                              icon: <MessageCircleIcon className={classes.icon} />,
                            }}
                          />
                        ),
                      }}
                      text={{
                        text: <div className={classes.text}>Give feedback and earn credits</div>,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
