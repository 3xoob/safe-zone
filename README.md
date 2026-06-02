# Buy-01 Marketplace

Buy-01 is a full-stack marketplace application built with Spring Boot microservices, MongoDB, Spring Cloud Gateway, Eureka Discovery, JWT authentication, local image storage, and an Angular single-page frontend.

The application supports public product browsing, client accounts, seller accounts, seller-owned product management, image uploads, product-media association, and role-based access control.

## Features

- Public product listing and product detail pages.
- Client and seller registration/login with JWT authentication.
- BCrypt password hashing.
- Profile read/update for authenticated users.
- Seller-only product create, update, and delete operations.
- Product ownership checks for seller updates/deletes.
- Seller media upload, list, download, and delete operations.
- Image validation by MIME type, file size, and file signature.
- Automatic association between uploaded media and selected products.
- Angular frontend with guards, interceptors, services, standalone components, and responsive UI.

## Architecture

```text
Browser
  |
  v
Angular Frontend :4200
  |
  v
Spring Cloud Gateway :8080
  |
  +-- User Service :8081
  +-- Product Service :8082
  +-- Media Service :8083
  |
  v
Eureka Discovery :8761

MongoDB :27017
Local uploads: ./uploads
```

## Services

| Service | Responsibility |
| --- | --- |
| `discovery-service` | Eureka service registry. |
| `gateway-service` | External API boundary, CORS, JWT validation, routing, identity header forwarding. |
| `user-service` | User registration, login, JWT issuing, BCrypt hashing, profile endpoints. |
| `product-service` | Public product reads and seller-owned product CRUD. |
| `media-service` | Image upload/download/delete, validation, metadata persistence, product association. |
| `frontend` | Angular SPA for public browsing, auth, profile, seller catalog, and media management. |

## Domain Model

The implementation follows the provided diagram in `image.png`.

### User

```text
id: String
name: String
email: String
password: String, BCrypt hash
role: CLIENT | SELLER
avatar: String
createdAt: Instant
updatedAt: Instant
```

### Product

```text
id: String
name: String
description: String
price: Double
quantity: Integer
userId: String
imageUrls: List<String>
createdAt: Instant
updatedAt: Instant
```

### Media

```text
id: String
imagePath: String
productId: String
sellerId: String
contentType: String
size: Long
createdAt: Instant
```

Relationships:

- One `User` can own many `Product` records through `Product.userId`.
- One `Product` can have many `Media` records through `Media.productId`.
- Uploaded media is also linked into `Product.imageUrls` for frontend display.

## Quick Start

Prerequisites:

- Docker
- Docker Compose v2

Start the full application:

```bash
./run-full-project.sh
```

The script builds and starts all services, waits for the gateway to become healthy, waits for Eureka registration, and prints the access URLs.

Default URLs when using the script:

| Surface | URL |
| --- | --- |
| Frontend | `http://localhost:4200` |
| Gateway API | `http://localhost:18080/api` |
| Gateway health | `http://localhost:18080/actuator/health` |
| Eureka dashboard | `http://localhost:8761` |

The script uses gateway port `18080` by default to avoid common local conflicts with port `8080`.

To override ports:

```bash
GATEWAY_PORT=8080 FRONTEND_PORT=4200 ./run-full-project.sh
```

Stop the stack:

```bash
GATEWAY_PORT=18080 FRONTEND_PORT=4200 docker compose down
```

Reset all persisted MongoDB data:

```bash
GATEWAY_PORT=18080 FRONTEND_PORT=4200 docker compose down -v
```

## Manual Access

There are no hardcoded seeded users. Register accounts from the UI or through the API.

Recommended manual test accounts:

```text
Seller
Email: seller@example.com
Password: Password123!
Role: SELLER

Client
Email: client@example.com
Password: Password123!
Role: CLIENT
```

If an email already exists, use another email or reset MongoDB with `docker compose down -v`.

## API Overview

Base URL when using `run-full-project.sh`:

```text
http://localhost:18080/api
```

Base URL when using plain Docker Compose defaults:

```text
http://localhost:8080/api
```

### Public Endpoints

```text
POST /auth/register
POST /auth/login
GET  /products
GET  /products/{id}
GET  /media/images/{id}
```

### Protected Endpoints


