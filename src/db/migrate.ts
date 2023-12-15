import { readDb } from ".";
import { playerEloQuery } from "./queries/matchQueries";
import { type User } from "./schema/auth";
import { matches, type InsertMatch } from "./schema/matches";

const users = await readDb.query.userTbl.findMany();
const mismatchedUsers: User[] = [];
for (const user of users) {
  const elo = await playerEloQuery(user.id, 1);

  if (elo !== user.elo) {
    mismatchedUsers.push(user);
  }
}
console.log(`${mismatchedUsers.length} users have incorrect elo`);

for (let i = 0; i < mismatchedUsers.length; i += 2) {
  const user1 = mismatchedUsers[i];
  const user2 = mismatchedUsers[i + 1];
  const eloUser1 = await playerEloQuery(user1.id, 1);
  const eloUser2 = await playerEloQuery(user2.id, 1);
  console.log(
    `${user1.name} elo is ${eloUser1} but should be ${
      user1.elo
    } to get there we need to change it by ${user1.elo - eloUser1}`,
  );
  console.log(
    `${user2.name} elo is ${eloUser2} but should be ${
      user2.elo
    } to get there we need to change it by ${user2.elo - eloUser2}`,
  );

  const newMatch: InsertMatch = {
    blackPlayerOne: user1.id,
    whitePlayerOne: user2.id,
    result: "Draw",
    scoreDiff: 0,
    blackEloChange: user1.elo - eloUser1,
    whiteEloChange: user2.elo - eloUser2,
    seasonId: 1,
    createdAt: new Date(2023, 1, 1),
  };
  await readDb.insert(matches).values(newMatch);
}
