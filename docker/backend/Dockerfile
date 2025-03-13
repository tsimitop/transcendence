FROM node:22.14.0

RUN apt-get update -y && apt-get upgrade -y \
		&& apt-get install sqlite3=3.40.1-2+deb12u1 -y && apt-get install libsqlite3-dev=3.40.1-2+deb12u1 -y\
		&& echo 'export PS1="backend-container:$ "' >> /root/.bashrc

WORKDIR /app

CMD [ "sh", "-c", "npm install && npm run dev" ]