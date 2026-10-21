# Next.js Passkeys Demo

A demonstration of implementing WebAuthn passkeys authentication in Next.js using the SimpleWebAuthn library. This project shows how to build passwordless authentication with biometric credentials.

## Article

For a detailed walkthrough of this demo, check out the article:

[**How do I implement passkeys in Next.js?**](https://clerk.com/blog/how-do-i-implement-passkeys-in-nextjs)

## About Clerk

[Clerk](https://clerk.com) is a complete authentication and user management platform that makes it easy to add secure, production-ready authentication to your applications. While this demo implements passkeys from scratch for educational purposes, Clerk offers a fully-managed solution with passkeys and much more.

### What Clerk Offers

- **🔐 Passkeys & Biometric Auth** - Built-in passkey support with seamless fallback options
- **🎨 Pre-built UI Components** - Beautiful, customizable sign-in and sign-up components
- **👤 User Management** - Complete user profiles, organizations, and role-based access control
- **🔑 Multiple Auth Methods** - Email/password, social logins (Google, GitHub, etc.), magic links, SMS, and more
- **🏢 Organizations** - Adds multitenancy to your app with team management and permissions
- **💳 Billing** - Integrated subscription and payment management

### Getting Started with Clerk

Ready to add production-ready authentication to your Next.js app? Install Clerk and get up and running in minutes with just a few lines of code.

```bash
npm install @clerk/nextjs
```

Learn more in the [Next.js quick start](https://clerk.com/docs/quickstarts/nextjs).

## Features

- 🔐 **Passwordless Authentication** - Register and authenticate users with passkeys
- 🔑 **WebAuthn/FIDO2** - Industry-standard authentication protocol
- 🗄️ **PostgreSQL Database** - Store users, credentials, and challenges
- ⚡ **Next.js 16** - Built with the latest Next.js App Router
- 🎨 **Tailwind CSS** - Modern, responsive UI

## Prerequisites

- Node.js 20.9 or later installed
- A PostgreSQL database (see setup options below)
- pnpm, npm, yarn, or bun package manager

## Database Setup

This project requires a PostgreSQL database. You have several options:

### Option 1: Supabase (Recommended for beginners)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **Database** and copy your connection string
4. Use the "Connection pooling" URI for better performance
5. The connection string will look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### Option 2: Neon (Recommended for serverless)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. The connection string will look like:
   ```
   postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require
   ```

### Option 3: Local PostgreSQL

If you have PostgreSQL installed locally:
```
postgresql://localhost:5432/passkeys_demo
```

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd nextjs-passkeys-demo

# Install dependencies
pnpm install
# or npm install
# or yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database connection string
DATABASE_URL=postgresql://your-connection-string-here

# WebAuthn configuration
# For local development, use localhost
# For production, use your actual domain
RP_ID=localhost
RP_NAME="Passkeys Demo"
RP_ORIGIN=http://localhost:3000
```

**Important Notes:**
- `RP_ID` should be your domain (e.g., `localhost` for dev, `example.com` for production)
- `RP_ORIGIN` must match exactly where your app is hosted (including protocol and port)
- For production, use `https://` and your actual domain

### 3. Run Database Migrations

Apply the database schema to create the required tables:

```bash
pnpm db:migrate
# or npm run db:migrate
```

This will create three tables:
- `users` - Store user accounts
- `credentials` - Store passkey public keys and metadata
- `challenges` - Temporary storage for authentication challenges

### 4. Start the Development Server

```bash
pnpm dev
# or npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Registering a New User

1. Enter a username and display name
2. Click "Register with Passkey"
3. Your browser will prompt you to create a passkey using:
   - Face ID / Touch ID (macOS/iOS)
   - Windows Hello (Windows)
   - Fingerprint sensor (Android)
   - Security key (YubiKey, etc.)

### Authenticating

1. Enter your username
2. Click "Sign In with Passkey"
3. Authenticate using your previously registered passkey

## Project Structure

```
├── db/
│   └── schema.sql          # Database schema
├── scripts/
│   └── migrate.ts          # Database migration script
├── src/
│   ├── app/
│   │   ├── api/            # API routes for passkey operations
│   │   ├── page.tsx        # Main page
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── PasskeyRegister.tsx  # Registration component
│   │   └── PasskeyAuth.tsx      # Authentication component
│   ├── lib/
│   │   └── db.ts           # Database connection
│   └── types/
│       └── webauthn.ts     # TypeScript types
└── package.json
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:migrate` - Run database migrations
- `pnpm db:reseed` - Reset and reseed database

## Technologies Used

- **[Next.js 16](https://nextjs.org/)** - React framework
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** - WebAuthn library
- **[PostgreSQL](https://www.postgresql.org/)** - Database
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Security Considerations

- Passkeys are stored as public keys only - private keys never leave the user's device
- Challenges are single-use and expire after a short time
- All authentication uses cryptographic signatures
- HTTPS is required in production for WebAuthn to work

## Troubleshooting

### "Database connection failed"
- Verify your `DATABASE_URL` is correct in `.env.local`
- Check that your database is accessible
- Ensure you've run `pnpm db:migrate`

### "Passkey creation failed"
- Check that `RP_ID` matches your domain
- Verify `RP_ORIGIN` includes the correct protocol and port

### "User already exists"
- Usernames must be unique
- Try a different username or reset the database with `pnpm db:reseed`

## License

MIT

## Learn More

- [WebAuthn Guide](https://webauthn.guide/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
