import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'TELEGRAM_BOT_TOKEN'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL as string,

  // Telegram Bot
  botToken: process.env.TELEGRAM_BOT_TOKEN as string,

  // API Server
  apiPort: parseInt(process.env.API_PORT || '3000', 10),
  webAppUrl: process.env.WEBAPP_URL || 'http://localhost:3000',

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};


