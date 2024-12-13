import { type Quest } from "../lib/quest";

export const QuestDescription = ({
  quest,
}: {
  quest: Quest<unknown> | undefined;
}) => {
  if (quest === undefined) {
    return <></>;
  }

  return (
    <>
      <div class="flex flex-col justify-between gap-3 lg:flex-row">
        {quest.description}
      </div>
    </>
  );
};
