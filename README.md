# Library Management System (AWS Serverless + React + Java)

This repository contains the completely modernized, cloud-native Library Management System, rebuilt using a Serverless architecture on AWS.

## Architecture

The system is decoupled into three primary modules:
- **Frontend (`/frontend`)**: A React SPA built with Vite and AWS Cognito SDK for auth. Hosted on S3 + CloudFront.
- **Backend (`/backend`)**: A Spring Boot "Fat Lambda" exposing REST APIs. Utilizes Spring Data JDBC for fast startup and connects to PostgreSQL.
- **Infrastructure (`/infrastructure`)**: AWS CDK (TypeScript) code defining the full multi-stack environment.

## Getting Started

Refer to the individual `README.md` files in each directory for local development setup:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Infrastructure README](./infrastructure/README.md)