```text
GET    /users/me
PUT    /users/me
POST   /products              SELLER only
PUT    /products/{id}          SELLER owner only
DELETE /products/{id}          SELLER owner only
GET    /media                  SELLER only
POST   /media/images           SELLER only
DELETE /media/images/{id}      SELLER owner only
```

## API Examples

Register a seller:

```bash
curl -X POST http://localhost:18080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Seller","email":"seller@example.com","password":"Password123!","role":"SELLER"}'
```

Login:

```bash
curl -X POST http://localhost:18080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"seller@example.com","password":"Password123!"}'
```

Use the returned token:

```text
Authorization: Bearer <token>
```

Create a product as a seller:

```bash
curl -X POST http://localhost:18080/api/products \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{"name":"Laptop","description":"Good laptop","price":120.5,"quantity":10,"imageUrls":[]}'
```

Upload product media as a seller:

```bash
curl -X POST http://localhost:18080/api/media/images \
  -H 'Authorization: Bearer <token>' \
  -F 'productId=<product-id>' \
  -F 'file=@image.png'
```

## Media Rules

- Only image files are accepted.
- Maximum upload size is `2 MB`.
- The backend validates MIME type and image signatures for PNG, JPEG, GIF, and WebP.
- Image bytes are stored in `./uploads`.
- MongoDB stores media metadata, not image bytes.
- Uploaded images are automatically associated with the selected product.

## Security

- Passwords are stored as BCrypt hashes.
- JWT tokens are issued by `user-service` and validated by `gateway-service`.
- Protected routes require `Authorization: Bearer <token>`.
- The gateway forwards authenticated identity via `X-User-Id`, `X-User-Email`, and `X-User-Role`.
- Seller-only endpoints enforce role checks.
- Product update/delete operations enforce ownership.
- Media delete operations enforce ownership.
- Input validation is implemented with Jakarta Validation and service-level checks.
- Sensitive data such as password hashes is not returned in API responses.
- HTTPS is not enabled for local Docker development. It is documented as a production deployment requirement.

## Frontend

The Angular frontend includes:

- Standalone components.
- Lazy routes.
- Functional route guards.
- HTTP interceptor for JWT attachment.
- Reactive forms with inline validation.
- Role-aware navigation.
- Public product listing/detail pages.
- Seller dashboard, product form, and media manager.
- Responsive styling for desktop and mobile.

Local frontend development:

```bash
cd frontend
npm install
npm start
```

The frontend calls `/api`. Local development uses `frontend/proxy.conf.json`, and Docker uses `frontend/proxy.docker.conf.json`.

## Backend Development

Start MongoDB:

```bash
docker compose up mongodb
```

Run services individually from their service directories:

```bash
mvn spring-boot:run
```

Backend modules are under `backend/`:

```text
backend/discovery-service
backend/gateway-service
backend/user-service
backend/product-service
backend/media-service
```

## Error Handling

Services return structured JSON errors:

