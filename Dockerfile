FROM node:22

ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=8192

WORKDIR /usr/src/app

COPY . .

WORKDIR /usr/src/app/client
RUN npm i
RUN npm run build

WORKDIR /usr/src/app/server
RUN npm i

EXPOSE 8080

CMD [ "node", "index.js" ]