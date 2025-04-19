buildandup: build up

nginxbuild:
	docker build --file ./docker/nginx/Dockerfile -t nginx:default .

nginxrun:
	docker run --name nginx --publish 80:80 nginx:default

nginx: nginxbuild nginxrun

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
	docker exec -it nginx /bin/bash

backendshell:
	docker exec -it backend /bin/bash

build:
	docker compose --file ./docker/docker-compose.yaml --project-name ft_transcendence build

up:
	docker compose --file ./docker/docker-compose.yaml --project-name ft_transcendence up

down:
	docker compose --file ./docker/docker-compose.yaml --project-name ft_transcendence down

start:
	docker compose --file ./docker/docker-compose.yaml --project-name ft_transcendence start

stop:
	docker compose --file ./docker/docker-compose.yaml --project-name ft_transcendence stop

buildfrontend:
	cd ./frontend && npm run build