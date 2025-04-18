FROM nginx:1.27.4

RUN apt-get update -y && apt-get upgrade -y \
		&& apt-get install vim -y

RUN echo 'export PS1="nginx-container:$ "' >> /root/.bashrc

RUN mkdir -p /etc/nginx/server_location_config_include

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/

COPY ./docker/nginx/cors.conf /etc/nginx/server_location_config_include