#!/bin/bash

DOCKER_COMPOSE_FILE="./docker/docker-compose.yaml"
PROJECT_NAME="ft_transcendence"

show_help() {
    echo "Usage: ./transcendence.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build     - Build all Docker services"
    echo "  up        - Start all Docker services (in foreground)"
    echo "  down      - Stop and remove all Docker services"
    echo "  start     - Start existing Docker services (do not recreate)"
    echo "  stop      - Stop running Docker services"
    echo "  help      - Show this help message"
}

case "$1" in
    build)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" build
        ;;
    up)
        docker compose -f "$DOCKER_COMPOSE_FILE" -p "$PROJECT_NAME" up
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
        echo "Removing all Docker containers and volumes..."
        docker rm -f $(docker ps -aq) 2>/dev/null || true
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
        echo "All containers and volumes removed."
        ;;
    *)
        show_help
        ;;
esac