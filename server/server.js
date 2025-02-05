import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

console.log("Starting server...");
console.log("Node environment:", process.env.NODE_ENV);
console.log("Fronted:", process.env.FRONTEND_URL);

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Add basic Express CORS for HTTP endpoints
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Add a basic health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Store game sessions
const games = new Map();

// Generate a random 6-character game code
function generateGameCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Assign roles randomly
function assignRoles(players) {
  const roles = [];
  const numPlayers = players.length - 1; // Excluding narrator

  // Add roles without narrator (narrator is already assigned)
  roles.push("mafia"); // At least 1 mafia
  roles.push("doctor"); // 1 doctor

  // Fill remaining slots with civilians and possibly another mafia
  while (roles.length < numPlayers) {
    // Add another mafia if more than 5 players
    if (roles.length === 5 && players.length > 5) {
      roles.push("mafia");
    } else {
      roles.push("civilian");
    }
  }

  // Shuffle roles (Fisher-Yates shuffle)
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Assign roles to players, skipping the narrator
  return players.map((player) => {
    if (player.role === "narrator") {
      return {
        ...player,
        isAlive: true,
        votes: 0,
        isSpectator: false,
      };
    }
    return {
      ...player,
      role: roles.shift(),
      isAlive: true,
      votes: 0,
      isSpectator: false,
    };
  });
}

// Add this function near the top with other utility functions
function createBotPlayer(gameCode) {
  return {
    id: `bot-${Math.random().toString(36).substr(2, 9)}`,
    name: `Bot ${Math.floor(Math.random() * 1000)}`,
    isBot: true,
  };
}

// Add these helper functions at the top with other utility functions
function checkGameEnd(game) {
  const livingPlayers = game.players.filter(
    (p) => p.isAlive && p.role !== "narrator"
  );
  const livingMafia = livingPlayers.filter((p) => p.role === "mafia");
  const livingCivilians = livingPlayers.filter(
    (p) => p.role !== "mafia" && p.role !== "narrator"
  );

  // If all mafia are dead, civilians win
  if (livingMafia.length === 0) {
    game.publicMessage =
      "Game Over - Civilians Win! All mafia have been eliminated.";
    game.isGameOver = true;
    return true;
  }

  // If mafia outnumber or equal civilians, mafia wins
  // This includes the 1v1 situation where mafia would win in the night phase
  if (livingMafia.length >= livingCivilians.length) {
    game.publicMessage = "Game Over - Mafia Wins! They now control the town.";
    game.isGameOver = true;
    return true;
  }

  return false;
}

// Modify the GameState type in types.ts to include these new properties
function createGameState(gameCode, players) {
  return {
    gameCode,
    players,
    phase: "lobby",
    isGameStarted: false,
    isGameOver: false,
    actions: {},
    votes: {},
    message: null, // Narrator-only messages
    publicMessage: null, // Messages visible to all players
  };
}

// Add this function to calculate vote results
function calculateVoteResults(game) {
  // Count votes for each player
  const voteCounts = {};
  Object.values(game.votes).forEach((targetId) => {
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  });

  // Find the player(s) with the most votes
  let maxVotes = 0;
  let eliminatedPlayers = [];

  Object.entries(voteCounts).forEach(([playerId, votes]) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      eliminatedPlayers = [playerId];
    } else if (votes === maxVotes) {
      eliminatedPlayers.push(playerId);
    }
  });

  // In case of a tie, randomly choose one player
  if (eliminatedPlayers.length > 1) {
    const randomIndex = Math.floor(Math.random() * eliminatedPlayers.length);
    eliminatedPlayers = [eliminatedPlayers[randomIndex]];
  }

  return eliminatedPlayers[0];
}

// Add this function to get formatted night actions for narrator
function getNarratorNightInfo(game) {
  const mafiaActions = Object.entries(game.actions)
    .filter(([_, action]) => action.action === "mafia")
    .map(([playerId, action]) => ({
      mafiaName: game.players.find((p) => p.id === playerId)?.name,
      targetName: game.players.find((p) => p.id === action.targetId)?.name,
    }));

  const doctorAction = Object.entries(game.actions).find(
    ([_, action]) => action.action === "doctor"
  );

  const doctorInfo = doctorAction
    ? {
        doctorName: game.players.find((p) => p.id === doctorAction[0])?.name,
        targetName: game.players.find((p) => p.id === doctorAction[1].targetId)
          ?.name,
      }
    : null;

  return {
    mafiaActions,
    doctorInfo,
  };
}

