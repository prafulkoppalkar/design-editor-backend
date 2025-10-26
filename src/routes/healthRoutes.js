const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: {
      status: states[dbState],
      name: mongoose.connection.name || 'N/A',
      host: mongoose.connection.host || 'N/A',
    },
    uptime: process.uptime(),
  });
});


router.get('/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    
    if (dbState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
      });
    }

    // Try to ping the database
    await mongoose.connection.db.admin().ping();

    // Get database stats
    const stats = await mongoose.connection.db.stats();

    res.json({
      success: true,
      connection: {
        status: 'connected',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port,
      },
      stats: {
        collections: stats.collections,
        dataSize: `${(stats.dataSize / 1024).toFixed(2)} KB`,
        indexes: stats.indexes,
        indexSize: `${(stats.indexSize / 1024).toFixed(2)} KB`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'DB_CHECK_ERROR',
      message: 'Failed to check database',
      details: error.message,
    });
  }
});

module.exports = router;

