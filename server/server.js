import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Store game sessions
const games = new Map();

// Generate a random 6-character game code
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Assign roles randomly
function assignRoles(players) {
  const roles = ['narrator'];
  const numPlayers = players.length - 1; // Excluding narrator

  // Add required roles
  roles.push('mafia', 'mafia', 'doctor');
  
  // Fill remaining slots with civilians
  while (roles.length < players.length) {
    roles.push('civilian');
  }

  // Shuffle roles (Fisher-Yates shuffle)
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Assign roles to players
  return players.map((player, index) => ({
    ...player,
    role: roles[index],
    isAlive: true,
    votes: 0,
    isSpectator: false
  }));
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Create a new game
  socket.on('createGame', ({ playerName }) => {
    const gameCode = generateGameCode();
    const player = {
      id: socket.id,
      name: playerName,
      role: 'narrator'
    };

    games.set(gameCode, {
      gameCode,
      players: [player],
      phase: 'lobby',
      isGameStarted: false,
      actions: new Map(),
      votes: new Map(),
      message: null
    });

    socket.join(gameCode);
    socket.emit('playerInfo', player);
    socket.emit('gameState', games.get(gameCode));
  });

  // Join an existing game
  socket.on('joinGame', ({ gameCode, playerName }) => {
    const game = games.get(gameCode);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.isGameStarted) {
      socket.emit('error', 'Game already started');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName
    };

    game.players.push(player);
    socket.join(gameCode);
    socket.emit('playerInfo', player);
    io.to(gameCode).emit('gameState', game);
  });

  // Start the game
  socket.on('startGame', ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    game.players = assignRoles(game.players);
    game.isGameStarted = true;
    game.phase = 'night';
    game.message = null;

    // Send updated game state to all players
    game.players.forEach(player => {
      io.to(player.id).emit('playerInfo', player);
    });
    io.to(gameCode).emit('gameState', game);
  });

  // Handle player actions (kill/save)
  socket.on('gameAction', ({ gameCode, targetId, action }) => {
    const game = games.get(gameCode);
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive) return;

    game.actions.set(socket.id, { targetId, action });

    // Check if all night actions are complete
    const livingMafia = game.players.filter(p => p.role === 'mafia' && p.isAlive);
    const mafiaActions = livingMafia.every(p => game.actions.has(p.id));
    
    const livingDoctor = game.players.find(p => p.role === 'doctor' && p.isAlive);
    const hasAllActions = mafiaActions && (!livingDoctor || game.actions.has(livingDoctor.id));

    if (hasAllActions) {
      // Process night actions
      const mafiaTarget = Array.from(game.actions.values())
        .find(action => action.action === 'mafia')?.targetId;
      
      const doctorTarget = livingDoctor ? Array.from(game.actions.values())
        .find(action => action.action === 'doctor')?.targetId : null;

      // Set message based on what happened
      if (mafiaTarget) {
        if (mafiaTarget === doctorTarget) {
          game.message = `${game.players.find(p => p.id === mafiaTarget).name} was targeted but saved by the doctor!`;
        } else {
          const targetPlayer = game.players.find(p => p.id === mafiaTarget);
          if (targetPlayer) {
            targetPlayer.isAlive = false;
            targetPlayer.isSpectator = true;
            game.message = `${targetPlayer.name} was killed during the night!`;
          }
        }
      }

      // Clear actions and switch to day phase
      game.actions.clear();
      game.phase = game.phase === 'night' ? 'day' : 'night';
      
      if (game.phase === 'night') {
        game.votes.clear();
        game.players.forEach(p => p.votes = 0);
      }

      // Send updates
      io.to(gameCode).emit('gameState', game);
    }
  });

  // Handle voting during day phase
  socket.on('vote', ({ gameCode, targetId }) => {
    const game = games.get(gameCode);
    if (!game || game.phase !== 'day') return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player || !player.isAlive || player.role === 'narrator') return;

    // Remove previous vote if exists
    const previousVote = game.votes.get(socket.id);
    if (previousVote) {
      const previousTarget = game.players.find(p => p.id === previousVote);
      if (previousTarget) previousTarget.votes--;
    }

    // Add new vote
    game.votes.set(socket.id, targetId);
    const target = game.players.find(p => p.id === targetId);
    if (target) target.votes++;

    io.to(gameCode).emit('gameState', game);
  });

  // Handle next phase (narrator only)
  socket.on('nextPhase', ({ gameCode }) => {
    const game = games.get(gameCode);
    if (!game) return;

    const narrator = game.players.find(p => p.role === 'narrator');
    if (narrator.id !== socket.id) return;

    // If transitioning from day to night, process votes
    if (game.phase === 'day') {
      const mostVotes = Math.max(...game.players.map(p => p.votes));
      const eliminated = game.players.find(p => p.votes === mostVotes && p.isAlive);
      
      if (eliminated && mostVotes > 0) {
        eliminated.isAlive = false;
        eliminated.isSpectator = true;
        game.message = `${eliminated.name} was eliminated by vote!`;
      }
    }

    // Switch phase and clear votes/actions
    game.phase = game.phase === 'night' ? 'day' : 'night';
    game.votes.clear();
    game.actions.clear();
    game.players.forEach(p => p.votes = 0);

    io.to(gameCode).emit('gameState', game);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const [gameCode, game] of games) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        if (game.players.length === 0) {
          games.delete(gameCode);
        } else {
          io.to(gameCode).emit('gameState', game);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});