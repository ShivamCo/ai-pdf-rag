#!/bin/bash

# Exit immediately if any command fails
set -e

PROJECT_ID="ai-pdf-506012"
REGION="asia-south1"
SERVICE_NAME="ai-pdf-server"
IMAGE_TAG="asia-south1-docker.pkg.dev/${PROJECT_ID}/my-app-repo/${SERVICE_NAME}:latest"

echo "📦 1/2 Building container on Google Cloud Build..."
gcloud builds submit server/ \
  --tag "${IMAGE_TAG}" \
  --project="${PROJECT_ID}"

echo ""
echo "🚀 2/2 Deploying updated revision to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_TAG}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300

echo ""
echo "✅ Server successfully deployed! Live URL:"
gcloud run services describe "${SERVICE_NAME}" --region="${REGION}" --project="${PROJECT_ID}" --format="value(status.url)"
