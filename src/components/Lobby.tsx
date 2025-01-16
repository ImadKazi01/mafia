import React from 'react';
import { Users, Play } from 'lucide-react';
import { GameState, Player } from '../types';

type LobbyProps = {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
};

export function Lobby({ gameState, currentPlayer, onStartGame }: LobbyProps) {
  const isNarrator = currentPlayer.role === 'narrator';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Game Lobby</h1>
          <div className="bg-gray-800 p-4 rounded-lg inline-block">
            <p className="text-lg mb-2">Game Code:</p>
            <p className="text-3xl font-mono font-bold text-blue-400">{gameState.gameCode}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={24} />
            <h2 className="text-xl font-semibold">Players ({gameState.players.length})</h2>
          </div>
          <ul className="space-y-2">
            {gameState.players.map((player) => (
              <li
                key={player.id}
                className="bg-gray-700 p-3 rounded-md flex items-center justify-between"
              >
                <span>{player.name}</span>
                {player.role === 'narrator' && (
                  <span className="text-sm bg-blue-600 px-2 py-1 rounded">Narrator</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isNarrator && gameState.players.length >= 4 && (
          <button
            onClick={onStartGame}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play size={20} />
            Start Game
          </button>
        )}

        {!isNarrator && (
          <p className="text-center text-gray-400">
            Waiting for the narrator to start the game...
          </p>
        )}
      </div>
    </div>
  );
}