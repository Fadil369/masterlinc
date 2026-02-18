#!/bin/bash

# Push MasterLinc Docker images to Docker Hub
# Usage: ./push-to-dockerhub.sh

DOCKER_USERNAME="fadil369b"
VERSION="1.0.0"

echo "🚀 Pushing MasterLinc images to Docker Hub..."
echo "Username: $DOCKER_USERNAME"
echo ""

# Tag and push FHIR Server
echo "📦 Processing FHIR Server..."
docker tag masterlinc_clone-fhir-server:latest $DOCKER_USERNAME/masterlinc-fhir-server:$VERSION
docker tag masterlinc_clone-fhir-server:latest $DOCKER_USERNAME/masterlinc-fhir-server:latest
docker push $DOCKER_USERNAME/masterlinc-fhir-server:$VERSION
docker push $DOCKER_USERNAME/masterlinc-fhir-server:latest
echo "✅ FHIR Server pushed"
echo ""

# Tag and push Payment Gateway
echo "💳 Processing Payment Gateway..."
docker tag masterlinc_clone-payment-gateway:latest $DOCKER_USERNAME/masterlinc-payment-gateway:$VERSION
docker tag masterlinc_clone-payment-gateway:latest $DOCKER_USERNAME/masterlinc-payment-gateway:latest
docker push $DOCKER_USERNAME/masterlinc-payment-gateway:$VERSION
docker push $DOCKER_USERNAME/masterlinc-payment-gateway:latest
echo "✅ Payment Gateway pushed"
echo ""

# Tag and push Audit Logger
echo "📝 Processing Audit Logger..."
docker tag masterlinc_clone-audit-logger:latest $DOCKER_USERNAME/masterlinc-audit-logger:$VERSION
docker tag masterlinc_clone-audit-logger:latest $DOCKER_USERNAME/masterlinc-audit-logger:latest
docker push $DOCKER_USERNAME/masterlinc-audit-logger:$VERSION
docker push $DOCKER_USERNAME/masterlinc-audit-logger:latest
echo "✅ Audit Logger pushed"
echo ""

echo "🎉 All images pushed successfully!"
echo ""
echo "📦 Available images:"
echo "  - $DOCKER_USERNAME/masterlinc-fhir-server:$VERSION"
echo "  - $DOCKER_USERNAME/masterlinc-payment-gateway:$VERSION"
echo "  - $DOCKER_USERNAME/masterlinc-audit-logger:$VERSION"
echo ""
echo "Pull with:"
echo "  docker pull $DOCKER_USERNAME/masterlinc-fhir-server:latest"
