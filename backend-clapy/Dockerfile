FROM node:16-alpine

RUN apk -U upgrade && apk add git

ENV NODE_ENV production
WORKDIR /app
COPY .yarn ./.yarn
COPY .pnp.* .yarnrc.yml package.json yarn.lock ./
COPY backend-clapy/package.json ./backend-clapy/package.json
RUN NODE_ENV=development yarn workspace backend-clapy install
COPY backend-clapy/. ./backend-clapy
WORKDIR /app/backend-clapy
RUN yarn build

CMD [ "yarn", "start:prod" ]
