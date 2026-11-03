FROM node:22-bookworm AS assets
WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npx vite build

FROM composer:2 AS vendor
WORKDIR /app
COPY server/composer.json server/composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

FROM php:8.4-apache
RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite
WORKDIR /var/www/html
COPY server/ ./
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /src/client/dist/index.html ./public/index.html
COPY --from=assets /src/client/dist/assets ./public/assets
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p var public/uploads \
    && chown -R www-data:www-data var public/uploads
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
