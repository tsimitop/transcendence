nginxbuild:
	docker build --file ./docker/nginx/Dockerfile -t nginx:default .

nginxrun:
	docker run --name nginx --publish 80:80 nginx:default

nginx: nginxbuild nginxrun

nginxremovecontainer:
	docker stop nginx
	docker container rm nginx

nginxremoveimage: nginxremovecontainer
	docker image rm nginx:default

removeallimages:
	docker rmi $$(docker images -aq)

removeallcontainers:
	docker stop $$(docker ps -aq)
	docker rm -v $$(docker ps -aq)

removeall: removeallcontainers removeallimages
	docker system prune -af

frontendshell:
	docker exec -it frontend-dev /bin/bash

nginxshell:
	docker exec -it nginx /bin/zsh

run:
	docker-compose --file ./docker/docker-compose.yaml --project-name ft_transcendence up