interface TeamDetailsProps {
  title: string;
  team: string[];
}

export const TeamDetails = ({ title, team }: TeamDetailsProps) => {
  return (
    <div class="w-full lg:w-[48.5%]">
      <h4 class="text-lg font-semibold">{title}</h4>
      <p class="truncate">{team[0]}</p>
      {team[1] ?? <p class="truncate">{team[1]}</p>}
    </div>
  );
};
