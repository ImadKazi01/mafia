import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { GameState, Player } from './types';

const SOCKET_URL = 'http://localhost:3000';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
      setError(null);
    });

    newSocket.on('playerInfo', (player: Player) => {
      setCurrentPlayer(player);
      setError(null);
    });

    newSocket.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateGame = (playerName: string) => {
    socket?.emit('createGame', { playerName });
  };

  const handleJoinGame = (gameCode: string, playerName: string) => {
    socket?.emit('joinGame', { gameCode, playerName });
  };

  const handleStartGame = () => {
    if (gameState) {
      socket?.emit('startGame', { gameCode: gameState.gameCode });
    }
  };

  const handleGameAction = (targetId: string) => {
    if (!gameState || !currentPlayer) return;

    if (currentPlayer.role === 'narrator' && targetId === 'next-phase') {
      socket?.emit('nextPhase', { gameCode: gameState.gameCode });
    } else if (gameState.phase === 'night' && (currentPlayer.role === 'mafia' || currentPlayer.role === 'doctor')) {
      socket?.emit('gameAction', {
        gameCode: gameState.gameCode,
        targetId,
        action: currentPlayer.role
      });
    } else if (gameState.phase === 'day' && currentPlayer.role !== 'narrator') {
      socket?.emit('vote', {
        gameCode: gameState.gameCode,
        targetId
      });
    }
  };

  if (!gameState) {
    return (
      <Home
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        error={error}
      />
    );
  }

  if (!gameState.isGameStarted) {
    return (
      <Lobby
        gameState={gameState}
        currentPlayer={currentPlayer!}
        onStartGame={handleStartGame}
      />
    );
  }

  return (
    <Game
      gameState={gameState}
      currentPlayer={currentPlayer!}
      onAction={handleGameAction}
    />
  );
}