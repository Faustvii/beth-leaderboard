import { notEmpty } from "../lib";
import { type Match } from "../lib/ratings/rating";
import { isSingles, sideLabel } from "../lib/seats";
import { MatchDetails } from "../pages/admin/components/MatchDetails";
import { TeamDetails } from "../pages/admin/components/TeamDetails";

export const MatchDescription = ({ match }: { match: Match | undefined }) => {
  if (match === undefined) {
    return <></>;
  }

  // In a 1v1 the side title *is* the player, so don't list the name twice.
  const singles = isSingles(match);
  const teamPlayers = {
    black: singles
      ? []
      : [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
          notEmpty,
        ),
    white: singles
      ? []
      : [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
          notEmpty,
        ),
  };

  return (
    <div class="mb-6 flex flex-col gap-3">
      <div class="flex flex-col justify-between gap-3 lg:flex-row">
        <TeamDetails
          title={sideLabel("White", match)}
          team={teamPlayers.white}
        />
        <TeamDetails
          title={sideLabel("Black", match)}
          team={teamPlayers.black}
        />
      </div>
      <MatchDetails
        result={match.result}
        winnerLabel={
          match.result === "Draw" ? "Draw" : sideLabel(match.result, match)
        }
        scoreDiff={match.scoreDiff}
        dateLogged={match.createdAt}
      />
    </div>
  );
};
