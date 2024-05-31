interface MatchDetailsProps {
  result: string;
  scoreDiff: number;
  dateLogged: Date;
}

export const MatchDetails = ({
  result,
  scoreDiff,
  dateLogged,
}: MatchDetailsProps) => {
  return (
    <div class="flex flex-col justify-between gap-3 lg:flex-row">
      <div>
        <h4 class="text-lg font-semibold">Result</h4>
        {result === "Draw" ? (
          <p>Draw</p>
        ) : (
          <p>
            Team {result} won with {scoreDiff}
          </p>
        )}
      </div>
      <div class="w-full lg:w-[48.5%]">
        <h4 class="text-lg font-semibold">Game Logged</h4>
        <p class="truncate">
          {dateLogged.toLocaleString("en-US", {
            hourCycle: "h24",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};
