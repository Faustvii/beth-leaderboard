# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.0.6
FROM oven/bun:${BUN_VERSION}-slim as base

LABEL fly_launch_runtime="Bun"

# Bun app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ENV LOG_LEVEL=info

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY --link bun.lockb package.json ./
RUN bun install -p --ci

# Copy application code
COPY --link . .

# Minify css
RUN bun tw

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Forcing a low RAM size will cause more frequent GC
# https://github.com/oven-sh/bun/issues/6548#issuecomment-2254940542
ENV BUN_JSC_forceRAMSize=134217728

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "--smol", "src/main.ts" ]
