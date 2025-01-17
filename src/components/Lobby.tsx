import React, { useState } from 'react';
import { GameState, Player } from '../types';
import { Copy, Check } from 'lucide-react';

type LobbyProps = {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onAddTestPlayers?: (numPlayers: number) => void;
};

export function Lobby({ gameState, currentPlayer, onStartGame, onAddTestPlayers }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?code=${gameState.gameCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNarrator = currentPlayer.role === 'narrator';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Game Lobby</h1>
          <div className="flex items-center justify-center gap-4 mb-4">
            <p className="text-xl bg-gray-800 px-4 py-2 rounded">
              Game Code: {gameState.gameCode}
            </p>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check size={20} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Share Link
                </>
              )}
            </button>
          </div>
          <p className="text-gray-400">Players: {gameState.players.length}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <div className="space-y-2">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
              >
                <span>{player.name}</span>
                {player.isBot && <span className="text-gray-400">(Bot)</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Test Controls */}
        {isNarrator && onAddTestPlayers && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="flex gap-4">
              <button
                onClick={() => onAddTestPlayers(3)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
              >
                Add 3 Bots
              </button>
              <button
                onClick={() => onAddTestPlayers(5)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
              >
                Add 5 Bots
              </button>
            </div>
          </div>
        )}

        {isNarrator && (
          <div className="text-center">
            <button
              onClick={onStartGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg"
              disabled={gameState.players.length < 4}
            >
              Start Game
            </button>
            {gameState.players.length < 4 && (
              <p className="text-red-400 mt-2">Need at least 4 players to start</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}