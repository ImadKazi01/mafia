import React, { useState } from 'react';
import { GameState, Player } from '../types';
import { Share2, Check } from 'lucide-react';

type LobbyProps = {
  gameState: GameState;
  currentPlayer: Player;
  onStartGame: () => void;
  onLeaveGame: () => void;
};

export function Lobby({ gameState, currentPlayer, onStartGame, onLeaveGame }: LobbyProps) {
  const [shared, setShared] = useState(false);
  const isNarrator = currentPlayer.role === 'narrator';

  const handleShare = async () => {
    const url = `${window.location.origin}?code=${gameState.gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Mafia game!',
          text: 'Join my game of Mafia!',
          url: url
        });
        setShared(true);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
    }
    
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full overflow-y-auto max-h-screen py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Game Lobby</h1>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <p className="text-xl bg-gray-800 px-4 py-2 rounded">
              Game Code: {gameState.gameCode}
            </p>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
            >
              {shared ? (
                <>
                  <Check size={20} />
                  Shared!
                </>
              ) : (
                <>
                  <Share2 size={20} />
                  Share Game
                </>
              )}
            </button>
          </div>

          <p className="text-gray-400 mb-8">Players: {gameState.players.length}</p>

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

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onLeaveGame}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors text-lg font-semibold"
            >
              ← Leave Game
            </button>
            
            {isNarrator && (
              <button
                onClick={onStartGame}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors text-lg font-semibold"
                disabled={gameState.players.length < 4}
              >
                Start Game
              </button>
            )}
          </div>
          
          {gameState.players.length < 4 && isNarrator && (
            <p className="text-red-400 mt-2">Need at least 4 players to start</p>
          )}
        </div>
      </div>
    </div>
  );
}