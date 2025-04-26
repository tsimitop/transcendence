FROM caddy:2.8-alpine

# install certutils for self signed certs, caddy needs it
RUN apk update && apk add nss-tools

# if you modify the Caddyfile, you need to rebuild the image to apply the changes!
COPY Caddyfile /etc/caddy/Caddyfile

# this just makes Caddy cry less in the logs
RUN caddy fmt --overwrite /etc/caddy/Caddyfile