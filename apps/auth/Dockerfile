FROM node:18-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm install

COPY apps/auth apps/auth
COPY libs libs

RUN cd apps/auth && npm install

RUN npm run build auth

FROM node:18-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app
ENV PORT 3001
EXPOSE 3001

COPY package*.json ./

RUN npm install --only=production


COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/auth/main"]


