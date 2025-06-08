# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1.2.15-debian AS base
WORKDIR /usr/src/app

RUN apt update
RUN apt install -y python3 build-essential

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun build --compile --sourcemap --target=bun ./src/main.ts --outfile leaderboard
RUN bun tw

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules /node_modules
COPY --from=prerelease /usr/src/app/leaderboard ./leaderboard
COPY --from=prerelease /usr/src/app/drizzle ./drizzle
COPY --from=prerelease /usr/src/app/public ./public
RUN mkdir -p /usr/src/app/public/user
RUN mkdir -p /usr/src/app/data
RUN chown bun:bun /usr/src/app/public/user
RUN chown bun:bun /usr/src/app/data

ENV migrationFolderTo=/usr/src/app/drizzle/

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "./leaderboard" ]