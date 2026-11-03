FROM node:22-bookworm
WORKDIR /gateway
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.mjs ./
ENV SSH_GATEWAY_PORT=7681
EXPOSE 7681
CMD ["node", "index.mjs"]
