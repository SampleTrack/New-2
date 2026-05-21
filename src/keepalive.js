// src/keepalive.js
const axios = require('axios');
const logger = require('./utils/logger');

// Prevent Render free tier from sleeping
// Pings every 14 minutes (free tier sleeps after 15 min inactivity)
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const HEALTH_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 10000}`;

class KeepAlive {
  constructor() {
    this.isActive = false;
    this.pingCount = 0;
  }

  start() {
    if (this.isActive) return;

    logger.info('🔔 Keep-Alive service started (Free tier sleep prevention)');
    this.isActive = true;

    // Initial ping
    this.ping();

    // Schedule pings
    this.interval = setInterval(() => {
      this.ping();
    }, PING_INTERVAL);
  }

  async ping() {
    try {
      this.pingCount++;
      await axios.get(`${HEALTH_URL}/ping`, { timeout: 5000 });
      logger.info(`💓 Keep-alive ping #${this.pingCount} successful`);
    } catch (error) {
      logger.warn(`⚠️ Keep-alive ping #${this.pingCount} failed: ${error.message}`);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isActive = false;
      logger.info('Keep-Alive service stopped');
    }
  }
}

const keepAlive = new KeepAlive();
keepAlive.start();

module.exports = keepAlive;
