interface Props {
  children: JSX.Element;
  seasonId: number;
  matchId: number;
}

export const MatchResultLink = ({ children, seasonId, matchId }: Props) => (
  <a class="underline" href={`/result/${seasonId}/${matchId}`}>
    {children}
  </a>
);
