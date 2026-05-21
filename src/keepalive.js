// src/keepalive.js
const axios = require('axios');
const logger = require('./utils/logger');

// Self-ping every 14 minutes (free tier sleeps after 15 min)
const PING_INTERVAL = 14 * 60 * 1000;
let pingCount = 0;

async function ping() {
  try {
    const port = process.env.PORT || 10000;
    pingCount++;
    await axios.get(`http://localhost:${port}/ping`, { timeout: 5000 });
    logger.info(`💓 Keep-alive #${pingCount} OK`);
  } catch (error) {
    logger.warn(`⚠️ Keep-alive #${pingCount} failed: ${error.message}`);
  }
}

// Initial ping
setTimeout(ping, 30000);

// Schedule pings
setInterval(ping, PING_INTERVAL);

logger.info('🔔 Keep-Alive service started');
