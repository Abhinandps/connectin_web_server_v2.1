FROM node:alpine As development

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

RUN npm install

COPY apps/cloud-gateway apps/cloud-gateway
COPY libs libs

RUN cd apps/cloud-gateway && npm install

RUN npm run build cloud-gateway

FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app
ENV PORT 3000
EXPOSE 3000

COPY package*.json ./

RUN npm install --only=production

# COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/cloud-gateway/main"]


