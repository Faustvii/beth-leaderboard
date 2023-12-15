import { measure } from "../lib";

const measurementsWithPlayers = [];
const measurementsTwoSqlPlayers = [];

// warmup
// await playerPaginationQuery(1);
// await testPlayerPaginationQuery(1);

for (let index = 0; index < 250; index++) {
  const { elaspedTimeMs } = await measure(async () => {
    // return await playerPaginationQuery(1);
  });
  measurementsWithPlayers.push(elaspedTimeMs);
}

for (let index = 0; index < 250; index++) {
  const { elaspedTimeMs } = await measure(async () => {
    // return await testPlayerPaginationQuery(1);
  });
  measurementsTwoSqlPlayers.push(elaspedTimeMs);
}

console.log(
  `current pagination query: ${
    measurementsWithPlayers.reduce((a, b) => a + b, 0) /
    measurementsWithPlayers.length
  } ms`,
);
console.log(
  `new pagination query: ${
    measurementsTwoSqlPlayers.reduce((a, b) => a + b, 0) /
    measurementsTwoSqlPlayers.length
  } ms`,
);
