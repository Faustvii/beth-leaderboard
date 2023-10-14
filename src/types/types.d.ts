interface MatchWithPlayers {
  id: number;
  whitePlayerOne: Player;
  whitePlayerTwo: Player | null;
  blackPlayerOne: Player;
  blackPlayerTwo: Player | null;
  result: "Black" | "White" | "Draw";
  scoreDiff: number;
  whiteEloChange: number;
  blackEloChange: number;
  createdAt: Date;
}

interface Player {
  id: string;
  name: string;
  elo: number;
}
