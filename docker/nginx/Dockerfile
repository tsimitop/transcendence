FROM nginx:1.27.4

RUN apt-get update -y && apt-get upgrade -y \
		&& apt-get install vim -y

RUN echo 'export PS1="nginx-container:$ "' >> /root/.bashrc

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/