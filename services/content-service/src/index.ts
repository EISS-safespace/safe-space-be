import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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

// Routes
app.use('/', routes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Content Service: Database connection established');

    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Content Service: Database synchronized');
    }

    app.listen(config.port, () => {
      console.log(`🚀 Content Service running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start Content Service:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing Content Service');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing Content Service');
  await sequelize.close();
  process.exit(0);
});

startServer();

export default app;

