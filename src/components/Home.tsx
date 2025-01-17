import React, { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import logo from "../assets/logo.svg";

type HomeProps = {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameCode: string, playerName: string) => void;
  error: string | null;
  initialCode?: string;
};

export function Home({
  onCreateGame,
  onJoinGame,
  error,
  initialCode,
}: HomeProps) {
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState(initialCode || "");
  const [nameError, setNameError] = useState("");

  const validateName = (name: string) => {
    if (name.length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    if (name.length > 20) {
      setNameError("Name must be less than 20 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      setNameError("Name can only contain letters, numbers, and spaces");
      return false;
    }
    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    if (newName) {
      validateName(newName);
    } else {
      setNameError("");
    }
  };

  const handleCreateGame = () => {
    if (!playerName.trim() || !validateName(playerName)) return;
    onCreateGame(playerName);
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !validateName(playerName)) return;
    onJoinGame(gameCode, playerName);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src={logo} alt="Mafia Game Logo" className="w-56 mx-auto mb-8" />
          {initialCode ? (
            <p className="text-gray-400">Join game: {initialCode}</p>
          ) : (
            <p className="text-gray-400">
              Create a new game or join an existing one
            </p>
          )}
        </div>

        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          {(error || nameError) && (
            <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-2 rounded-md mb-6">
              {error || nameError}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                className="w-full px-4 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
            </div>

            {initialCode ? (
              <button
                onClick={() => onJoinGame(initialCode, playerName)}
                disabled={!playerName || !!nameError}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus size={20} />
                Join Game
              </button>
            ) : (
              <>
                <div className="flex gap-4">
                  <button
                    onClick={handleCreateGame}
                    disabled={!playerName || !!nameError}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Users size={20} />
                    Create Game
                  </button>

                  <button
                    onClick={handleJoinGame}
                    disabled={!playerName || !gameCode || !!nameError}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus size={20} />
                    Join Game
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Game Code
                  </label>
                  <input
                    type="text"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter game code"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
