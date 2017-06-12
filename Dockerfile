FROM library/node:6-alpine

MAINTAINER Gilles Perreymond <gperreymond@gmail.com>

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package.json /usr/app/package.json
COPY config/default.js /usr/app/config/default.js
COPY server /usr/app/server

RUN apk add --update make gcc g++ python git

RUN npm install --production && \
    npm uninstall -g npm

RUN apk del make gcc g++ python git && \
    rm -rf /tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

VOLUME /usr/app/data

EXPOSE 80
CMD ["node", "server/start"]