```json
{
  "status": 400,
  "message": "Validation message",
  "timestamp": "2026-05-02T12:00:00Z"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | Validation error, invalid upload, or upload too large. |
| `401` | Missing or invalid JWT. |
| `403` | Wrong role or ownership violation. |
| `404` | Resource not found. |
| `405` | Unsupported HTTP method. |
| `409` | Duplicate email. |

## Verification Checklist

The following flows were tested through the gateway and frontend proxy:

```text
seller_register HTTP:201
client_register HTTP:201
duplicate_email HTTP:409
seller_me HTTP:200
client_product_create_blocked HTTP:403
seller_product_create HTTP:201
product_get HTTP:200
product_update HTTP:200
invalid_upload HTTP:400
valid_upload HTTP:201
product_get_after_upload HTTP:200
product_image_linked OK
image_download HTTP:200
media_delete HTTP:204
product_delete HTTP:204
frontend_products_route HTTP:200
frontend_api_proxy HTTP:200
```

## Known Choices

- Kafka is not included because it is optional for this project.
- MinIO is not included. Images are stored on the local filesystem to keep the deployment simple and auditable.
- HTTPS is not enabled locally. Use a reverse proxy or platform TLS termination for production.
- No admin role is implemented because the required roles are client and seller.

## Jenkins CI/CD Audit Setup

This project includes a Jenkins pipeline that automates checkout, tool validation, backend tests, frontend tests, Docker builds, Docker Compose deployment, health verification, rollback, JUnit report publishing, and email notifications.

Audit verification uses a GitHub webhook pointed at Jenkins `/github-webhook/` so pushes to `main` trigger the pipeline automatically.

CI/CD files:

```text
Jenkinsfile
jenkins/Dockerfile
jenkins/docker-compose.jenkins.yml
scripts/health-check.sh
scripts/rollback.sh
frontend/karma.conf.js
```

### Pipeline Flow

```text
Checkout
Validate Tools
Backend Tests
Frontend Install
Frontend Tests
Frontend Build
Docker Build
Backup Current Deployment
Deploy
Health Check
Email Notification / Rollback
```

Any failing build, test, deploy, or health-check command returns a non-zero exit code and stops the pipeline. On failure, Jenkins runs `scripts/rollback.sh` and sends a failure email.

### Start Jenkins Locally

Prerequisites:

- Docker
- Docker Compose v2

Start Jenkins:

```bash
docker compose -f jenkins/docker-compose.jenkins.yml up -d --build
```

Open Jenkins:

```text
http://localhost:8085
```

Get the first admin password:

```bash
docker logs buy01-jenkins
```

The Jenkins image installs Java, Maven, Git, Node.js, Docker CLI, Docker Compose, and Chromium for Angular headless tests.

### Required Jenkins Plugins

Install these plugins from **Manage Jenkins > Plugins**:

- Pipeline
- Git
- GitHub
- GitHub Branch Source
- Docker Pipeline
- JUnit
- Credentials Binding
- Mailer

### Jenkins Credentials

Create this credential before running the pipeline:

```text
Location: Manage Jenkins > Credentials > System > Global credentials
Kind: Secret text
ID: jwt-secret
Secret: a long random JWT signing secret
```

The pipeline injects this value as `JWT_SECRET` during Docker build, deploy, and rollback. The application Compose file requires `JWT_SECRET`; no JWT signing secret is hardcoded in committed configuration.

For local development, copy `.env.example` to `.env` and set a local secret. The real `.env` file is ignored by Git.

### Email Notifications

The pipeline sends success, unstable, and failure emails to:

```text
ali.almoumnin@gmail.com
```

Configure SMTP in Jenkins:

```text
Manage Jenkins > System > E-mail Notification
SMTP server: your SMTP provider, for example smtp.gmail.com
SMTP port: your SMTP provider port, for example 587
Use SMTP Authentication: enabled if required
Use TLS: enabled if required
```

Run a test email from Jenkins after configuring SMTP. Without working SMTP settings, the pipeline can call `mail`, but delivery will fail.

### Jenkins Job Configuration

Create a Pipeline job:

```text
Job type: Pipeline
Definition: Pipeline script from SCM
SCM: Git
Repository URL: <your GitHub repository URL>
Branch: main
Script Path: Jenkinsfile
```

The `Jenkinsfile` includes `githubPush()` and the job should also enable:

```text
GitHub hook trigger for GITScm polling
```

### GitHub Webhook

In GitHub, add a webhook:

```text
Payload URL: http://<jenkins-host>:8085/github-webhook/
Content type: application/json
Events: Push events
```

After this, every push to `main` should start the pipeline automatically. If Jenkins runs on a private machine, expose Jenkins with a reachable URL or use a tunnel/reverse proxy for webhook delivery.

### Parameterized Builds

The pipeline supports these build parameters:

| Parameter | Default | Purpose |
| --- | --- | --- |
| `DEPLOY_ENV` | `local` | Deployment target label. |
| `GATEWAY_PORT` | `18080` | Host port for the gateway. |
| `FRONTEND_PORT` | `4200` | Host port for the Angular frontend. |
| `RUN_BACKEND_TESTS` | `true` | Enables Maven tests. |
| `RUN_FRONTEND_TESTS` | `true` | Enables Angular/Karma tests. |

### Automated Tests And Reports

Backend tests run with:

```bash
cd backend
mvn clean test
```

Jenkins publishes backend JUnit reports from:

```text
backend/**/target/surefire-reports/*.xml
```

Frontend tests run with:

```bash
cd frontend
npm ci
npm run test:ci
```

Jenkins publishes frontend JUnit reports from:

```text
frontend/test-results/**/*.xml
```

Test report publishing is strict. Missing or failing test reports mark the build as failed or unstable instead of silently passing.

### Deployment

After successful tests and builds, Jenkins deploys with Docker Compose:

```bash
DEPLOY_TAG=<git-commit-or-build-number> JWT_SECRET=<jenkins-secret> GATEWAY_PORT=18080 FRONTEND_PORT=4200 docker compose up -d
```

Docker Compose services are tagged with `DEPLOY_TAG`, for example:

```text
buy01-gateway-service:<DEPLOY_TAG>
buy01-frontend:<DEPLOY_TAG>
```

Health verification checks:

- Gateway health endpoint.
- Frontend availability.
- Eureka registry availability.
- Required service registration in Eureka.

### Rollback

Before deployment, Jenkins saves the previous successful deployment tag in `.deploy-backup/rollback-tag` when available. After a successful health check, Jenkins writes the current tag to `.deploy-backup/last-successful-tag`.

If deployment or health verification fails, Jenkins runs:

```bash
./scripts/rollback.sh
```

The rollback script sets `DEPLOY_TAG` to the previous successful tag, restarts Docker Compose with that tag, and runs the same health checks. This depends on previous Docker images still being available on the Jenkins/Docker host.

### Jenkins Dashboard Permissions

Recommended audit configuration:

```text
Manage Jenkins > Security
Security Realm: Jenkins own user database
Authorization: Matrix-based security
Anonymous: no permissions
Authenticated users: Overall/Read only if needed
Developers: Job/Read, Job/Build, Job/Cancel, View/Read
Admins: Overall/Administer
```

Disable anonymous write/build permissions. Capture screenshots of the security matrix and user list as audit evidence.

### Intentional Failure Checks

Use one of these safe temporary tests to prove Jenkins responds correctly to failures:

```text
Change one frontend expectation to a wrong value and push.
Change one backend assertion to fail and push.
Temporarily set RUN_FRONTEND_TESTS=true and break `npm run test:ci`.
```

Expected result:

```text
Jenkins marks the build failed.
The failing stage stops downstream deployment.
JUnit report shows the failing test.
Failure email is sent.
Rollback is attempted if failure occurs after deployment starts.
```

Revert the intentional failure and push again to verify recovery.

### Distributed Builds

The current pipeline uses `agent any` and does not require multiple Jenkins agents. Distributed builds are not implemented by default. If the audit requires this bonus item, add Jenkins nodes with labels such as `java-docker-agent` and `node-agent`, then move backend and frontend stages to labeled agents or parallel stages.

## SonarQube Code Quality And Security

This project includes Docker-based SonarQube analysis for the Spring Boot microservices and Angular frontend. The configuration supports local scans, Jenkins CI quality gates, GitHub pull request checks, and scheduled monitoring.

SonarQube files:

```text
docker-compose.sonar.yml
sonar-project.properties
.github/workflows/sonarqube.yml
Jenkinsfile
backend/pom.xml
frontend/karma.conf.js
frontend/package.json
```

### Start SonarQube With Docker

Start SonarQube and its PostgreSQL database:

```bash
docker compose -f docker-compose.sonar.yml up -d
```

Open the dashboard:

```text
http://localhost:9000
```

Default first login:

```text
Username: admin
Password: admin
```

SonarQube will ask you to change the password on first login.

Stop SonarQube:

```bash
docker compose -f docker-compose.sonar.yml down
```

Reset SonarQube data if needed:

```bash
docker compose -f docker-compose.sonar.yml down -v
```

### SonarQube Project Setup

Create a local project in SonarQube with:

```text
Project key: safe-zone-ecommerce
Project name: Safe Zone E-Commerce Microservices
Main branch: main
```

Create an analysis token:

```text
My Account > Security > Generate Tokens
Token name: safe-zone-ci
Type: Project Analysis Token
Project: safe-zone-ecommerce
```

Keep the generated token secret. Do not commit it to Git.

### Local Analysis

Generate backend coverage:

```bash
cd backend
mvn clean verify
```

Generate frontend coverage:

```bash
cd frontend
npm ci
npm run test:coverage
```

Run the scanner from the repository root:

```bash
SONAR_TOKEN=<your-token> sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=$SONAR_TOKEN
```

The scanner uses `sonar-project.properties` to analyze all backend services and the frontend in one project.

### Coverage Reports

Backend coverage uses JaCoCo XML reports generated under each Maven module:

```text
backend/**/target/site/jacoco/jacoco.xml
```

Frontend coverage uses Karma LCOV:

```text
frontend/coverage/buy-01-frontend/lcov.info
```

Generated folders such as `target`, `node_modules`, `dist`, `.angular`, `coverage`, and `test-results` are excluded from analysis.

### Jenkins Integration

The Jenkins pipeline now runs SonarQube before Docker build and deployment:

```text
Checkout
Validate Tools
Backend Tests with JaCoCo
Frontend Install
Frontend Tests with LCOV
Frontend Build
SonarQube Analysis
Quality Gate
Docker Build
Backup Current Deployment
Deploy
Health Check
```

The Jenkins pipeline uses the standalone `sonar-scanner` CLI installed in `jenkins/Dockerfile` and polls SonarQube's API for quality gate status. This avoids requiring global SonarQube server configuration in Jenkins.

Required Jenkins credentials:

```text
Kind: Secret text
ID: sonar-token
Secret: <SonarQube analysis token>
```

For local Docker-based Jenkins and SonarQube, use a reachable host name or network route. If Jenkins runs in a container and SonarQube runs on the host, `http://host.docker.internal:9000` may be required depending on your Docker platform.

