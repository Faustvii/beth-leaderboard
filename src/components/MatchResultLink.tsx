interface Props {
  children: JSX.Element;
  matchId: number;
}

export const MatchResultLink = ({ children, matchId }: Props) => (
  <a class="underline" href={`/result/${matchId}`}>
    {children}
  </a>
);
