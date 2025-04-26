FROM caddy:2.8-alpine

# install certutils for self signed certs
RUN apk update && apk add nss-tools

COPY Caddyfile /etc/caddy/Caddyfile

RUN caddy fmt --overwrite /etc/caddy/Caddyfile