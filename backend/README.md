# Backend - Library Management System

This is a Spring Boot 3 Java application built to run as a single "Fat Lambda" on AWS.

## Architecture
- **Framework**: Spring Boot 3 (Java 17+)
- **Data Access**: Spring Data JDBC
- **Database**: PostgreSQL (via RDS Proxy)
- **Migrations**: Flyway

## Folder Structure
```
src/main/java/com/library/
├── handlers/     # AWS Lambda entry points (ApiHandler.java)
├── controllers/  # Spring REST Controllers
├── services/     # Business logic
├── repositories/ # Spring Data JDBC interfaces
├── models/       # Database Entities
├── dto/          # Data Transfer Objects
├── config/       # Spring & AWS configuration
└── util/         # Helper classes
```

## Local Development
1. Ensure Java 17+ and Maven are installed.
2. Run `mvn clean install` to build the shaded JAR.
