#!/usr/bin/env bash
set -euo pipefail

NETWORK="${MINIO_DOCKER_NETWORK:-backend_default}"
BUCKET="${MINIO_BUCKET_NAME:-icare-chat}"
MINIO_URL="${MINIO_INTERNAL_URL:-http://minio:9000}"
MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-icare-cvd-postgres}"

SUBFOLDERS=(
  profile
  chat/images
  chat/files
  labs
  imaging/xray
  imaging/echo
  imaging/ecg
  imaging/cine-mri
  imaging/ct
  imaging/ecg-cls
  documents
)

mapfile -t PATIENTS < <(
  docker exec "$POSTGRES_CONTAINER" psql -U postgres -d icare_cvd -t -A \
    -c "SELECT patient_number FROM patient ORDER BY patient_number;"
)

if [[ ${#PATIENTS[@]} -eq 0 ]]; then
  echo "No patients found in database."
  exit 1
fi

echo "Creating MinIO folders for ${#PATIENTS[@]} patient(s) in bucket: ${BUCKET}"

docker run --rm --network "$NETWORK" --entrypoint /bin/sh minio/mc:latest -c "
  set -e
  mc alias set local ${MINIO_URL} ${MINIO_USER} ${MINIO_PASS}
  mc mb --ignore-existing local/${BUCKET}
  $(for pn in "${PATIENTS[@]}"; do
    for sub in "${SUBFOLDERS[@]}"; do
      echo "printf '' | mc pipe local/${BUCKET}/patients/${pn}/${sub}/.keep"
    done
  done)
  echo 'Done.'
  mc ls --recursive local/${BUCKET}/patients/ | head -60
"

echo "MinIO patient folder structure initialized."
