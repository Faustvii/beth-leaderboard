interface MatchWithPlayers {
  id: number;
  whitePlayerOne: Player;
  whitePlayerTwo: Player | null;
  blackPlayerOne: Player;
  blackPlayerTwo: Player | null;
  result: "Black" | "White" | "Draw";
  scoreDiff: number;
  seasonId: number;
  createdAt: Date;
  positionsRecorded: boolean;
}

interface Player {
  id: string;
  name: string;
  nickname: string;
}
