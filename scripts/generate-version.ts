import { writeFileSync } from "fs";
import { join } from "path";

const gitSha = process.env.GIT_SHA;

if (!gitSha) {
  console.error("Error: GIT_SHA is required");
  process.exit(1);
}

const versionContent = `// This file is auto-generated during build
export const VERSION = {
  gitSha: "${gitSha}",
};
`;

writeFileSync(join(process.cwd(), "src/lib/version.ts"), versionContent);