The Jenkins `Quality Gate` stage polls SonarQube and exits with a non-zero status when the quality gate is not `OK`. If the quality gate fails, the pipeline stops before Docker build and deployment.

### GitHub Integration

The workflow `.github/workflows/sonarqube.yml` runs on:

```text
push to main/develop
pull_request to main/develop
weekly scheduled scan
manual workflow_dispatch
```

The GitHub Actions workflow starts SonarQube with Docker inside the GitHub runner, creates the project, configures the `Safe Zone Audit Gate`, generates a short-lived project analysis token, runs the scan with the Dockerized SonarScanner CLI, and checks the quality gate through the SonarQube API. This makes push and pull request scans self-contained.

Optional GitHub repository secrets for externally hosted SonarQube or self-hosted runners:

```text
SONAR_HOST_URL=http://<sonarqube-host>:9000
SONAR_TOKEN=<SonarQube analysis token>
```

The current workflow does not require those secrets because it provisions SonarQube during the CI run. The workflow runs backend coverage, frontend coverage, SonarQube analysis, and a quality gate check. Configure branch protection in GitHub so this workflow must pass before pull requests can merge.

Recommended branch protection:

```text
Settings > Branches > Branch protection rules
Branch name pattern: main
Require a pull request before merging: enabled
Require approvals: 1 or more
Require status checks to pass before merging: enabled
Required check: SonarQube Quality Gate / Analyze code quality
Require branches to be up to date before merging: enabled
Do not allow bypassing the above settings: enabled for protected branches
```

