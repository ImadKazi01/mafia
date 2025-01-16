export type Player = {
  id: string;
  name: string;
  role?: 'mafia' | 'doctor' | 'civilian' | 'narrator';
  isAlive?: boolean;
  votes?: number;
  isSpectator?: boolean;
};

export type GameState = {
  gameCode: string;
  players: Player[];
  phase: 'lobby' | 'night' | 'day';
  isGameStarted: boolean;
  message: string | null;
};