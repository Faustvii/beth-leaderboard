import { measure } from "../lib";
import {
  getMatchesWithPlayers,
  getMatchesWithPlayersHighPerformance,
} from "./queries/matchQueries";

const measurementsWithPlayers = [];
const measurementsTwoSqlPlayers = [];

// warmup
await getMatchesWithPlayersHighPerformance();
await getMatchesWithPlayers();

for (let index = 0; index < 250; index++) {
  const { elaspedTimeMs } = await measure(async () => {
    return await getMatchesWithPlayers();
  });
  measurementsWithPlayers.push(elaspedTimeMs);
}

for (let index = 0; index < 250; index++) {
  const { elaspedTimeMs } = await measure(async () => {
    return await getMatchesWithPlayersHighPerformance();
  });
  measurementsTwoSqlPlayers.push(elaspedTimeMs);
}

console.log(
  `current stats query: ${
    measurementsWithPlayers.reduce((a, b) => a + b, 0) /
    measurementsWithPlayers.length
  } ms`,
);
console.log(
  `new stats query: ${
    measurementsTwoSqlPlayers.reduce((a, b) => a + b, 0) /
    measurementsTwoSqlPlayers.length
  } ms`,
);
