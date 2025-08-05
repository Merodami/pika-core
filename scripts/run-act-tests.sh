#!/bin/bash
# Script to run act tests with proper MinIO setup

# Start MinIO manually if not already running
if ! docker ps | grep -q "pika_minio"; then
  echo "Starting MinIO container..."
  docker run -d \
    --name act_minio \
    -p 19000:9000 \
    -p 19001:9001 \
    -e MINIO_ROOT_USER=minioadmin \
    -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio:RELEASE.2024-01-01T16-36-33Z server /data --console-address ":9001"
fi

# Run act with modified workflow
act push -W .github/workflows/ci.yml -j test --env AWS_S3_ENDPOINT=http://host.docker.internal:19000

# Clean up
echo "Cleaning up MinIO container..."
docker stop act_minio 2>/dev/null || true
docker rm act_minio 2>/dev/null || true