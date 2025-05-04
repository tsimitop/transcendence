# Nix Development Environment

This project uses Nix Flakes to provide consistent development environments for both backend and frontend development.

## Prerequisites

- Nix package manager: https://nixos.org/download.html
- Enable flakes by adding the following to `~/.config/nix/nix.conf` or `/etc/nix/nix.conf`:
  ```
  experimental-features = nix-command flakes
  ```

## Development Environments

This flake provides multiple development environments:

### Default Environment

The default environment includes all tools for both backend and frontend development:

```shell
nix develop
```

### Backend Development

For backend-specific development:

```shell
nix develop .#backend
```

This environment provides:
- Node.js 22.x
- TypeScript and TS-Node
- SQLite for database development

Once in the backend environment, you can use:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Frontend Development

For frontend-specific development:

```shell
nix develop .#frontend
```

This environment provides:
- Node.js 22.x
- TypeScript
- TailwindCSS

Once in the frontend environment, you can use:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Host on network
npm run host
```

### Docker Development

For using Docker to run the entire stack:

```shell
nix develop .#docker
```

Once in the Docker environment, you can use:
```bash
# Start all services
docker-compose -f docker/docker-compose.yaml up -d

# Stop all services
docker-compose -f docker/docker-compose.yaml down
```

## Using direnv (Optional)

If you have direnv installed and hooked into your shell:

1. Run `direnv allow` in the project directory
2. The default development environment will be loaded automatically when you cd into the project