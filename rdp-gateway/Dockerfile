FROM node:22-bookworm
WORKDIR /gateway
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.mjs ./
ENV RDP_GATEWAY_PORT=7682
EXPOSE 7682
CMD ["node", "index.mjs"]
