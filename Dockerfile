# syntax = docker/dockerfile:1

# Define static build arguments (only available before first FROM)
ARG BUN_VERSION=1.0.6
ARG APP_UID=10000
ARG APP_GID=10001

FROM oven/bun:${BUN_VERSION}-slim as base

# Redeclare ARG values so they are available in this stage
ARG APP_UID
ARG APP_GID

# Create user and group
RUN groupadd -g ${APP_GID} nonroot && \
    useradd -m -u ${APP_UID} -g nonroot nonroot

# Ensure /app is owned by the correct user/group
RUN mkdir -p /app && chown -R ${APP_UID}:${APP_GID} /app

LABEL fly_launch_runtime="Bun"

# Set working directory and switch user
WORKDIR /app
USER ${APP_UID}:${APP_GID}

# Set production environment
ENV NODE_ENV="production"
ENV LOG_LEVEL=info

# Throw-away build stage to reduce size of final image
FROM base as build

# Redeclare numeric UID/GID arguments
ARG APP_UID
ARG APP_GID

# Install node modules
COPY --link --chown=${APP_UID}:${APP_GID} bun.lockb package.json ./
RUN bun install -p --ci

# Copy application code
COPY --link --chown=${APP_UID}:${APP_GID} . .

# Minify CSS
RUN bun tw

# Final stage for app image
FROM base

# Redeclare numeric UID/GID arguments
ARG APP_UID
ARG APP_GID

# Copy built application
COPY --from=build --chown=${APP_UID}:${APP_GID} /app /app

# Expose port and start the app
EXPOSE 3000
CMD [ "bun", "--smol", "src/main.ts" ]
