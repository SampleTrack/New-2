// src/health.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Health check - REQUIRED by Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'deal-finder-bot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: '🛍️ Deal Finder Bot is running!',
    health: '/health',
    version: '1.0.0'
  });
});

// Ping for keepalive
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health server on port ${PORT}`);
});

module.exports = app;
