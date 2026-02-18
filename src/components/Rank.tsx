export function Rank({
  rank,
  isLowestRanked,
  showLastPlaceMedal = true,
}: {
  rank: number;
  isLowestRanked: boolean;
  showLastPlaceMedal?: boolean;
}): JSX.Element {
  if (isLowestRanked && showLastPlaceMedal) {
    return (
      <span aria-label="last place" class="text-xl">
        👎
      </span>
    );
  }

  switch (rank) {
    case 1:
      return (
        <span aria-label="1st place" class="text-xl">
          🥇
        </span>
      );
    case 2:
      return (
        <span aria-label="2nd place" class="text-xl">
          🥈
        </span>
      );
    case 3:
      return (
        <span aria-label="3rd place" class="text-xl">
          🥉
        </span>
      );
    default:
      return <span>{rank}.</span>;
  }
}
