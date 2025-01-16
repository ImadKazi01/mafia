# Mafia

Below is a sample **README.md** you can include in your repository. It provides an overview of the project, installation steps, usage instructions, and potential customization ideas.

---

# Mafia Game (Node.js + WebSockets)

A simple real-time **Mafia** game built with **Node.js**, **Express**, and **Socket.IO**. This application demonstrates basic role assignment (Mafia, Doctor, Civilian), a night-action flow, and real-time communication among players. It also includes a minimal Vue.js frontend in the `public` directory.

## Features

- **Create/Join Game Sessions**: Users can generate a unique session code or join with an existing code.
- **Role Assignment**: Randomly assigns 2 Mafia, 1 Doctor, and the rest Civilians (if enough players).
- **Night Actions**:
  - **Mafia**: Select players to eliminate.
  - **Doctor**: Select a player to save.
- **Real-Time Updates**: All changes are broadcast to every connected player in the same session.
- **No Database**: Uses in-memory objects to store session data (simple for demos or small games).

## Getting Started

### Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (comes with Node.js)

### Installation

1. **Clone** the repository:
   ```bash
   git clone https://github.com/ImadKazi01/mafia.git
   cd mafia
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Start** the server:
   ```bash
   npm start
   ```

4. **Open** your browser and go to:
   ```
   http://localhost:3000
   ```
   You should see the main Mafia game page.

## How To Play

1. **Create Game**:
   - On the homepage, click the **Create Game** button to generate a new session code.
   - Share this code with your friends.

2. **Join Game**:
   - Enter the **Session Code** provided by the host.
   - Enter a **Name** (e.g., "Alice").
   - Click **Join Game**.

3. **Start Game**:
   - Once all the players are in the lobby, the host can click **Start Game**.
   - The server assigns roles:
     - 2 players become **Mafia** (if enough players).
     - 1 player becomes **Doctor** (if enough players).
     - Remaining players are **Civilians**.

4. **Night Phase** (Demo Logic):
   - **Mafia** collectively select a target(s) to kill.
   - **Doctor** selects a target to save.
   - If the Doctor saves the same target the Mafia attempts to kill, that player survives.

5. **Results**:
   - The server notifies everyone who was killed overnight.
   - (In a more advanced game, you’d proceed to a **Day Phase** for discussion and voting.)

## Project Structure

```
.
├── server.js             # Main server file: sets up Express, Socket.IO, and game logic
├── public/
│   ├── index.html        # Basic Vue.js-powered frontend
│   └── client.js         # Vue.js + Socket.IO client logic
├── package.json          # Node.js dependencies and scripts
└── README.md             # Project documentation
```

### server.js

- **Express** serves static files from `public`.
- **Socket.IO** handles real-time connections.
- Maintains an in-memory `sessions` object where each session holds:
  - `code` (unique session ID).
  - `players` (array of player objects).
  - `state` (e.g. "waiting", "in-progress").

### public/index.html and client.js

- Minimal **Vue.js** interface for creating/joining sessions, listing players, and showing roles/status.
- Communicates with the server via **Socket.IO** events:
  - `create-session`
  - `join-session`
  - `start-game`
  - `night-action`
  - etc.

## Customization Ideas

- **Day Phase & Voting**: Let players discuss who they think is Mafia, then vote to eliminate someone.
- **Additional Roles** (e.g., Detective, Jester, etc.).
- **Persistent Storage**: Store game history or player stats in a database (MongoDB, PostgreSQL, etc.).
- **User Authentication**: Use a login system if you want persistent player profiles or stats.
- **UI/UX Enhancements**: Add a lobby screen, night/day transition animations, custom themes.

## Contributing

1. **Fork** the project.
2. **Create** a feature branch (`git checkout -b feature/MyFeature`).
3. **Commit** your changes (`git commit -m 'Add MyFeature'`).
4. **Push** to the branch (`git push origin feature/MyFeature`).
5. **Open** a Pull Request on GitHub.

## License

This project is licensed under the [MIT License](LICENSE), so feel free to use and modify it for your own projects.

---

Enjoy playing **Mafia** with your friends! If you run into any issues or have suggestions, feel free to open an issue or submit a pull request. Happy coding!
