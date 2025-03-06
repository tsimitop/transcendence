FROM node:22.14.0

RUN echo 'export PS1="backend-container:$ "' >> /root/.bashrc

WORKDIR /app

CMD [ "sh", "-c", "npm install & npm run dev" ]