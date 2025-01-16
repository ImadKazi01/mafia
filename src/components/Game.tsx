import React, { useState } from 'react';
import { Shield, Skull, User, Crown, Eye } from 'lucide-react';
import { GameState, Player } from '../types';

type GameProps = {
  gameState: GameState;
  currentPlayer: Player;
  onAction: (targetId: string) => void;
};

export function Game({ gameState, currentPlayer, onAction }: GameProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const isNight = gameState.phase === 'night';
  const isSpectator = !currentPlayer.isAlive;
  const canAct = isNight && !isSpectator && (currentPlayer.role === 'mafia' || currentPlayer.role === 'doctor');
  const canVote = !isNight && !isSpectator && currentPlayer.role !== 'narrator';
  const narrator = gameState.players.find(p => p.role === 'narrator');

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'mafia':
        return <Skull className="text-red-500" />;
      case 'doctor':
        return <Shield className="text-green-500" />;
      case 'narrator':
        return <Crown className="text-yellow-500" />;
      default:
        return <User className="text-blue-500" />;
    }
  };

  const handleAction = (targetId: string) => {
    if (isSpectator) return;
    setSelectedPlayer(targetId);
    onAction(targetId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isNight ? 'Night Phase' : 'Day Phase'}
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            {isSpectator ? (
              <span className="flex items-center justify-center gap-2">
                <Eye className="text-purple-400" />
                Spectator Mode
              </span>
            ) : (
              `You are a ${currentPlayer.role}`
            )}
          </p>
          <p className="text-lg text-gray-400">
            Narrator: {narrator?.name}
          </p>
        </div>

        {gameState.message && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
            <p className="text-lg text-yellow-400">{gameState.message}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {gameState.players
              .filter((p) => p.id !== currentPlayer.id)
              .map((player) => (
                <button
                  key={player.id}
                  onClick={() => (canAct || canVote) && handleAction(player.id)}
                  disabled={(!canAct && !canVote) || !player.isAlive}
                  className={`
                    p-4 rounded-lg flex items-center justify-between
                    ${!player.isAlive ? 'bg-gray-700 opacity-50' : 'bg-gray-700 hover:bg-gray-600'}
                    ${selectedPlayer === player.id ? 'ring-2 ring-blue-500' : ''}
                    ${(canAct || canVote) ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(isSpectator || currentPlayer.role === 'narrator' ? player.role : undefined)}
                    <span>{player.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isNight && player.votes && player.votes > 0 && (
                      <span className="text-sm bg-blue-600 px-2 py-1 rounded">
                        {player.votes} votes
                      </span>
                    )}
                    {!player.isAlive && (
                      <span className="text-sm text-red-500">Dead</span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {currentPlayer.role === 'narrator' && (
          <div className="mt-6 text-center">
            <button
              onClick={() => onAction('next-phase')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
            >
              Next Phase
            </button>
          </div>
        )}
      </div>
    </div>
  );
}