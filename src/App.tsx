import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Home } from './components/Home';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { GameState, Player } from './types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);

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

  useEffect(() => {
    if (socket) {
      socket.on('gameState', (updatedState: GameState) => {
        setGameState(updatedState);
      });

      socket.on('playerInfo', (playerInfo: Player) => {
        setCurrentPlayer(playerInfo);
      });

      return () => {
        socket.off('gameState');
        socket.off('playerInfo');
      };
    }
  }, [socket]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !gameState) {
      window.history.replaceState({}, '', window.location.pathname);
      setJoinCode(code);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState && currentPlayer) {
      sessionStorage.setItem('gameSession', JSON.stringify({
        gameCode: gameState.gameCode,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name
      }));
    }
  }, [gameState, currentPlayer]);

  useEffect(() => {
    const savedSession = sessionStorage.getItem('gameSession');
    if (savedSession && socket) {
      const session = JSON.parse(savedSession);
      socket.emit('reconnect', session);
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('disconnect', () => {
      console.log('Disconnected from server, attempting to reconnect...');
    });

    socket.on('connect', () => {
      const savedSession = sessionStorage.getItem('gameSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        socket.emit('reconnect', session);
      }
    });

    return () => {
      socket.off('disconnect');
      socket.off('connect');
    };
  }, [socket]);

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

  const handleGameAction = (action: string) => {
    if (!gameState || !currentPlayer) return;

    if (action === 'next-phase') {
      socket?.emit('nextPhase', { gameCode: gameState.gameCode });
      return;
    }

    if (action === 'restart-game') {
      socket?.emit('restart-game', { gameCode: gameState.gameCode });
      return;
    }

    if (gameState.phase === 'night') {
      socket?.emit('gameAction', {
        gameCode: gameState.gameCode,
        targetId: action,
        action: currentPlayer.role
      });
    } else {
      socket?.emit('vote', {
        gameCode: gameState.gameCode,
        targetId: action
      });
    }
  };

  const handleLeaveGame = () => {
    if (socket && gameState) {
      socket.emit('leaveGame', { gameCode: gameState.gameCode });
    }
    sessionStorage.removeItem('gameSession');
    setGameState(null);
    setCurrentPlayer(null);
  };

  if (!gameState) {
    return (
      <Home
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        error={error}
        initialCode={joinCode}
      />
    );
  }

  if (!gameState.isGameStarted) {
    return (
      <Lobby
        gameState={gameState}
        currentPlayer={currentPlayer!}
        onStartGame={handleStartGame}
        onLeaveGame={handleLeaveGame}
      />
    );
  }

  return (
    <Game
      gameState={gameState}
      currentPlayer={currentPlayer!}
      onAction={handleGameAction}
      onLeaveGame={handleLeaveGame}
    />
  );
}