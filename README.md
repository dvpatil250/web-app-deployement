
# Deployment of simple web application on github to AWS ECS

This README provides instructions for setting up and using a GitHub Actions CI/CD pipeline for automated deployment of a simple web application to AWS Elastic Container Service (ECS). The pipeline includes stages for building Docker images, pushing them to Amazon Elastic Container Registry (ECR), deploying to ECS, and performing integration tests with rollback functionality.


## Table of Contents

Prerequisites

Setup

Usage

Testing

Rollback

Additional Notes

## Table of Contents

Prerequisites

Setup

Usage

Testing

Rollback

Additional Notes

## Table of Contents

Prerequisites

Setup

Usage

Testing

Rollback

Additional Notes

## Prerequisites
1.GitHub Repository: A GitHub repository containing your web application code.

2.AWS Account: Access to an AWS account with permissions to use ECS and ECR.

3.GitHub Secrets: Configure the following secrets in your GitHub repository:

->AWS_ACCESS_KEY_ID

->AWS_SECRET_ACCESS_KEY

->ECR_REGISTRY (e.g., 022499010637.dkr.ecr.us-east-1.amazonaws.com)

->ECS_CLUSTER_NAME

->ECS_SERVICE_NAME


## Setup
Create a Dockerfile with a multi-stage build for your application. The first stage uses Node.js to build the application, and the second stage uses Nginx to serve the static content.

```bash
  # Use a Node.js image if you need to process or build files; otherwise, it's not required for static sites.
FROM node:18 AS build

# Create and set the working directory
WORKDIR /app

# Copy application files into the container
COPY . .

# Stage 2: Production stage
# Use Nginx to serve the static content
FROM nginx:alpine

# Copy the static files from the build stage to the Nginx server
COPY --from=build /app /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```



Create a ".github/workflows/deploy.yml" file in your repository with the following content
```bash

name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:
    name: Build and Push Docker Image
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Cache Docker layers
      uses: actions/cache@v3
      with:
        path: /tmp/.buildx-cache
        key: ${{ runner.os }}-docker-${{ github.sha }}
        restore-keys: |
          ${{ runner.os }}-docker-

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      uses: aws-actions/amazon-ecr-login@v1
      with:
        registry-type: private
        skip-logout: false

    - name: Build Docker Image
      run: |
        docker buildx build \
          --file Dockerfile \
          --tag 022499010637.dkr.ecr.us-east-1.amazonaws.com/apple \
          --push \
          .

  deploy:
    name: Deploy to ECS
    runs-on: ubuntu-latest
    needs: build

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Register ECS Task Definition
      run: |
        aws ecs register-task-definition --cli-input-json file://greps.json


    - name: Update ECS Service
      run: |
        aws ecs update-service \
          --cluster ${{ secrets.ECS_CLUSTER }} \
          --service ${{ secrets.ECS_SERVICE }} \
          --force-new-deployment

  test:
    name: Run Integration Tests
    runs-on: ubuntu-latest
    needs: deploy
    if: success()

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'

    - name: Run Simple Test
      run: |
        python -c "print('Running integration test...')"
        # Replace the above line with any simple test or command
        # Example: echo "Test passed"

  rollback:
    name: Rollback on Failure
    runs-on: ubuntu-latest
    if: failure()
    needs: test

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Configure AWS Credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Rollback ECS Service
      run: |
        echo "Rolling back..."
        aws ecs update-service \
          --cluster ${{ secrets.ECS_CLUSTER }} \
          --service ${{ secrets.ECS_SERVICE }} \
          --force-new-deployment \
          --deployment-configuration maximumPercent=100,minimumHealthyPercent=0

```
## AWS Setup:

1.create roll in IAM as 'ecsTaskExecutionRole' and attach policy 'AmazonECSTaskExecutionRolePolicy'

2.Create User in IAM,and attach policy like 'AdministratorAccess' and 'AmazonECSTaskExecutionRolePolicy'

3.go to ECR and create repository.where image will be pushed.

4.go to ECS and create cluster.after that create a task defination,inside task defination select Task execution role as 'ecsTaskExecutionRole'.also give container name and image URL (copied from ECR).now create service in cluster and choose familly as task defination name which is we created previously.
## Usage
1.Push Code: Push your code changes to the 'main' branch of your GitHub repository.

2.Automated Pipeline: The GitHub Actions pipeline will trigger automatically on each push to the 'main' branch.

3.Monitoring: Monitor the progress of the workflow in the "Actions" tab of your GitHub repository

## Testing
After deploying, run integration tests to ensure the deployment is successful. If tests fail, the pipeline will automatically trigger a rollback to the previous stable version.

## Rollback
In case of failure during the deployment or integration testing, the rollback stage will revert the service to the last known good state.

## Additional Notes
1.The last two builds failed because I terminated the ECS cluster after a successful deployment and capturing of snapshots. Be aware that AWS will incur charges related to this.

2.ECS task definition is correctly configured in the 'greps.json' file.here i have given ECS task definition file name as greps.json