export const MatchItemHtml = async ({
  game,
  first,
  page,
}: {
  first: boolean;
  page: number;
  game: {
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
  };
}) => {
  return (
    <MatchCard {...game} />
    // <>
    //   {first ? (
    //     <div
    //       class="text-white"
    //       hx-get={`/leaderboard/page/${page + 1}`}
    //       _="on htmx:afterRequest remove @hx-trigger from me"
    //       hx-indicator=".progress-bar"
    //       hx-trigger="intersect once"
    //       hx-swap="beforeend"
    //       hx-target={`#nextPageData`}
    //     >
    //       <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">{game.result}.</td>
    //       {/* <th
    //         scope="row"
    //         class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-white md:flex md:px-3 lg:px-6"
    //       >
    //         <div class="col-span-2">
    //           <WinLoseStreak
    //             lastPlayed={lastPlayed}
    //             streak={streak}
    //             isWinStreak={isWinStreak}
    //           />
    //         </div>
    //         <img
    //           class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
    //           src={`/static/user/${userId}/small`}
    //           loading="lazy"
    //           alt=""
    //         />
    //         <div class="col-span-8 flex flex-col gap-0 text-left">
    //           <HxButton
    //             class="w-44 overflow-hidden truncate whitespace-nowrap text-left"
    //             hx-get={`/profile/${userId}`}
    //           >
    //             {name}
    //           </HxButton>
    //           <LatestResults latestPlayerResults={results} />
    //         </div>
    //       </th>
    //       <td class="px-1 py-4 md:px-3 lg:px-6">{elo}</td> */}
    //     </div>
    //   ) : (
    //     <div class="border-b border-gray-700 bg-gray-800">
    //       <td class="px-1 py-4 pl-2 md:px-3 lg:px-6">{game.result}.</td>
    //       {/* <th
    //         scope="row"
    //         class="grid grid-cols-12 items-center gap-3 whitespace-nowrap px-1 py-4 font-medium text-white md:flex md:px-3 lg:px-6"
    //       >
    //         <div class="col-span-2">
    //           <WinLoseStreak
    //             lastPlayed={lastPlayed}
    //             streak={streak}
    //             isWinStreak={isWinStreak}
    //           />
    //         </div>
    //         <img
    //           class="col-span-2 mr-1 inline-block h-8 w-8 rounded-full ring-2 ring-gray-700 lg:mr-3 lg:h-8 lg:w-8"
    //           src={`/static/user/${userId}/small`}
    //           loading="lazy"
    //           alt=""
    //         />
    //         <div class="col-span-8 flex flex-col gap-0 text-left">
    //           <HxButton
    //             class="w-44 overflow-hidden truncate whitespace-nowrap text-left md:w-full"
    //             hx-get={`/profile/${userId}`}
    //           >
    //             {name}
    //           </HxButton>
    //           <LatestResults latestPlayerResults={results} />
    //         </div>
    //       </th>
    //       <td class="px-1 py-4 md:px-3 lg:px-6">{elo}</td> */}
    //     </div>
    //   )}
    // </>
  );
};

export const MatchCard = ({
  id,
  whitePlayerOne,
  whitePlayerTwo,
  blackPlayerOne,
  blackPlayerTwo,
  result,
  scoreDiff,
  whiteEloChange,
  blackEloChange,
  createdAt,
}: {
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
}) => {
  return (
    <div class="w-full rounded-lg bg-slate-500 p-5">
      <span>{whitePlayerOne}</span>
      <span>{whitePlayerTwo}</span>
      <span>{blackPlayerOne}</span>
      <span>{blackPlayerTwo}</span>
      <span>{result}</span>
      <span>{scoreDiff}</span>
      <span>{whiteEloChange}</span>
      <span>{blackEloChange}</span>
      <span>{createdAt}</span>
    </div>
  );
};
