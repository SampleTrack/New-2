// src/index.js
require('dotenv').config();

// Start health check server FIRST (Render requirement)
const app = require('./health');

// Start keepalive pinger for free tier
require('./keepalive');

const cron = require('node-cron');
const logger = require('./utils/logger');
const DealBot = require('./bot/telegram');
const AmazonScraper = require('./scrapers/amazon');
const FlipkartScraper = require('./scrapers/flipkart');
const MyntraScraper = require('./scrapers/myntra');

class DealFinderApp {
  constructor() {
    this.amazonScraper = new AmazonScraper();
    this.flipkartScraper = new FlipkartScraper();
    this.myntraScraper = new MyntraScraper();
    this.dealBot = new DealBot();
    this.isRunning = false;
  }

  async findAndPostDeals() {
    // Prevent overlapping runs
    if (this.isRunning) {
      logger.info('Previous deal search still running, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('🔍 Starting deal search...');

    try {
      // Scrape all platforms
      const [amazonDeals, flipkartDeals, myntraDeals] = await Promise.allSettled([
        this.amazonScraper.scrapeDeals(),
        this.flipkartScraper.scrapeDeals(),
        this.myntraScraper.scrapeDeals()
      ]);

      // Collect successful results
      const allDeals = [];

      if (amazonDeals.status === 'fulfilled') {
        allDeals.push(...amazonDeals.value);
        logger.info(`✅ Amazon: ${amazonDeals.value.length} deals found`);
      } else {
        logger.error(`❌ Amazon scraper failed: ${amazonDeals.reason}`);
      }

      if (flipkartDeals.status === 'fulfilled') {
        allDeals.push(...flipkartDeals.value);
        logger.info(`✅ Flipkart: ${flipkartDeals.value.length} deals found`);
      } else {
        logger.error(`❌ Flipkart scraper failed: ${flipkartDeals.reason}`);
      }

      if (myntraDeals.status === 'fulfilled') {
        allDeals.push(...myntraDeals.value);
        logger.info(`✅ Myntra: ${myntraDeals.value.length} deals found`);
      } else {
        logger.error(`❌ Myntra scraper failed: ${myntraDeals.reason}`);
      }

      logger.info(`📊 Total deals found: ${allDeals.length}`);

      // Post best deals to Telegram channel
      if (allDeals.length > 0) {
        await this.dealBot.postBestDeals(allDeals);
        logger.info('✅ Deals posted successfully!');
      } else {
        logger.warn('⚠️ No deals found this run');
      }

    } catch (error) {
      logger.error('❌ Deal finding error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    logger.info('🚀 Deal Finder Bot Starting...');
    logger.info(`📅 Timezone: ${process.env.TZ || 'UTC'}`);
    logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Check required environment variables
    const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHANNEL_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
      logger.error('Please add them in Render dashboard under Environment Variables');
      process.exit(1);
    }

    // Run immediately on start (with delay to let server start)
    setTimeout(() => {
      this.findAndPostDeals();
    }, 5000);

    // Schedule deal searches - Free tier friendly timing
    // 9 AM IST - Morning deals
    cron.schedule('0 9 * * *', () => {
      logger.info('⏰ Running scheduled morning deal search');
      this.findAndPostDeals();
    }, {
      timezone: "Asia/Kolkata"
    });

    // 6 PM IST - Evening deals
    cron.schedule('0 18 * * *', () => {
      logger.info('⏰ Running scheduled evening deal search');
      this.findAndPostDeals();
    }, {
      timezone: "Asia/Kolkata"
    });

    // 10 PM IST - Night deals
    cron.schedule('0 22 * * *', () => {
      logger.info('⏰ Running scheduled night deal search');
      this.findAndPostDeals();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      process.exit(0);
    });
  }
}

// Start the application
try {
  const dealApp = new DealFinderApp();
  dealApp.start();
} catch (error) {
  logger.error('Failed to start application:', error);
  process.exit(1);
      }
