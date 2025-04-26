#!/bin/bash

# Set error handling
set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Define constants
DOCKER_COMPOSE_FILE="./docker/docker-compose.yaml"
PROJECT_NAME="ft_transcendence"

# Default settings
VERBOSE=false
NO_CACHE=false

# Print header
print_header() {
    echo -e "${GREEN}===================================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}===================================================${NC}"
}

# Print error
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Print verbose message
print_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}VERBOSE: $1${NC}"
    fi
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running or not accessible. Please start Docker and try again."
        exit 1
    fi
}

# Parse command line options
parse_options() {
    local args=("$@")
    local idx=0
    local count=$#
    
    while [ $idx -lt $count ]; do
        case "${args[$idx]}" in
            --verbose)
                VERBOSE=true
                ;;
            --no-cache)
                NO_CACHE=true
                ;;
            *)
                # Return the index of the first non-option argument
                echo "$idx"
                return
                ;;
        esac
        ((idx++))
    done
    
    # If we get here, all args were options
    echo "$count"
}

# Get appropriate Docker build flags based on settings
get_build_flags() {
    local flags=""
    
    if [ "$VERBOSE" = true ]; then
        flags="$flags --progress=plain"
        print_verbose "Enabling verbose build output"
    fi
    
    if [ "$NO_CACHE" = true ]; then
        flags="$flags --no-cache"
        print_verbose "Disabling build cache"
    fi
    
    echo "$flags"
}

# Build and start services
buildandup() {
    build
    up
}

# Build Caddy image
caddybuild() {
    print_header "Building Caddy image"
    local build_flags=$(get_build_flags)
    print_verbose "Build command: docker build --file ./docker/caddy/Dockerfile -t caddy:default $build_flags ."
    docker build --file ./docker/caddy/Dockerfile -t caddy:default $build_flags .
    print_success "Caddy image built successfully"
}

# Run Caddy container
caddyrun() {
    print_header "Running Caddy container"
    print_verbose "Run command: docker run --name caddy --publish 80:80 --publish 443:443 caddy:default"
    docker run --name caddy --publish 80:80 --publish 443:443 caddy:default
    print_success "Caddy container started successfully"
}

# Build and run Caddy
caddy() {
    caddybuild
    caddyrun
}

# Remove all Docker images
removeallimages() {
    print_header "Removing all Docker images"
    # Check if there are any images
    if [ -z "$(docker images -q)" ]; then
        print_warning "No Docker images found"
    else
        print_verbose "Removing all Docker images with command: docker rmi $(docker images -aq)"
        docker rmi $(docker images -aq)
        print_success "All Docker images removed successfully"
    fi
}

# Remove all Docker containers
removeallcontainers() {
    print_header "Removing all Docker containers"
    # Check if there are any running containers
    if [ -z "$(docker ps -aq)" ]; then
        print_warning "No Docker containers found"
    else
        print_verbose "Stopping all Docker containers with command: docker stop $(docker ps -aq)"
        docker stop $(docker ps -aq) || true
        print_verbose "Removing all Docker containers with command: docker rm -v $(docker ps -aq)"
        docker rm -v $(docker ps -aq) || true
        print_success "All Docker containers removed successfully"
    fi
}

# Remove all Docker volumes
removeallvolumes() {
    print_header "Removing all Docker volumes"
    # Check if there are any volumes
    if [ -z "$(docker volume ls -q)" ]; then
        print_warning "No Docker volumes found"
    else
        print_verbose "Removing all Docker volumes with command: docker volume rm $(docker volume ls -q)"
        docker volume rm $(docker volume ls -q) || true
        print_success "All Docker volumes removed successfully"
    fi
}

# Remove all Docker containers, images, and volumes
removeall() {
    print_header "Removing all Docker containers, images, and volumes"
    removeallcontainers
    removeallimages
    removeallvolumes
    print_verbose "Running system prune with command: docker system prune -af --volumes"
    docker system prune -af --volumes
    print_success "Docker system cleaned up successfully"
}

# Open a shell in the frontend container
frontendshell() {
    print_header "Opening shell in frontend-dev container"
    print_verbose "Executing command: docker exec -it frontend-dev /bin/bash"
    if ! docker exec -it frontend-dev /bin/bash; then
        print_error "Failed to open shell in frontend-dev container. Is the container running?"
        exit 1
    fi
}

# Open a shell in the Caddy container
caddyshell() {
    print_header "Opening shell in caddy container"
    print_verbose "Executing command: docker exec -it caddy /bin/bash"
    if ! docker exec -it caddy /bin/bash; then
        print_error "Failed to open shell in caddy container. Is the container running?"
        exit 1
    fi
}

# Open a shell in the backend container
backendshell() {
    print_header "Opening shell in backend container"
    print_verbose "Executing command: docker exec -it backend /bin/bash"
    if ! docker exec -it backend /bin/bash; then
        print_error "Failed to open shell in backend container. Is the container running?"
        exit 1
    fi
}

