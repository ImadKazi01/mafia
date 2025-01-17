import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import logo from '../assets/logo.svg';

type HomeProps = {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameCode: string, playerName: string) => void;
  error: string | null;
  initialCode?: string;
};

export function Home({ onCreateGame, onJoinGame, error, initialCode }: HomeProps) {
  const [gameCode, setGameCode] = useState(initialCode || '');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(!!initialCode);
  const [nameError, setNameError] = useState('');

  const validateName = (name: string) => {
    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    if (name.length > 20) {
      setNameError('Name must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      setNameError('Name can only contain letters, numbers, and spaces');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    if (newName) {
      validateName(newName);
    } else {
      setNameError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    if (!validateName(playerName)) {
      return;
    }

    if (isJoining || initialCode) {
      onJoinGame(gameCode || initialCode || '', playerName);
    } else {
      onCreateGame(playerName);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src={logo} 
            alt="Mafia Game Logo" 
            className="w-56 mx-auto mb-8"
          />
          {initialCode ? (
            <p className="text-gray-400">Join game: {initialCode}</p>
          ) : (
            <p className="text-gray-400">Create a new game or join an existing one</p>
          )}
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || nameError) && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-md">
                {error || nameError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                className={`w-full px-4 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none
                  ${nameError ? 'border border-red-500' : ''}`}
                placeholder="Enter your name"
                required
                autoFocus
                maxLength={20}
              />
            </div>

            {(isJoining && !initialCode) && (
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
              {!initialCode && (
                <>
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
                </>
              )}
              {initialCode && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors"
                >
                  <Users size={20} />
                  Join Game
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}