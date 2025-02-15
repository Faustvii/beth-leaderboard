# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.0.6
FROM oven/bun:${BUN_VERSION}-slim as base

# Redeclare ARG values so they are available in this stage
ARG APP_USER=nonroot
ARG APP_GROUP=nonroot
ARG APP_UID=10000
ARG APP_GID=10001

# Create user and group
RUN groupadd -g ${APP_GID} ${APP_GROUP} && \
    useradd -m -u ${APP_UID} -g ${APP_GROUP} ${APP_USER}

# Set environment variables so they persist across stages
ENV APP_USER=${APP_USER}
ENV APP_GROUP=${APP_GROUP}

# Ensure /app is owned by the correct user/group
RUN mkdir -p /app && chown -R ${APP_USER}:${APP_GROUP} /app

LABEL fly_launch_runtime="Bun"

# Set working directory and switch user
WORKDIR /app
USER ${APP_USER}:${APP_GROUP}

# Set production environment
ENV NODE_ENV="production"
ENV LOG_LEVEL=info

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY --link --chown=${APP_USER}:${APP_GROUP} bun.lockb package.json ./
RUN bun install -p --ci

# Copy application code
COPY --link --chown=${APP_USER}:${APP_GROUP} . .

# Minify CSS
RUN bun tw

# Final stage for app image
FROM base

# Copy built application
COPY --from=build --chown=${APP_USER}:${APP_GROUP} /app /app

# Expose port and start the app
EXPOSE 3000
CMD [ "bun", "--smol", "src/main.ts" ]
