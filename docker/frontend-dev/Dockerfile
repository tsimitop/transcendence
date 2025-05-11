FROM node:23-bookworm

# this makes the logs nicer 
RUN echo 'export PS1="frontend-dev-container:$ "' >> /root/.bashrc

COPY ./frontend-entry.sh .
RUN chmod +x ./frontend-entry.sh

ENTRYPOINT [ "./frontend-entry.sh" ]
