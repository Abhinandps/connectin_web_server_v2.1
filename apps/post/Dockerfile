FROM node:18-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm install

COPY apps/post apps/post
COPY libs libs

RUN cd apps/post && npm install

RUN npm run build post

FROM node:18-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app
ENV PORT 3003
EXPOSE 3003

COPY package*.json ./

RUN npm install --only=production


COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/post/main"]


