Below is an **updated README** with the link to the **fully hosted version** at the top, as well as all the previously requested updates:

---

# Mafia Game (Node.js + Socket.IO + React/TypeScript)

**Play a fully hosted version here:** [mafiamystery.netlify.app](https://mafiamystery.netlify.app)

A simple real-time **Mafia** game built with **Node.js**, **Express**, and **Socket.IO** on the backend, and a **React + TypeScript** frontend. This project demonstrates basic role assignment (Mafia, Doctor, Civilian), night actions, and real-time updates. The server logic is housed in a `server/` directory, while the frontend is in the root (or another directory, depending on your setup).

## Features

- **Create/Join Game Sessions**: Generate a unique session code or join with an existing code.
- **Role Assignment**: Randomly assigns 2 Mafia, 1 Doctor, and the rest Civilians (if enough players).
- **Night Actions**:
  - **Mafia**: Choose a target to eliminate (Mafia must agree on the same target).
  - **Doctor**: Choose a target to save.
- **Real-Time Updates**: Socket.IO broadcasts game state changes immediately.
- **No Database**: All session data is kept in-memory (simpler for demos or small-scale games).

## Getting Started

### Prerequisites

- **Node.js** (v14+ recommended)
- **npm** or **yarn** (comes with Node.js)

### Project Structure

```
.
├── server/
│   ├── server.js (or server.ts)       # Main Node.js/Express/Socket.IO server
│   ├── package.json                   # Server dependencies and scripts
│   └── ...
├── src/ (or another folder for React) # Your React + TypeScript source files
├── package.json                       # Frontend dependencies and scripts
└── README.md                          # This documentation
```

Depending on your setup, your React app may be in the root or in a `client/` folder. The instructions below assume:

1. Your **Node/Express server** code is in `server/`.
2. Your **React** app is in the project root (or a parallel folder).

---

## Installation & Running Locally

1. **Clone** the repository:

   ```bash
   git clone https://github.com/ImadKazi01/mafia.git
   cd mafia
   ```

2. **Install & Run the Server**:

   - Navigate into the **server** folder and install dependencies:
     ```bash
     cd server
     npm install
     ```
   - Start the backend (development mode):
     ```bash
     npm run dev
     ```
   - This will spin up your Node.js/Express/Socket.IO server (usually on port `3000`, if configured that way).

3. **Install & Run the Frontend**:

   - Open **another terminal** in the **root** of the project (where the React app is).
   - Install frontend dependencies:
     ```bash
     npm install
     ```
   - Start the React dev server:
     ```bash
     npm run dev
     ```
   - By default, this might run on port `5173` (for Vite) or `3000` (for Create React App). Check the console for the actual URL.

4. **Open** your browser at the **frontend** address (e.g., [http://localhost:5173/](http://localhost:5173/) if using Vite).
   - From there, you can create or join a game.
   - The frontend communicates with the backend via Socket.IO events.

---

## How To Play

1. **Create Game**:

   - On the homepage, click **Create Game** to generate a session code.
   - Share the code with your friends.

2. **Join Game**:

   - Enter the **Session Code** and your **Name**.
   - Click **Join Game**.

3. **Start Game**:

   - Once all players are in the lobby, the host (narrator) can click **Start**.
   - Roles are assigned: 2 Mafia (if enough players), 1 Doctor, rest Civilians.

4. **Night Phase**:

   - **Mafia** collaboratively pick one target to eliminate.
   - **Doctor** chooses a target to save.
   - If the Doctor saves the same person the Mafia attempt to kill, they survive.

5. **Day Phase**:

   - Kills and Saves from the **Mafia** and the **Doctor** are reveled to the players.
   - Players discuss and elminate who they suspect is the mafia.

6. **Results**:
   - The server notifies everyone of who was killed.
   - In a more advanced scenario, continue to the **Day Phase** (discussion & voting).

---

## Improvement Ideas

- **At the end of the game**: Allow players to join the next game via the code - Narrator screen always shows the code.
- **Joining a game**: When joining a game the narrator has to allow the player to join,if they join mid game they are a spectator until the next game.
- **Narrator Role**: Allow players to take on the role of the narrator at the end of the game, this is randomised.
- **More Roles**: Add a Detective, Jester, Vigilante, etc.
- **Persistent Database**: Use MongoDB or PostgreSQL if you want to track stats over time.
- **Authentication**: Add a login system if you need user accounts.
- **Game History**: Allow players to view the history of games they have played in.
- **UI/UX Improvements**: Animate the transitions, add a chat window, or style the UI further.
- **Karma System**: Allow players to gain karma for their actions, this is used for punishing players for bad behaviour eg spectators revealing roles of other players.

---

## Contributing

1. **Fork** the project.
2. **Create** a feature branch (`git checkout -b feature/MyFeature`).
3. **Commit** your changes (`git commit -m 'Add MyFeature'`).
4. **Push** to the branch (`git push origin feature/MyFeature`).
5. **Open** a Pull Request on GitHub.

---

## License

This project is licensed under the [MIT License](LICENSE). Feel free to fork and modify it for your own needs.

---

Enjoy playing **Mafia**! If you have questions, suggestions, or run into any issues, feel free to open an issue or submit a pull request. Happy coding!
