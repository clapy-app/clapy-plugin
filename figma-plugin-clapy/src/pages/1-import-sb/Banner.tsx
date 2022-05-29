import type { FC } from 'react';
import { memo } from 'react';

import classes from './Banner.module.css';
import image from './detail/discord-banner-black.jpg';

// https://clapy.co/banner
// https://clapy.co/beta-success
export const Banner: FC = memo(function Banner() {
  return (
    <div className={classes.root}>
      <img src={image} alt={'Banner to join Discord'} className={classes.image} />
      <div>
        <div className={classes.joinSocial}>
          <a className={classes.dorikBtn} href='https://bit.ly/clapy-discord-beta' target='_blank' rel='noreferrer'>
            <div className={classes.btnSvgWrapper}>
              <svg
                aria-hidden='true'
                focusable='false'
                data-prefix='fab'
                data-icon='discord'
                className={classes.btnSvg}
                role='img'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 448 512'
              >
                <path
                  fill='currentColor'
                  d='M297.216 243.2c0 15.616-11.52 28.416-26.112 28.416-14.336 0-26.112-12.8-26.112-28.416s11.52-28.416 26.112-28.416c14.592 0 26.112 12.8 26.112 28.416zm-119.552-28.416c-14.592 0-26.112 12.8-26.112 28.416s11.776 28.416 26.112 28.416c14.592 0 26.112-12.8 26.112-28.416.256-15.616-11.52-28.416-26.112-28.416zM448 52.736V512c-64.494-56.994-43.868-38.128-118.784-107.776l13.568 47.36H52.48C23.552 451.584 0 428.032 0 398.848V52.736C0 23.552 23.552 0 52.48 0h343.04C424.448 0 448 23.552 448 52.736zm-72.96 242.688c0-82.432-36.864-149.248-36.864-149.248-36.864-27.648-71.936-26.88-71.936-26.88l-3.584 4.096c43.52 13.312 63.744 32.512 63.744 32.512-60.811-33.329-132.244-33.335-191.232-7.424-9.472 4.352-15.104 7.424-15.104 7.424s21.248-20.224 67.328-33.536l-2.56-3.072s-35.072-.768-71.936 26.88c0 0-36.864 66.816-36.864 149.248 0 0 21.504 37.12 78.08 38.912 0 0 9.472-11.52 17.152-21.248-32.512-9.728-44.8-30.208-44.8-30.208 3.766 2.636 9.976 6.053 10.496 6.4 43.21 24.198 104.588 32.126 159.744 8.96 8.96-3.328 18.944-8.192 29.44-15.104 0 0-12.8 20.992-46.336 30.464 7.68 9.728 16.896 20.736 16.896 20.736 56.576-1.792 78.336-38.912 78.336-38.912z'
                ></path>
              </svg>
            </div>
            <div className={classes.btnText}>Join Discord</div>
          </a>
        </div>
      </div>
      {/* <a href='https://discord.gg/uNyYjP7U' target='_blank' rel='noreferrer' className={classes.bannerLink}>
        <img src={discordBannerImg} className={classes.discordBanner} alt='Join our discord server' />
        <img
          src={discordBannerText}
          className={`${classes.discordBanner} ${classes.discordBannerText}`}
          alt='Join our discord server'
        />
      </a> */}
    </div>
  );
});
