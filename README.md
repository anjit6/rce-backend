# RCE Backend - Rules Configuration Engine

Backend API for managing business rules with approval workflow, versioning, and mapping capabilities.

## Features

- Business rules management with versioning
- Approval workflow system
- Field mapping configuration
- Rule execution engine
- PostgreSQL database integration
- RESTful API architecture

## Tech Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js 5
- **Database**: PostgreSQL 16
- **Security**: JWT, bcrypt
- **Validation**: Joi
- **Rule Engine**: vm2
- **Date Handling**: date-fns

## Prerequisites

- Docker & Docker Compose (recommended)
- OR Node.js 18+ and PostgreSQL 16

## Quick Start with Docker

### 1. Clone the repository

```bash
cd rce-backend
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=8080
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=postgres
DB_NAME=rce_database
DB_PASSWORD=postgres123
DB_PORT=5432
```

### 3. Start services

```bash
# Start all services (backend + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### 4. Access the application

- API: http://localhost:8080
- Health check: http://localhost:8080/health
- Database: localhost:5432

## Local Development without Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Setup PostgreSQL

Ensure PostgreSQL is running locally and create database:

```sql
CREATE DATABASE rce_database;
```

### 3. Configure environment

Create `.env` file with local database settings:

```env
PORT=8080
NODE_ENV=development
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rce_database
DB_PASSWORD=your_password
DB_PORT=5432
```

### 4. Run migrations (when available)

```bash
npm run migrate
```

### 5. Start development server

```bash
npm run dev
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations

## API Endpoints

### Health & Status
- `GET /` - API information
- `GET /health` - Health check

### Rules Management
- `GET /api/rules` - List all rules
- To be implemented...

### Mappings
- `GET /api/mappings` - List mappings
- To be implemented...

### Execution
- `POST /api/execute` - Execute rules
- To be implemented...

### Approvals
- `GET /api/approvals` - List approvals
- To be implemented...

## Project Structure

```
rce-backend/
├── src/
│   ├── config/
│   │   └── database.js        # Database configuration
│   └── server.js              # Express app & routes
├── .dockerignore              # Docker ignore file
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore file
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Production Dockerfile
├── Dockerfile.dev             # Development Dockerfile
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

## Docker Commands

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Execute commands in container
docker-compose exec backend npm test
docker-compose exec postgres psql -U postgres -d rce_database

# Restart services
docker-compose restart

# Stop and remove everything
docker-compose down -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `DB_USER` | Database user | postgres |
| `DB_HOST` | Database host | localhost |
| `DB_NAME` | Database name | rce_database |
| `DB_PASSWORD` | Database password | password |
| `DB_PORT` | Database port | 5432 |

## Troubleshooting

### Database connection issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port already in use

```bash
# Change PORT in .env file or stop the process using port 8080
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

### Reset everything

```bash
# Remove all containers, volumes, and images
docker-compose down -v
docker-compose up --build
```

## Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Submit pull request

## License

ISC
