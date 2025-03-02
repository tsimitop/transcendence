FROM nginx:1.27.4

RUN apt-get update -y && apt-get upgrade -y \
		&& apt-get install vim -y \
		&& apt-get install zsh -y

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/