### Quality Gate Policy

Use the SonarQube dashboard to define or customize the quality gate. This project uses `Safe Zone Audit Gate`, which is designed for this coursework demo to enforce security, reliability, maintainability, and duplication checks without failing solely because the small sample test suite does not yet provide production-level coverage. Recommended minimum policy:

```text
Duplicated lines on new code: less than 3 percent
Maintainability rating on new code: A
Reliability rating on new code: A
Security rating on new code: A
Security hotspots reviewed: 100 percent
New blocker issues: 0
New critical issues: 0
New major vulnerabilities: 0
New bugs: 0
```

The CI pipeline must fail if the project does not meet the active SonarQube quality gate.

### Review And Approval Process

All code changes should follow this process:

```text
Create a feature branch.
Open a pull request into main.
Wait for Jenkins and GitHub Actions checks.
Review SonarQube issues, vulnerabilities, code smells, duplication, coverage, and security hotspots.
Fix all blocker, critical, and major issues before approval.
Justify any accepted issue in the pull request discussion and SonarQube issue comments.
Require at least one reviewer approval.
Merge only after the SonarQube quality gate and tests pass.
```

Track quality improvements from the SonarQube dashboard using these views:

```text
Overview
Issues
Security Hotspots
Measures > Coverage
Measures > Duplications
Activity
Quality Gate
```

### Notifications And IDE Feedback

Optional notifications can be configured from SonarQube:

```text
My Account > Notifications
Administration > Configuration > General Settings > Email
```

For Slack or team chat alerts, use SonarQube webhooks with a small relay service or an automation platform that can receive the webhook and post to the target channel.

For IDE feedback, install SonarLint and connect it to the same SonarQube server:

```text
IDE: VS Code, IntelliJ IDEA, or Eclipse
Mode: Connected Mode
Server URL: http://localhost:9000
Project key: safe-zone-ecommerce
```
