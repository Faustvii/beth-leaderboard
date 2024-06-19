import { notEmpty } from "../lib";
import { Match } from "../lib/rating";
import { MatchDetails } from "../pages/admin/components/MatchDetails";
import { TeamDetails } from "../pages/admin/components/TeamDetails";

export const MatchDescription = ({ match }: { match: Match | undefined }) => {
  if (match === undefined) {
    return <></>;
  }

  const teamPlayers = {
    black: [match.blackPlayerOne.name, match.blackPlayerTwo?.name].filter(
      notEmpty,
    ),
    white: [match.whitePlayerOne.name, match.whitePlayerTwo?.name].filter(
      notEmpty,
    ),
  };

  return (
    <>
      <div class="flex flex-col justify-between gap-3 lg:flex-row">
        <TeamDetails title="Team White" team={teamPlayers.white} />
        <TeamDetails title="Team Black" team={teamPlayers.black} />
      </div>
      <MatchDetails
        result={match.result}
        scoreDiff={match.scoreDiff}
        dateLogged={match.createdAt}
      />
    </>
  );
};
