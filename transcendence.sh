#!/bin/bash

DOCKER_COMPOSE_FILE="./docker/docker-compose.yaml"
PROJECT_NAME="ft_transcendence"

show_help() {
    echo "Usage: ./transcendence.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build     		- Build all Docker services"
    echo "  up        		- Start all Docker services (in foreground)"
    echo "  up -d     		- Start all Docker services in detached mode"
	echo "  buildandup [-d]	- Build and start all Docker services (optionally in detached mode)"
    echo "  down      		- Stop and remove all Docker services"
    echo "  start     		- Start existing Docker services (do not recreate)"
    echo "  stop      		- Stop running Docker services"
    echo "  clean     		- Remove all Docker containers and volumes"
    echo "  help      		- Show this help message"
}

case "$1" in
    build)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" build
        ;;
    up)
        if [ "$2" = "-d" ]; then
            docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up -d
        else
            docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up
        fi
        ;;
    buildandup)
        if [ "$2" = "-d" ]; then
            docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up --build -d
        else
            docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up --build
        fi
        ;;
    down)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" down
        ;;
    start)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" start
        ;;
    stop)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" stop
        ;;
    help)
        show_help
        ;;
    clean)
        docker rm -f $(docker ps -aq) 2>/dev/null || true
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
        rm ./backend/database/test.db
		rm -f ./backend/avatars/upload-* 2>/dev/null || true
        rm -rf ./frontend/dist
        echo "All containers and volumes removed."
        ;;
    *)
        show_help
        ;;
esac