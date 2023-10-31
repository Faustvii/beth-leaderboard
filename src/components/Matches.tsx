import { MatchItemHtml } from "./MatchItem";

export const MatchesHtml = ({
  games,
  page,
}: {
  page: number;
  games: {
    id: number;
    whitePlayerOne: string;
    whitePlayerTwo: string | null;
    blackPlayerOne: string;
    blackPlayerTwo: string | null;
    result: "Black" | "White" | "Draw";
    scoreDiff: number;
    whiteEloChange: number;
    blackEloChange: number;
    createdAt: Date;
  }[];
}) => (
  <>
    <div class="flex flex-col items-center justify-center">
      <div class="w-full overflow-x-auto rounded-lg shadow-md">
        {games.map((game, index) => (
          <MatchItemHtml game={game} first={index === 0} page={page} />
        ))}
      </div>
    </div>
  </>
);
