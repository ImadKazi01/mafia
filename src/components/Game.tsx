import React, { useState, useEffect } from 'react';
import { Shield, Skull, User, Crown, Eye } from 'lucide-react';
import { GameState, Player } from '../types';

type GameProps = {
  gameState: GameState;
  currentPlayer: Player;
  onAction: (targetId: string) => void;
  onLeaveGame: () => void;
};

export function Game({ gameState, currentPlayer, onAction, onLeaveGame }: GameProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Find the most up-to-date player info from gameState
  const updatedPlayerInfo = gameState.players.find(p => p.id === currentPlayer?.id);
  const isEliminated = updatedPlayerInfo ? !updatedPlayerInfo.isAlive : false;
  
  const isNight = gameState.phase === 'night';
  const isSpectator = updatedPlayerInfo ? !updatedPlayerInfo.isAlive : false;
  const canAct = isNight && !isSpectator && (currentPlayer?.role === 'mafia' || currentPlayer?.role === 'doctor');
  const canVote = !isNight && !isSpectator && currentPlayer?.role !== 'narrator';
  const narrator = gameState.players.find(p => p.role === 'narrator');
  const isMafia = currentPlayer?.role === 'mafia';
  const isDoctor = currentPlayer?.role === 'doctor';
  const isGameOver = gameState.isGameOver;

  // Get other mafia members and their targets
  const mafiaMembers = gameState.players.filter(p => p.role === 'mafia' && p.isAlive);
  const mafiaActions = Object.entries(gameState.actions)
    .filter(([_, action]) => action.action === 'mafia')
    .map(([playerId, action]) => ({
      mafiaName: gameState.players.find(p => p.id === playerId)?.name,
      targetName: gameState.players.find(p => p.id === action.targetId)?.name
    }));

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

  const shouldShowRole = (player: Player) => {
    return gameState.isGameOver || 
           !player.isAlive || 
           isSpectator || 
           currentPlayer?.role === 'narrator' || 
           (isMafia && player.role === 'mafia');
  };

  const handleAction = (targetId: string) => {
    if (isEliminated) return;
    setSelectedPlayer(targetId);
    onAction(targetId);
  };

  // Filter players to exclude narrator from targeting
  const targetablePlayers = gameState.players.filter(p => 
    p.id !== currentPlayer?.id && 
    p.role !== 'narrator' &&
    (currentPlayer?.role !== 'mafia' || p.role !== 'mafia') // Mafia can't target other mafia
  );

  const getWinnerIcon = () => {
    if (!gameState.publicMessage) return null;
    
    if (gameState.publicMessage.includes('Mafia Wins')) {
      return <Skull className="text-red-500 w-24 h-24 mx-auto mb-6" />;
    }
    if (gameState.publicMessage.includes('Civilians Win')) {
      return <Crown className="text-yellow-500 w-24 h-24 mx-auto mb-6" />;
    }
    return null;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsReconnecting(true);
        // The socket will automatically try to reconnect
        setTimeout(() => setIsReconnecting(false), 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-900/90 p-4 text-center shadow-lg z-50">
          <p className="text-yellow-100 font-bold">
            Reconnecting to game...
          </p>
        </div>
      )}
      {isEliminated && (
        <div className="fixed top-0 left-0 right-0 bg-red-900/90 p-4 text-center shadow-lg z-50">
          <p className="text-xl text-red-100 font-bold mb-1">
            You have been eliminated!
          </p>
          <p className="text-red-200">
            You are now a spectator. Watch the game continue as a ghost...
          </p>
        </div>
      )}
      
      <div className={`min-h-screen bg-gray-900 text-white p-4 flex items-center justify-center ${isEliminated ? 'opacity-50' : ''}`}>
        <div className="max-w-2xl w-full">
          {isGameOver ? (
            <>
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-6">Game Over</h1>
                {getWinnerIcon()}
                <p className="text-2xl text-yellow-400 mb-8">{gameState.publicMessage}</p>
                <div className="flex items-center justify-center gap-4 mb-8">
                  {currentPlayer?.role === 'narrator' && (
                    <button
                      onClick={() => onAction('restart-game')}
                      className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-lg transition-colors text-xl"
                    >
                      Start New Game with Same Players
                    </button>
                  )}
                  <button
                    onClick={onLeaveGame}
                    className="bg-gray-600 hover:bg-gray-700 px-8 py-4 rounded-lg transition-colors text-xl"
                  >
                    Leave Game
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Final Player Roles</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className={`
                        p-4 rounded-lg flex items-center justify-between
                        ${!player.isAlive ? 'bg-gray-700 opacity-50' : 'bg-gray-700'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(player.role)}
                        <span>{player.name}</span>
                        <span className="text-sm text-gray-400">
                          ({player.role})
                        </span>
                      </div>
                      {!player.isAlive && (
                        <span className="text-sm text-red-500">Dead</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
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
                    `You are a ${currentPlayer?.role}`
                  )}
                </p>
                {isMafia && !isSpectator && (
                  <div className="text-red-400 mt-2">
                    <p>Other Mafia members:</p>
                    {mafiaMembers.filter(m => m.id !== currentPlayer?.id).map(m => (
                      <span key={m.id} className="mx-1">{m.name}</span>
                    ))}
                    {mafiaActions.length > 0 && (
                      <div className="mt-2">
                        <p>Current targets:</p>
                        {mafiaActions
                          .filter(action => action.mafiaName && action.targetName)
                          .map((action, index) => (
                            <p key={index} className="text-sm">
                              {action.mafiaName} is targeting {action.targetName}
                            </p>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {gameState.message && currentPlayer?.role === 'narrator' && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
                  <p className="text-lg text-yellow-400">Narrator Info: {gameState.message}</p>
                </div>
              )}

              {gameState.publicMessage && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
                  <p className="text-lg text-yellow-400">{gameState.publicMessage}</p>
                </div>
              )}

              {isDoctor && isNight && !isSpectator && (
                <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
                  <p className="text-lg text-green-400 mb-3">Doctor's Actions</p>
                  <button
                    onClick={() => handleAction(currentPlayer?.id)}
                    className={`
                      bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors
                      ${selectedPlayer === currentPlayer?.id ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    Save Yourself
                  </button>
                </div>
              )}

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isDoctor && isNight ? 'Save Others' : 'Players'}
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {targetablePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => (canAct || canVote) && !isEliminated && handleAction(player.id)}
                      disabled={(!canAct && !canVote) || isEliminated}
                      className={`
                        p-4 rounded-lg flex items-center justify-between
                        ${!player.isAlive ? 'bg-gray-700 opacity-50' : 'bg-gray-700 hover:bg-gray-600'}
                        ${selectedPlayer === player.id ? 'ring-2 ring-blue-500' : ''}
                        ${(canAct || canVote) && !isEliminated ? 'cursor-pointer' : 'cursor-not-allowed'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(shouldShowRole(player) ? player.role : undefined)}
                        <span>{player.name}</span>
                        {shouldShowRole(player) && (
                          <span className="text-sm text-red-500 ml-2">
                            ({player.role})
                          </span>
                        )}
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

              {currentPlayer?.role === 'narrator' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => onAction('next-phase')}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
                  >
                    Next Phase
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}