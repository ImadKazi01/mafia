import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';

type HomeProps = {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameCode: string, playerName: string) => void;
  error: string | null;
};

export function Home({ onCreateGame, onJoinGame, error }: HomeProps) {
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    if (isJoining) {
      onJoinGame(gameCode, playerName);
    } else {
      onCreateGame(playerName);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Mafia Game</h1>
          <p className="text-gray-400">Create a new game or join an existing one</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your name"
                required
              />
            </div>

            {isJoining && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Game Code
                </label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter game code"
                  required
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                onClick={() => setIsJoining(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                <UserPlus size={20} />
                Create Game
              </button>
              <button
                type="submit"
                onClick={() => setIsJoining(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
              >
                <Users size={20} />
                Join Game
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}