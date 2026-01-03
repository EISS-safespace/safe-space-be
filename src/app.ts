import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import sequelize from './config/database.js';

const app: Application = express();

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded media)
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), config.upload.uploadDir)),
);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database synchronized.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default app;
