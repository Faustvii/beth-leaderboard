#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOYMENT_URL:?DEPLOYMENT_URL is required}"
: "${EXPECTED_SHA:?EXPECTED_SHA is required}"

# Both preview and production must serve the commit baked into the image.
for attempt in $(seq 1 90); do
    if page=$(curl --connect-timeout 5 --max-time 10 -fsS "${DEPLOYMENT_URL%/}/") &&
        grep -Fq "/commit/$EXPECTED_SHA\"" <<< "$page"; then
        echo "$DEPLOYMENT_URL is serving commit $EXPECTED_SHA."
        exit 0
    fi
    echo "Waiting for $DEPLOYMENT_URL to serve commit $EXPECTED_SHA ($attempt/90)."
    if (( attempt < 90 )); then
        sleep 10
    fi
done

echo "Deployment did not serve commit $EXPECTED_SHA within the rollout timeout." >&2
exit 1