# Build Docker Compose services
build() {
    print_header "Building Docker Compose services"
    local build_flags=$(get_build_flags)
    local command="docker compose --file \"$DOCKER_COMPOSE_FILE\" --project-name \"$PROJECT_NAME\" build $build_flags"
    print_verbose "Executing command: $command"
    eval "$command"
    print_success "Docker Compose services built successfully"
}

# Start Docker Compose services
up() {
    print_header "Starting Docker Compose services"
    
    local command="docker compose --file \"$DOCKER_COMPOSE_FILE\" --project-name \"$PROJECT_NAME\" up"
    if [ "$VERBOSE" = true ]; then
        command="$command --verbose"
    fi
    
    print_verbose "Executing command: $command"
    eval "$command"
    print_success "Docker Compose services exited"
}

# Stop and remove Docker Compose services
down() {
    print_header "Stopping and removing Docker Compose services"
    local command="docker compose --file \"$DOCKER_COMPOSE_FILE\" --project-name \"$PROJECT_NAME\" down"
    if [ "$VERBOSE" = true ]; then
        command="$command --verbose"
    fi
    
    print_verbose "Executing command: $command"
    eval "$command"
    print_success "Docker Compose services stopped and removed successfully"
}

# Start Docker Compose services (without recreating containers)
start() {
    print_header "Starting Docker Compose services"
    local command="docker compose --file \"$DOCKER_COMPOSE_FILE\" --project-name \"$PROJECT_NAME\" start"
    
    print_verbose "Executing command: $command"
    eval "$command"
    print_success "Docker Compose services started successfully"
}

# Stop Docker Compose services
stop() {
    print_header "Stopping Docker Compose services"
    local command="docker compose --file \"$DOCKER_COMPOSE_FILE\" --project-name \"$PROJECT_NAME\" stop"
    
    print_verbose "Executing command: $command"
    eval "$command"
    print_success "Docker Compose services stopped successfully"
}

# Build frontend
buildfrontend() {
    print_header "Building frontend"
    print_verbose "Executing command: cd ./frontend && npm run build"
    cd ./frontend && npm run build
    print_success "Frontend built successfully"
}

# Show help
show_help() {
    echo "Usage: ./transcendence.sh [options] [command]"
    echo ""
    echo "Options:"
    echo "  --verbose          - Enable verbose output (shows commands before execution)"
    echo "  --no-cache         - Disable Docker build cache"
    echo ""
    echo "Commands:"
    echo "  buildandup         - Build and start all services"
    echo "  build              - Build all Docker services"
    echo "  up                 - Start all Docker services"
    echo "  down               - Stop and remove all Docker services"
    echo "  start              - Start all Docker services (without recreating containers)"
    echo "  stop               - Stop all Docker services"
    echo "  caddy              - Build and run Caddy container"
    echo "  caddybuild         - Build Caddy image"
    echo "  caddyrun           - Run Caddy container"
    echo "  caddyshell         - Open a shell in the Caddy container"
    echo "  frontendshell      - Open a shell in the frontend container"
    echo "  backendshell       - Open a shell in the backend container"
    echo "  buildfrontend      - Build the frontend"
    echo "  removeallcontainers - Remove all Docker containers"
    echo "  removeallimages    - Remove all Docker images"
    echo "  removeallvolumes   - Remove all Docker volumes"
    echo "  removeall          - Remove all Docker containers, images, and volumes"
    echo "  help               - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./transcendence.sh --verbose build        - Build with verbose output"
    echo "  ./transcendence.sh --no-cache --verbose build  - Build with no cache and verbose output"
}

# Main function
main() {
    # Check if Docker is running
    check_docker

    # Parse options
    local opt_end=$(parse_options "$@")
    
    # Extract commands (non-option arguments)
    local commands=("${@:$((opt_end+1))}")

    # If no commands are provided, show help
    if [ ${#commands[@]} -eq 0 ]; then
        show_help
        exit 0
    fi

    # Handle commands
    case "${commands[0]}" in
        buildandup)
            buildandup
            ;;
        build)
            build
            ;;
        up)
            up
            ;;
        down)
            down
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        caddy)
            caddy
            ;;
        caddybuild)
            caddybuild
            ;;
        caddyrun)
            caddyrun
            ;;
        caddyshell)
            caddyshell
            ;;
        frontendshell)
            frontendshell
            ;;
        backendshell)
            backendshell
            ;;
        buildfrontend)
            buildfrontend
            ;;
        removeallcontainers)
            removeallcontainers
            ;;
        removeallimages)
            removeallimages
            ;;
        removeallvolumes)
            removeallvolumes
            ;;
        removeall)
            removeall
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Unknown command: ${commands[0]}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"