// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config"

// Prevent multiple instances of Prisma Client in development
declare global {
  // @ts-ignore: Next.js hot module replacement
  var __prisma: PrismaClient | undefined
}

// Create adapter for PostgreSQL connection
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined')
}

const adapter = new PrismaPg({ connectionString })

// Export a single instance of PrismaClient with adapter
export const prisma = 
  global.__prisma || 
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// In development, avoid creating new instances on hot reload
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}