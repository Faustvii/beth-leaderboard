// import { eq } from "drizzle-orm";
// import { generateRandomString } from "lucia/utils";
// import { writeDb } from ".";
// import { applyMatchResult, matchEloChange } from "../lib/elo";
// import { type GameResult } from "../types/elo";
// import { type matches, type user } from "./schema";

// type newPlayer = typeof user.$inferInsert;
// type newMatch = typeof matches.$inferInsert;
// const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
// const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1).getTime() - 1;

// for (let index = 0; index < 1; index++) {
//   const player: newPlayer = {
//     id: generateRandomString(15),
//     name: `Player ${index}`,
//     elo: 1000,
//     email: "fake@fake.crokinole",
//   };

//   await writeDb.insert(user).values(player);
// }

// for (let index = 0; index < 170; index++) {
//   const players = await writeDb.query.user.findMany();
//   if (index % 50 == 0) console.log("creating elo match " + index + " of 100");

//   const whitePlayerOne = players[Math.floor(Math.random() * players.length)];
//   const whitePlayerTwo = players[Math.floor(Math.random() * players.length)];
//   const blackPlayerOne = players[Math.floor(Math.random() * players.length)];
//   const blackPlayerTwo = players[Math.floor(Math.random() * players.length)];
//   // Generate a random date within this year
//   const matchDate = new Date(
//     startOfYear + Math.random() * (endOfYear - startOfYear),
//   );

//   const result =
//     Math.random() > 0.9 ? "Draw" : Math.random() > 0.5 ? "Black" : "White";
//   //960 is 4 rounds of only 20 shots and all misses for opposite team
//   const scoreDiff =
//     result === "Draw" ? 0 : Math.min(Math.floor(Math.random() * 20) * 5, 960);
//   const match: GameResult = {
//     outcome: result === "Black" ? "loss" : result === "White" ? "win" : "draw",
//     teams: [
//       {
//         color: "White",
//         players: [
//           {
//             id: whitePlayerOne.id,
//             elo: whitePlayerOne.elo,
//           },
//           {
//             id: whitePlayerTwo.id,
//             elo: whitePlayerTwo.elo,
//           },
//         ],
//       },
//       {
//         color: "Black",
//         players: [
//           {
//             id: blackPlayerOne.id,
//             elo: blackPlayerOne.elo,
//           },
//           {
//             id: blackPlayerTwo.id,
//             elo: blackPlayerTwo.elo,
//           },
//         ],
//       },
//     ],
//   };
//   const eloChange = matchEloChange(match);
//   applyMatchResult({ eloFloor: 0 }, match);

//   const matchInsert: newMatch = {
//     whitePlayerOne: whitePlayerOne.id,
//     blackPlayerOne: blackPlayerOne.id,
//     result: result,
//     scoreDiff: scoreDiff,
//     whiteEloChange: eloChange.white,
//     blackEloChange: eloChange.black,
//     whitePlayerTwo: whitePlayerTwo.id,
//     blackPlayerTwo: blackPlayerTwo.id,
//     createdAt: matchDate,
//   };

//   await writeDb.transaction(async (trx) => {
//     await trx.insert(matches).values(matchInsert);

//     for (const team of match.teams) {
//       for (const player of team.players) {
//         await trx
//           .update(user)
//           .set({ elo: player.elo })
//           .where(eq(user.id, player.id));
//       }
//     }
//   });
//   await Bun.sleep(250);
// }
