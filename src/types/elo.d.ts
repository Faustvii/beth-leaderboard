export interface Player {
  id: string;
  elo: number;
}

export interface Team {
  id: string;
  players: Player[];
}

export interface GameResult {
  outcome: "win" | "loss" | "draw";
  teams: [Team, Team];
}

export interface EloConfig {
  eloFloor: number;
}
