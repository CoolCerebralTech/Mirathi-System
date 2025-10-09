Shamba Sure Backend Architecture

This document outlines the microservice architecture and shared library structure for the Shamba Sure platform. The architecture is designed to be scalable, maintainable, and resilient, following the principles of Domain-Driven Design.

The backend is a monorepo composed of two primary components: Shared Libraries (libs) and Applications (apps).

I. Shared Libraries (libs)

Shared libraries contain the foundational code, contracts, and configurations used across multiple microservices. They are the building blocks that ensure consistency and reduce code duplication.

1. @shamba/common

Purpose: Provides the shared language for the entire system. It contains all public-facing Data Transfer Objects (DTOs), interfaces, enums, and stateless utility functions.

Core Packages: class-validator, class-transformer

Dependencies: Depends on @shamba/database for Prisma-generated enums and types used in DTOs.

Key Principle: This library contains NO business logic. It only defines the shape and contracts of data.

2. @shamba/database

Purpose: The sole interface to the PostgreSQL database. It manages the database schema, runs migrations, and provides a type-safe Prisma Client.

Core Packages: @prisma/client, nestjs-prisma (optional)

Dependencies: None. This is a foundational library.

Key Principle: Contains the schema.prisma file, which is the single source of truth for the entire data model. No service should ever connect to the database directly; they must use the PrismaService provided by this library.

3. @shamba/auth

Purpose: Centralizes all authentication and authorization logic. Provides reusable tools to secure microservices and their endpoints.

Core Packages: @nestjs/passport, @nestjs/jwt, passport-jwt, bcrypt

Dependencies: @shamba/common (for UserPayload interface), @shamba/config (for JWT secrets).

Key Principle: Provides plug-and-play Guards, Strategies, and Decorators to enforce a consistent security policy across all applications.

4. @shamba/config

Purpose: Manages all environment-aware configuration in a centralized and type-safe manner. Validates environment variables on application startup.

Core Packages: @nestjs/config, joi

Dependencies: None. This is a foundational library.

Key Principle: A single root .env file and this module are used by all applications. No application should have its own separate .env file.

5. @shamba/messaging

Purpose: Decouples services by managing all event-driven communication via a message broker (RabbitMQ). It defines the event contracts and provides configured clients.

Core Packages: @nestjs/microservices

Dependencies: @shamba/config (for RabbitMQ URI).

Key Principle: Defines the ShambaEvents enum, which is the official list of all events that can be communicated between services.

6. @shamba/observability

Purpose: Provides standardized, pre-configured observability tools (logging, health checks, and metrics).

Core Packages: nestjs-pino, @nestjs/terminus, @nestjs/prometheus

Dependencies: @shamba/database (for the Prisma health indicator).

Key Principle: Guarantees that all services produce logs and metrics in a consistent format, making centralized monitoring effective.

II. Applications (apps)

Applications are the deployable microservices that contain the core business logic. Each service is designed around a specific business capability or domain.

1. api-gateway

Domain: Public Interface & Security

Description: The single, stateless entry point for all client requests. It handles authentication, routing, and rate limiting. It does not contain any business logic.

Dependencies: @shamba/auth, @shamba/observability, @shamba/config, @shamba/messaging (to communicate with other services).

Data Owned: None.

2. accounts-service

Domain: Identity & User Management

Description: Manages user registration, login, profile information, and credentials. It is the owner of the User entity.

Dependencies: All libs.

Data Owned: Users, Profiles.

Events Published: UserCreated, UserUpdated, PasswordResetRequested.

3. succession-service

Domain: Core Business Logic (Estate & Succession)

Description: The heart of the platform. It handles the creation and management of wills, family trees (HeirLink™), assets, and the entire succession planning process.

Dependencies: All libs.

Data Owned: Wills, Assets, FamilyMembers, HeirAssignments.

Events Published: WillCreated, HeirAssigned, EstateUpdated.

Events Subscribed To: UserCreated.

4. documents-service

Domain: Document Lifecycle Management

Description: A specialized service for handling the secure upload, storage (metadata), and verification of all user documents (e.g., Title Deeds, ID scans).

Dependencies: All libs.

Data Owned: Documents, DocumentVersions.

Events Published: DocumentUploaded, DocumentVerified.

5. notifications-service

Domain: Outbound Communications

Description: A centralized service for sending all emails, SMS messages, and push notifications. It acts primarily as a listener to events from other services.

Dependencies: All libs.

Data Owned: NotificationLogs (optional).

Events Subscribed To: UserCreated, PasswordResetRequested, HeirAssigned, etc.

6. auditing-service

Domain: Compliance & Security Logging

Description: Creates an immutable, append-only log of all significant business events that occur within the system for security and compliance purposes.

Dependencies: All libs.

Data Owned: AuditLogs.

Events Subscribed To: All major business events from all other services.
