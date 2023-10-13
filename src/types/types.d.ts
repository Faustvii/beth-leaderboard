interface MatchWithPlayers {
  id: number;
  whitePlayerOne: {
    name: string;
    id: string;
    elo: number;
  };
  whitePlayerTwo: {
    name: string;
    id: string;
    elo: number;
  } | null;
  blackPlayerOne: {
    name: string;
    id: string;
    elo: number;
  };
  blackPlayerTwo: {
    name: string;
    id: string;
    elo: number;
  } | null;
  result: "Black" | "White" | "Draw";
  scoreDiff: number;
  whiteEloChange: number;
  blackEloChange: number;
  createdAt: Date;
}
