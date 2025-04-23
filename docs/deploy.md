# Deployment Guide

This document provides instructions for deploying the Task Management Collaborative application using Docker, Docker Compose, and Kubernetes.

## Prerequisites

- Docker and Docker Compose installed
- Kubernetes cluster (for production deployment)
- kubectl configured to connect to your cluster

## Local Development Environment

The easiest way to run the application locally is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/task-management-app.git
cd task-management-app

# Start the application
cd infra
docker-compose up -d
```

This will start:
- MongoDB database
- Backend API (available at http://localhost:5000)
- Frontend application (available at http://localhost:3000)

## Production Deployment using Kubernetes

### 1. Build and Push Docker Images

```bash
# Set your Docker registry
export DOCKER_REGISTRY="your-registry"

# Build backend image
cd src/backend
docker build -t $DOCKER_REGISTRY/task-management-backend:latest .
docker push $DOCKER_REGISTRY/task-management-backend:latest

# Build frontend image
cd ../frontend
docker build -t $DOCKER_REGISTRY/task-management-frontend:latest .
docker push $DOCKER_REGISTRY/task-management-frontend:latest
```

### 2. Create Kubernetes Secrets

Edit the `infra/k8s/secrets.yaml` file to set your MongoDB URI and JWT secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  mongo-uri: mongodb://your-mongodb-host:27017/task-management
  jwt-secret: your-secure-jwt-secret
```

Apply the secrets:

```bash
kubectl apply -f infra/k8s/secrets.yaml
```

### 3. Deploy the Application

```bash
# Replace the Docker registry placeholder in the deployment file
sed -i 's/${DOCKER_REGISTRY}/your-registry/g' infra/k8s/deployment.yaml

# Apply Kubernetes manifests
kubectl apply -f infra/k8s/deployment.yaml
kubectl apply -f infra/k8s/service.yaml
```

### 4. Verify Deployment

```bash
kubectl get pods
kubectl get services
```

The frontend service should be exposed with a LoadBalancer. Get the external IP:

```bash
kubectl get service frontend-service
```

## Deployment to Cloud Platforms

### AWS EKS

1. Create an EKS cluster using eksctl or the AWS Console
2. Configure kubectl to connect to your EKS cluster
3. Follow the Kubernetes deployment steps above
4. For DNS configuration, use AWS Route 53 to point to the LoadBalancer

### Heroku

1. Install the Heroku CLI
2. Log in to the Heroku Container Registry:
   ```bash
   heroku container:login
   ```
3. Create Heroku apps for frontend and backend:
   ```bash
   heroku create task-app-backend
   heroku create task-app-frontend
   ```
4. Push containers:
   ```bash
   cd src/backend
   heroku container:push web -a task-app-backend
   heroku container:release web -a task-app-backend
   
   cd ../frontend
   heroku container:push web -a task-app-frontend
   heroku container:release web -a task-app-frontend
   ```
5. Configure environment variables in Heroku dashboard

### DigitalOcean App Platform

1. Create a new App
2. Connect your GitHub repository
3. Configure as a Docker App
4. Set environment variables
5. Deploy

## Continuous Deployment

For continuous deployment, see the CI/CD configuration in `.github/workflows/cd.yml`. 