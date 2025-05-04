{
  description = "Transcendence-42 development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [];
        };

        # Common development dependencies
        commonDevTools = with pkgs; [
          git
          jq
          curl
          wget
          nodejs_22
          nodePackages.typescript
          nodePackages.typescript-language-server
        ];

        # Backend-specific dependencies
        backendDevTools = with pkgs; [
          nodePackages.ts-node
          sqlite
        ];

        # Frontend-specific dependencies
        frontendDevTools = with pkgs; [
          # Just use Node.js, we'll install vite locally
          tailwindcss
        ];

        # For Docker development
        dockerTools = with pkgs; [
          docker
          docker-compose
        ];
      in
      {
        devShells = {
          default = pkgs.mkShell {
            buildInputs = commonDevTools ++ backendDevTools ++ frontendDevTools ++ dockerTools;
            shellHook = ''
              echo "Welcome to the Transcendence-42 development environment!"
              echo "Type 'nix develop .#backend' for backend-specific development environment."
              echo "Type 'nix develop .#frontend' for frontend-specific development environment."
              echo "Type 'nix develop .#docker' to use Docker for development."
              echo ""
              echo "Note: Some Node.js packages will be installed via npm instead of Nix."
            '';
          };

          backend = pkgs.mkShell {
            buildInputs = commonDevTools ++ backendDevTools;
            shellHook = ''
              echo "Backend development environment"
              echo "Available commands:"
              echo "  npm run dev    - Start the backend in development mode"
              echo "  npm run build  - Build the backend"
              echo "  npm run start  - Start the built backend"
              echo ""
              echo "If ts-node-dev is needed, install it with:"
              echo "  npm install -g ts-node-dev"
              echo ""
              echo "Working directory: $(pwd)/backend"
              if [ -d "backend" ]; then
                cd backend
              fi
            '';
          };

          frontend = pkgs.mkShell {
            buildInputs = commonDevTools ++ frontendDevTools;
            shellHook = ''
              echo "Frontend development environment"
              echo "Available commands:"
              echo "  npm run dev     - Start the frontend in development mode"
              echo "  npm run build   - Build the frontend"
              echo "  npm run preview - Preview the built frontend"
              echo "  npm run host    - Host the frontend on the network"
              echo ""
              echo "Working directory: $(pwd)/frontend"
              if [ -d "frontend" ]; then
                cd frontend
              fi
            '';
          };

          docker = pkgs.mkShell {
            buildInputs = dockerTools;
            shellHook = ''
              echo "Docker development environment"
              echo "Available commands:"
              echo "  docker-compose -f docker/docker-compose.yaml up -d  - Start all services"
              echo "  docker-compose -f docker/docker-compose.yaml down   - Stop all services"
              echo ""
              echo "Frontend dev URL: http://localhost:5173"
              echo "Production URL:   https://localhost:4443"
            '';
          };
        };
      }
    );
}