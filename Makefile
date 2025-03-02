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