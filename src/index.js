// src/index.js
require('dotenv').config();
require('./health');

const cron = require('node-cron');
const logger = require('./utils/logger');
const DealBot = require('./bot/telegram');
const FlipkartScraper = require('./scrapers/flipkart');

class DealFinderApp {
  constructor() {
    this.dealBot = null;
    this.flipkartScraper = new FlipkartScraper();
    this.isRunning = false;
  }

  async findAndPostDeals() {
    if (this.isRunning) {
      logger.info('Previous run still in progress, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('🔍 Starting deal search...');

    try {
      // Scrape Flipkart (no Puppeteer needed)
      const flipkartDeals = await this.flipkartScraper.scrapeDeals();
      logger.info(`Flipkart: ${flipkartDeals.length} deals found`);

      // Sample deals as fallback
      const deals = flipkartDeals.length > 0 ? flipkartDeals : [
        {
          title: "boAt Airdopes 141 Bluetooth TWS Earbuds",
          price: "₹999",
          originalPrice: "₹4,490",
          discount: "78% off",
          imageUrl: "",
          productUrl: "https://www.flipkart.com/boat-airdopes-141-bluetooth-tws-earbuds/p/itmfa53d50e5a565",
          platform: "flipkart",
          rating: "4.2"
        },
        {
          title: "Puma Unisex-Adult Smash V2 Sneakers",
          price: "₹1,499",
          originalPrice: "₹3,999",
          discount: "63% off",
          imageUrl: "",
          productUrl: "https://www.flipkart.com/puma-smash-v2-sneakers/p/itmfb2e6b0c2b5e5",
          platform: "flipkart",
          rating: "4.4"
        },
        {
          title: "realme narzo N53 (Feather Black, 64 GB)",
          price: "₹7,499",
          originalPrice: "₹12,999",
          discount: "42% off",
          imageUrl: "",
          productUrl: "https://www.flipkart.com/realme-narzo-n53-feather-black-64-gb/p/itmfa4b6b0c2b5e5",
          platform: "flipkart",
          rating: "4.3"
        }
      ];

      // Post deals
      if (deals.length > 0) {
        await this.dealBot.postBestDeals(deals.slice(0, 5));
        logger.info('✅ Deals posted successfully!');
      } else {
        logger.warn('⚠️ No deals found');
      }

    } catch (error) {
      logger.error('Error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    logger.info('🚀 Deal Finder Bot Starting...');

    // Initialize bot
    try {
      this.dealBot = new DealBot();
    } catch (error) {
      logger.error('Failed to initialize bot:', error.message);
      process.exit(1);
    }

    // First run after 10 seconds
    setTimeout(() => {
      this.findAndPostDeals();
    }, 10000);

    // Schedule: 9 AM, 6 PM, 10 PM IST
    cron.schedule('0 9 * * *', () => {
      logger.info('⏰ Morning deal run');
      this.findAndPostDeals();
    }, { timezone: "Asia/Kolkata" });

    cron.schedule('0 18 * * *', () => {
      logger.info('⏰ Evening deal run');
      this.findAndPostDeals();
    }, { timezone: "Asia/Kolkata" });

    cron.schedule('0 22 * * *', () => {
      logger.info('⏰ Night deal run');
      this.findAndPostDeals();
    }, { timezone: "Asia/Kolkata" });

    logger.info('✅ Scheduler configured');
  }
}

// Start app
try {
  const app = new DealFinderApp();
  app.start();
} catch (error) {
  console.error('Failed to start:', error);
  process.exit(1);
}
