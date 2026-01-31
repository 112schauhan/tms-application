# Transportation Management System (TMS)

> Full-stack shipment tracking and management application built with React, Node.js, GraphQL, Prisma, and Neon PostgreSQL

---

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Apollo Client** for GraphQL
- **Tailwind CSS** for styling
- **Vite** as build tool

### Backend
- **Node.js 20** with Express
- **Apollo Server 4** for GraphQL API
- **Prisma ORM** for database management
- **JWT** for authentication

### Database
- **Neon PostgreSQL** (Cloud-managed PostgreSQL)
- Automatic backups
- Free tier available

---

## 📋 Prerequisites

- Node.js v20 or higher
- npm v10 or higher
- Neon account (free): https://neon.tech

---

## 🎯 Quick Start

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd tms-application

# Install dependencies
npm install
```

### 2. Set Up Neon Database

```bash
# 1. Create Neon account at https://neon.tech
# 2. Create new project: "tms-application"
# 3. Copy connection string from Neon console
```

### 3. Configure Backend

```bash
cd apps/backend

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=4000
DATABASE_URL="your-neon-connection-string-here"
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
REFRESH_TOKEN_SECRET="your-secure-refresh-secret"
FRONTEND_URL="http://localhost:5173"
EOF

# Replace DATABASE_URL with your actual Neon connection string
```

### 4. Initialize Database

```bash
# Still in apps/backend

# Generate Prisma Client
npx prisma generate

# Push schema to Neon
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd apps/backend
npm run dev
# Runs on http://localhost:4000

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🔐 Test Credentials

After seeding, use these credentials:

**Admin:**
- Email: `admin@tms.com`
- Password: `admin123`

**Employee:**
- Email: `employee@tms.com`
- Password: `employee123`

---

## 📦 Project Structure

```
tms-application/
├── apps/
│   ├── backend/                 # Node.js + GraphQL API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Sample data seeder
│   │   ├── src/
│   │   │   ├── config/         # Database, cache configs
│   │   │   ├── graphql/        # Schemas, resolvers
│   │   │   ├── middleware/     # Auth, validation
│   │   │   └── services/       # Business logic
│   │   ├── .env                # Environment variables
│   │   └── package.json
│   │
│   └── frontend/                # React + TypeScript
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── graphql/        # GraphQL queries/mutations
│       │   ├── pages/          # Page components
│       │   └── contexts/       # React contexts
│       └── package.json
│
├── package.json                 # Root package.json
└── README.md                    # This file
```

---

## 🛠️ Available Scripts

### Backend (`apps/backend`)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma Client
```

### Frontend (`apps/frontend`)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 📊 Database Schema

### Tables

- **users** - User accounts (Admin/Employee roles)
- **shipments** - Shipment records with tracking info
- **locations** - Pickup and delivery locations
- **dimensions** - Package dimensions
- **tracking_events** - Shipment tracking history

---

## 🔧 Development Tools

### Prisma Studio

Visual database editor:

```bash
cd apps/backend
npx prisma studio
# Opens: http://localhost:5555
```

### GraphQL Playground

When backend is running, access GraphQL Playground at:
- http://localhost:4000/graphql

---

## 🌐 Environment Variables

### Backend (`.env`)

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://neondb_owner:password@ep-xxx.neon.tech/tms_db?sslmode=require"
JWT_SECRET="your-secret-here"
REFRESH_TOKEN_SECRET="your-refresh-secret"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`.env`)

```bash
VITE_GRAPHQL_URL="http://localhost:4000/graphql"
```

---

## 🚢 Deployment

### Backend (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/frontend
vercel --prod

# Set VITE_GRAPHQL_URL in Vercel dashboard
```

### Database

Already deployed on Neon! Just use your connection string in production environment variables.

---

## 🐛 Troubleshooting

### Can't connect to database

```bash
# Verify connection string
cat apps/backend/.env | grep DATABASE_URL

# Test connection
cd apps/backend
npx prisma db pull
```

### Prisma Client not found

```bash
cd apps/backend
npx prisma generate
```

### Seed script fails

```bash
cd apps/backend
npm install bcryptjs
npm run db:seed
```

---

## 📚 Documentation

For detailed setup instructions, see:
- [NEON_COMPLETE_WALKTHROUGH.md](../NEON_COMPLETE_WALKTHROUGH.md)
- [TMS_Step_by_Step_Setup_Guide.md](../TMS_Step_by_Step_Setup_Guide.md)
- [DATABASE_SETUP_COMPARISON.md](../DATABASE_SETUP_COMPARISON.md)

---

## 🔒 Security Notes

- Never commit `.env` files
- Use strong secrets in production
- Rotate JWT secrets regularly
- Enable SSL for all connections (Neon enforces this)

---

## 📝 License

MIT

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Built with ❤️ for TMS Application