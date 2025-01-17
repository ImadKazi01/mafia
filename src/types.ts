export type Player = {
  id: string;
  name: string;
  role?: 'mafia' | 'doctor' | 'civilian' | 'narrator';
  isAlive?: boolean;
  votes?: number;
  isSpectator?: boolean;
  isBot?: boolean;
};

export type GameAction = {
  targetId: string;
  action: string;
};

export type GameState = {
  gameCode: string;
  players: Player[];
  phase: 'lobby' | 'night' | 'day';
  isGameStarted: boolean;
  isGameOver: boolean;
  message: string | null;
  publicMessage: string | null;
  actions: { [key: string]: GameAction };
  votes: { [key: string]: string };
  nightInfo?: {
    mafiaActions: Array<{
      mafiaName: string;
      targetName: string;
    }>;
    doctorInfo?: {
      doctorName: string;
      targetName: string;
    } | null;
  };
};