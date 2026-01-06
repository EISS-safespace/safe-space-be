import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import { config } from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/', authRoutes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Auth Service: Database connection established');

    // Sync models (only in development)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Auth Service: Database synchronized');
    }

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Auth Service running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Auth Service:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing Auth Service');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing Auth Service');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;