// Add near the top with other utility functions
function handleReconnection(socket, gameCode, playerId, playerName) {
  const game = games.get(gameCode);
  if (!game) return false;

  // Find the player in the game
  const player = game.players.find(
    (p) => p.id === playerId || p.name === playerName
  );
  if (!player) return false;

  // Update the player's socket ID
  player.id = socket.id;

  // Rejoin the game room
  socket.join(gameCode);

  // Send current game state and player info
  socket.emit("playerInfo", player);
  socket.emit("gameState", game);

  return true;
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Create a new game
  socket.on("createGame", ({ playerName }) => {
    const gameCode = generateGameCode();

    // Even for the first player, store their name in lowercase for future comparisons
    const player = {
      id: socket.id,
      name: playerName,
      role: "narrator",
    };

    games.set(gameCode, createGameState(gameCode, [player]));

    socket.join(gameCode);
    socket.emit("playerInfo", player);
    socket.emit("gameState", games.get(gameCode));
  });

  // Join an existing game
  socket.on("joinGame", ({ gameCode, playerName }) => {
    const game = games.get(gameCode);
    if (!game) {
      socket.emit("error", "Game not found");
      return;
    }

    if (game.isGameStarted) {
      socket.emit("error", "Game already started");
      return;
    }

    // Check for duplicate names
    const isDuplicateName = game.players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );

    if (isDuplicateName) {
      socket.emit("error", "That name is already taken");
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
    };

    game.players.push(player);
    socket.join(gameCode);
    socket.emit("playerInfo", player);
    io.to(gameCode).emit("gameState", game);
  });

  // Start the game
  socket.on("startGame", ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    game.players = assignRoles(game.players);
    game.isGameStarted = true;
    game.phase = "night";
    game.message = null;

    // Send updated game state to all players
    game.players.forEach((player) => {
      io.to(player.id).emit("playerInfo", player);
    });
    io.to(gameCode).emit("gameState", game);
  });

  // Handle player actions (kill/save)
  socket.on("gameAction", ({ gameCode, targetId, action }) => {
    const game = games.get(gameCode);
    if (!game || game.isGameOver) return;

    const player = game.players.find((p) => p.id === socket.id);
    if (!player || !player.isAlive) return;

    // Prevent targeting narrator
    const target = game.players.find((p) => p.id === targetId);
    if (target?.role === "narrator") return;

    // Prevent mafia targeting other mafia
    if (player.role === "mafia" && target?.role === "mafia") return;

    // Store the action without syncing
    game.actions[socket.id] = { targetId, action };

    // Update narrator's view of night actions
    if (game.phase === "night") {
      const nightInfo = getNarratorNightInfo(game);
      const narrator = game.players.find((p) => p.role === "narrator");
      if (narrator) {
        const mafiaStatus =
          nightInfo.mafiaActions.length > 0
            ? `Mafia actions: ${nightInfo.mafiaActions
                .map((a) => `${a.mafiaName} targeting ${a.targetName}`)
                .join(", ")}`
            : "Waiting for mafia actions...";

        const doctorStatus = nightInfo.doctorInfo
          ? `Doctor (${nightInfo.doctorInfo.doctorName}) protecting ${nightInfo.doctorInfo.targetName}`
          : "Waiting for doctor action...";

        game.message = `${mafiaStatus}\n${doctorStatus}`;
      }
    }

    // Process night actions if all required actions are complete
    const livingMafia = game.players.filter(
      (p) => p.role === "mafia" && p.isAlive
    );
    const livingDoctor = game.players.find(
      (p) => p.role === "doctor" && p.isAlive
    );

    const allMafiaActed =
      livingMafia.length > 0 && livingMafia.every((p) => game.actions[p.id]);
    const doctorActed = !livingDoctor || game.actions[livingDoctor.id];

    if (allMafiaActed && doctorActed) {
      // Process night actions
      const mafiaAction = Object.values(game.actions).find(
        (action) => action.action === "mafia"
      );
      const mafiaTarget = mafiaAction?.targetId;

      const doctorAction = livingDoctor
        ? Object.values(game.actions).find(
            (action) => action.action === "doctor"
          )
        : null;
      const doctorTarget = doctorAction?.targetId;

      // Initialize night results message
      let nightResults = [];

      // Set message based on what happened
      if (mafiaTarget) {
        const targetPlayer = game.players.find((p) => p.id === mafiaTarget);
        if (mafiaTarget === doctorTarget) {
          game.message = `${targetPlayer.name} (${targetPlayer.role}) was targeted but saved by the doctor!`;
          nightResults.push(
            `The Doctor successfully saved ${targetPlayer.name} from the Mafia's attack!`
          );
        } else {
          if (targetPlayer) {
            targetPlayer.isAlive = false;
            targetPlayer.isSpectator = true;
            io.to(targetPlayer.id).emit("playerInfo", targetPlayer);
            game.message = `${targetPlayer.name} (${targetPlayer.role}) was killed by the mafia!`;
            nightResults.push(
              `${targetPlayer.name} was killed by the Mafia! They were a ${targetPlayer.role}.`
            );
          }
        }

        // If doctor saved someone else while mafia killed someone
        if (doctorTarget && doctorTarget !== mafiaTarget) {
          const savedPlayer = game.players.find((p) => p.id === doctorTarget);
          nightResults.push(
            `The Doctor protected ${savedPlayer.name} tonight.`
          );
        }
      } else {
        nightResults.push("The night passes peacefully...");
      }

      // Combine all night results into a single message
      game.publicMessage = nightResults.join("\n");

      // Check if game is over
      if (checkGameEnd(game)) {
        io.to(gameCode).emit("gameState", game);
        return;
      }

      // Clear actions and move to next phase
      game.actions = {};
      game.phase = game.phase === "night" ? "day" : "night";

      if (game.phase === "night") {
        game.votes = {};
        game.players.forEach((p) => (p.votes = 0));
      }

      io.to(gameCode).emit("gameState", game);
    } else {
      // Just update the game state to show current actions
      io.to(gameCode).emit("gameState", game);
    }

    // Auto-respond for bots during night phase
    if (game.phase === "night") {
      const livingPlayers = game.players.filter(
        (p) => p.isAlive && !p.isSpectator
      );

      // Make bots take actions
      game.players.forEach((player) => {
        if (
          player.isBot &&
          player.isAlive &&
          (player.role === "mafia" || player.role === "doctor")
        ) {
          const randomTarget =
            livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
          if (randomTarget) {
            game.actions[player.id] = {
              targetId: randomTarget.id,
              action: player.role,
            };
          }
        }
      });
    }
  });

  // Handle voting during day phase
  socket.on("vote", ({ gameCode, targetId }) => {
    const game = games.get(gameCode);
    if (!game || game.phase !== "day") return;

    const player = game.players.find((p) => p.id === socket.id);
    // Only check if player is alive and not narrator
    if (!player || !player.isAlive || player.role === "narrator") return;

    // Remove previous vote
    const previousVote = game.votes[socket.id];
    if (previousVote) {
      const previousTarget = game.players.find((p) => p.id === previousVote);
      if (previousTarget) previousTarget.votes--;
    }

    // Add new vote
    game.votes[socket.id] = targetId;
    const target = game.players.find((p) => p.id === targetId);
    if (target) target.votes++;

    // Make bots vote (only if they haven't voted yet)
    game.players.forEach((player) => {
      if (
        player.isBot &&
        player.isAlive &&
        player.role !== "narrator" &&
        !game.votes[player.id]
      ) {
        const livingPlayers = game.players.filter(
          (p) => p.isAlive && p.id !== player.id
        );
        const randomTarget =
          livingPlayers[Math.floor(Math.random() * livingPlayers.length)];
        if (randomTarget) {
          game.votes[player.id] = randomTarget.id;
          randomTarget.votes = (randomTarget.votes || 0) + 1;
        }
      }
    });

    // Update the game state without eliminating players yet
    io.to(gameCode).emit("gameState", game);
  });

  // Handle next phase (narrator only)
  socket.on("nextPhase", ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    const narrator = game.players.find((p) => p.role === "narrator");
    if (narrator.id !== socket.id) return;

    // If transitioning from day to night, process votes
    if (game.phase === "day") {
      const eliminatedPlayerId = calculateVoteResults(game);

      if (eliminatedPlayerId) {
        const eliminated = game.players.find(
          (p) => p.id === eliminatedPlayerId
        );
        if (eliminated) {
          eliminated.isAlive = false;
          eliminated.isSpectator = true;
          io.to(eliminated.id).emit("playerInfo", eliminated);
          game.publicMessage = `${eliminated.name} was eliminated by vote! They were a ${eliminated.role}.`;

          if (checkGameEnd(game)) {
            io.to(gameCode).emit("gameState", game);
            return;
          }
        }
      } else {
        game.publicMessage = "No one was eliminated today.";
      }
    }

    // Switch phase and clear votes/actions
    game.phase = game.phase === "night" ? "day" : "night";
    game.votes = {};
    game.actions = {};
    game.players.forEach((p) => (p.votes = 0));

    io.to(gameCode).emit("gameState", game);
  });

  // Add reconnection handler
  socket.on("reconnect", ({ gameCode, playerId, playerName }) => {
    console.log("Reconnection attempt:", { gameCode, playerId, playerName });

    const success = handleReconnection(socket, gameCode, playerId, playerName);
    if (!success) {
      socket.emit("error", "Unable to reconnect to game");
      return;
    }

    // Notify other players
    socket.to(gameCode).emit("playerReconnected", playerName);
  });

  // Modify disconnect handler to keep player in game
  socket.on("disconnect", () => {
    for (const [gameCode, game] of games) {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        // Don't remove the player, just mark them as disconnected
        player.disconnected = true;
        io.to(gameCode).emit("gameState", game);
        break;
      }
    }
  });

  // Add new handler for adding test players
  socket.on("addTestPlayers", ({ gameCode, numPlayers }) => {
    const game = games.get(gameCode);
    if (!game || game.isGameStarted) return;

    // Add bot players
    for (let i = 0; i < numPlayers; i++) {
      const botPlayer = createBotPlayer(gameCode);
      game.players.push(botPlayer);
    }

    io.to(gameCode).emit("gameState", game);
  });

  // Add restart game handler
  socket.on("restart-game", ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    const narrator = game.players.find((p) => p.role === "narrator");
    if (narrator.id !== socket.id) return;

    // Create a new game state with the same players
    const newGame = createGameState(
      gameCode,
      game.players.map((p) => ({
        ...p,
        role: p.id === narrator.id ? "narrator" : undefined,
        isAlive: true,
        votes: 0,
        isSpectator: false,
      }))
    );

    // Assign roles to all non-narrator players
    newGame.players = assignRoles(newGame.players);
    newGame.isGameStarted = true;
    newGame.phase = "night";

    // Replace the old game with the new one
    games.set(gameCode, newGame);

    // Send updated player info to each player
    newGame.players.forEach((player) => {
      io.to(player.id).emit("playerInfo", player);
    });

    // Send the new game state to all players
    io.to(gameCode).emit("gameState", newGame);
  });

  socket.on("leaveGame", ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    // Remove player from the game
    const playerIndex = game.players.findIndex((p) => p.id === socket.id);
    if (playerIndex !== -1) {
      const player = game.players[playerIndex];
      game.players.splice(playerIndex, 1);

      // If game is empty, delete it
      if (game.players.length === 0) {
        games.delete(gameCode);
      } else {
        // If narrator leaves, assign new narrator
        if (player.role === "narrator" && !game.isGameStarted) {
          const newNarrator = game.players[0];
          newNarrator.role = "narrator";
          io.to(newNarrator.id).emit("playerInfo", newNarrator);
        }

        // Update remaining players
        io.to(gameCode).emit("gameState", game);
      }

      // Leave the socket room
      socket.leave(gameCode);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Server fully started!");
});
