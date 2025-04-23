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
* Authentication
* Misc frontend 
* Login flow

#### <u>Waldi</u>
* Client implementation of Pong game (Frontend, GUI, consuming the API)
* Live Chat frontend

#### <u>Felix</u>
* Backend implementation of Pong game
* WS Json API definition for pong game
* Live Chat Backend

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

### Development

- In the file ``/frontend/src/constants.ts`` change the value of the variable ``NGINX_SERVER`` to ``"http://localhost:80"``
- In the file ``.env`` change the value of ``IS_DEVELOPMENT`` to ``true``
- Run ``make`` from the root directory of the project

  The app must be accessible on ``http://localhost:5173``

### Deployment

- In the file ``/frontend/src/constants.ts`` change the value of the variable ``NGINX_SERVER`` to ``"https://localhost:443"``
- In the file ``.env`` change the value of ``IS_DEVELOPMENT`` to ``false``
- Run ``make`` from the root directory of the project

  The app must be accessible on ``https://localhost:443`` (after running the app once on port 443, the app will also be available on the development server ``http://localhost:5173``)
