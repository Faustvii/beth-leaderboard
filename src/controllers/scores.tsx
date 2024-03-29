import Elysia from "elysia";
import { getMatches } from "../db/queries/matchQueries";
import { elo, getScores, openskill } from "../lib/scoring";

// TODO: this file should not exist
export const scores = new Elysia({
  prefix: "/scores",
}).get("scores", async () => {
  const matches = await getMatches(2);

  const es = elo();
  const eloScores = getScores(matches, es);

  const os = openskill();
  const openSkillScores = getScores(matches, os);

  return {
    elo: eloScores.map(({ player, score }) => ({
      player,
      score: es.display(score),
    })),
    openskill: openSkillScores.map(({ player, score }) => ({
      player,
      score: os.display(score),
    })),
  };
});
