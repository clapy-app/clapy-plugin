FROM node:16-alpine

RUN apk -U upgrade && apk add git

ENV NODE_ENV production
WORKDIR /app
COPY backend-clapy/package.json yarn.lock ./
RUN NODE_ENV=development yarn install --immutable
COPY backend-clapy/. .
RUN yarn build
# && yarn install --immutable

CMD [ "yarn", "start:prod" ]
