// src/health.js
const express = require('express');
const app = express();

// Render provides PORT environment variable
const PORT = process.env.PORT || 10000;

// Track application start time
const startTime = new Date();
let lastDealRun = null;
let dealCount = 0;

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint - REQUIRED by Render
app.get('/health', (req, res) => {
  const uptime = Math.floor((new Date() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    service: 'deal-finder-bot',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🛍️ Deal Finder Bot is running!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      stats: '/stats',
      ping: '/ping'
    }
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const uptime = Math.floor((new Date() - startTime) / 1000);
  res.json({
    uptime: `${uptime}s`,
    dealsPosted: dealCount,
    lastDealRun: lastDealRun,
    environment: process.env.NODE_ENV,
    timezone: process.env.TZ
  });
});

// Simple ping endpoint for keepalive
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Update stats (called from main app)
app.updateStats = (deals) => {
  lastDealRun = new Date().toISOString();
  if (deals) {
    dealCount += deals.length;
  }
};

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health server running on port ${PORT}`);
  console.log(`📍 Health check: http://0.0.0.0:${PORT}/health`);
});

module.exports = app;
