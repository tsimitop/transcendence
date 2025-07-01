# How to run this thing

Install docker, and preferrably add your user to the `docker` group so you don't need sudo to run it. 
See https://docs.docker.com/engine/install/linux-postinstall/. If you don't use linux, use a Github codespace or install a proper OS?

Then run `./transcendence.sh buildandup`

This should:
  * start the backend container which serves the API requests of the frontend
  * run the frontend container, which builds the static website files that Caddy (the webserver) serves and then exit again. The files are generated into `./frontend/dist`
  * Start Caddy, this is the webserver that serves the files (the website), and redirects the requests the website code does to our backend.

Now you should be able to access the website at `https://localhost:4443` (or `http://localhost:5173`, the dynamically updated version hosted by the frontend container itself, don't expose 5173 to the public)

If you want to clean all docker clutter again, run `./transcendence.sh removeall`

Checkout what a browser console is if you don't know yet. Very important for this project.

# Todos

What modules we do and who does what.

<mark>Please update if something is outdated.</mark>

## Modules 

#### <u>Web</u>
◦ **Major module**: Use a framework to build the backend

◦ **Minor module**: Use a framework or a toolkit to build the frontend.

◦ **Minor module**: Use a database for the backend.

#### <u>User Management</u>
◦ **Major module**: Standard user management, authentication, users across
tournaments.

◦ **Major module**: Implementing a remote authentication.

#### <u>Gameplay and user experience</u>
◦ **Major module**: Multiplayer (more than 2 players in the same game).

◦ **Major module**: Live chat.


#### <u>Server-Side Pong</u>
◦ **Major module**: Replace basic Pong with server-side Pong and implement an
API.

## Assignments and Team

#### <u>Farshad</u>
* Frontend:
  - Routing
  - Sample pages such as Profile, Sign in, Sign up, and sample components such as Header
  - Implemention of userContext (to have access to the user data in frontend), urlContext, and themeContext (to toggle between light and dark themes)
  - Basic UI (CSS)
* Backend:
  - Protected routes to check the user authentication status before routing
  - Sign in, Sign up, Sign out, Google Sign in, and 2FA
  - Implemention of a table for user in database and a class to query the database 
* Docker Network:
  - Frontend-dev container to run a development server
  - Backend container to run a Fastify server with some endpints for authentication
  - Nginx to serve the app and act as a reverse proxy to send the requests from the client to the backend API endpoints
    
* Major modules:
  - Web: Use a framework to build the backend (Fastify).
  - User Management: Implementing a remote authentication (Google Sign in).
  - User Management: Standard user management, authentication and users across tournaments (**ONLY** the authentication part).
  - Cybersecurity: Implement Two-Factor Authentication (2FA) and JWT.
 
* Minor modules:
  - Web: Use a framework or a toolkit to build the frontend (Tailwind CSS). 
  - Web: Use a database for the backend (SQLite).
  - Accessibility: Expanding browser compatibility **???** (Supports Google Chrome and Firefox out of the box, but does not work in Safari)
  - Accessibility: Add accessibility features for visually impaired users (**Partially**).
    
#### <u>Thaleia</u>
 * User Management
   - Profiles (visit others, update yours)
   - Match history and statistics per user
   - Relatinships and online status (friend/blocked, online/offline)

#### <u>Waldi</u>
* Client implementation of Pong game (Frontend, GUI, consuming the API)
* Live Chat frontend

#### <u>Felix</u>
* Backend implementation of Pong game
* WS Json API definition for pong game
* fix oauth port (caddy)
* fix frontend dev 2fa json error

## Workflow
* Please open a github issue or fix it if you notice bugs
* Weekly peer coding and Status update in call (Saturday or Sunday) on meet.jit.si
* Please write commit messages actually describing what you did and changed.
* **Squash** related commits

<br>
<br>
<mark>This is all subject to change and not fixed, just intended to provide some guidance and status. So if you work on something new or different add it here please.</mark>

<br>

# DEADLINE 22.06.

