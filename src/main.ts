import app, { connectDatabase } from './app.js';
import { config } from './config/index.js';

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 SafeSpace API server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
