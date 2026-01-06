import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import sequelize from './config/database.js';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(config.upload.dir));

// Routes
app.use('/', routes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async (): Promise<void> => {
  try {
    // Create uploads directory if it doesn't exist
    try {
      await fs.access(config.upload.dir);
    } catch {
      await fs.mkdir(config.upload.dir, { recursive: true });
      console.log('✅ Media Service: Created uploads directory');
    }

    await sequelize.authenticate();
    console.log('✅ Media Service: Database connection established');

    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Media Service: Database synchronized');
    }

    app.listen(config.port, () => {
      console.log(`🚀 Media Service running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`📁 Upload directory: ${config.upload.dir}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Media Service:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing Media Service');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing Media Service');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;

