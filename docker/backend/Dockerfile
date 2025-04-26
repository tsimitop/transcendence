FROM node:23-bookworm

RUN apt-get update -y && apt-get upgrade -y \
		&& apt-get install sqlite3=3.40.1-2+deb12u1 -y && apt-get install libsqlite3-dev=3.40.1-2+deb12u1 -y\
		&& echo 'export PS1="backend-container:$ "' >> /root/.bashrc

COPY ./backend-entry.sh .
RUN chmod +x ./backend-entry.sh

ENTRYPOINT [ "./backend-entry.sh" ]