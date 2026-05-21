// src/bot/telegram.js
const TelegramBot = require('node-telegram-bot-api');
const AffiliateManager = require('../utils/affiliate');
const DealFormatter = require('./formatter');
const logger = require('../utils/logger');

class DealBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.adminId = process.env.ADMIN_TELEGRAM_ID;
    
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    this.affiliateManager = new AffiliateManager();
    this.formatter = new DealFormatter();
    
    // Rate limiting: Max 20 messages per minute
    this.messageQueue = [];
    this.lastMessageTime = 0;
    
    this.setupHandlers();
    this.notifyStartup();
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🛍️ *Welcome to Deal Finder Bot!* 

I automatically find and post the best deals from:
📦 Amazon
🛒 Flipkart  
👗 Myntra

*Available Commands:*
/deals - Get latest deals
/best - Best deal of the day
/stats - Bot statistics
/help - Show this message

💡 *For Channel Owners:*
Add me as admin to your channel and I'll post deals automatically!

🔗 *Affiliate Disclosure:*
This bot uses affiliate links. We may earn commission from purchases.
      `;

      this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    });

    // Deals command
    this.bot.onText(/\/deals/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, '🔍 Fetching latest deals... Please wait.');

      // In a full implementation, you'd fetch from cache/database
      // For now, sending a placeholder
      this.bot.sendMessage(chatId, '💡 Deals are posted automatically in the channel. Use /best for top deals!');
    });

    // Best deal command
    this.bot.onText(/\/best/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, '🌟 Best deals will appear here automatically!');
    });

    // Stats command
    this.bot.onText(/\/stats/, (msg) => {
      const chatId = msg.chat.id;
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);

      const statsMessage = `
📊 *Bot Statistics*

⏰ Uptime: ${hours}h ${minutes}m
🔍 Status: Active
📅 Timezone: ${process.env.TZ || 'UTC'}
💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB

_Deals are auto-posted 3 times daily_
      `;

      this.bot.sendMessage(chatId, statsMessage, {
        parse_mode: 'Markdown'
      });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, 
        'Use /start to see all available commands.',
        { parse_mode: 'Markdown' }
      );
    });
  }

  async notifyStartup() {
    try {
      if (this.adminId) {
        await this.bot.sendMessage(this.adminId, 
          '✅ *Deal Finder Bot Started*\n\n' +
          `Time: ${new Date().toLocaleString()}\n` +
          `Environment: ${process.env.NODE_ENV}`,
          { parse_mode: 'Markdown' }
        );
      }
      logger.info('Bot startup notification sent');
    } catch (error) {
      logger.error('Failed to send startup notification:', error.message);
    }
  }

  async postDealToChannel(deal) {
    try {
      // Add affiliate tags
      const affiliateUrl = this.affiliateManager.addAffiliate(deal);
      
      // Format message
      const message = this.formatter.formatDealMessage({
        ...deal,
        productUrl: affiliateUrl
      });

      // Rate limiting
      await this.waitForRateLimit();

      // Send to channel
      if (deal.imageUrl) {
        await this.bot.sendPhoto(this.channelId, deal.imageUrl, {
          caption: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '🛒 Buy Now', url: affiliateUrl },
              { text: 'ℹ️ More Info', url: deal.productUrl }
            ]]
          }
        });
      } else {
        // If no image, send text only
        await this.bot.sendMessage(this.channelId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: false,
          reply_markup: {
            inline_keyboard: [[
              { text: '🛒 Buy Now', url: affiliateUrl }
            ]]
          }
        });
      }

      logger.info(`✅ Posted deal: ${deal.title?.substring(0, 50)}...`);
      return true;
    } catch (error) {
      logger.error(`❌ Error posting deal "${deal.title}":`, error.message);
      
      // If rate limited, wait and retry once
      if (error.response?.statusCode === 429) {
        logger.info('Rate limited, waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        return false;
      }
      return false;
    }
  }

  async postBestDeals(deals) {
    if (!deals || deals.length === 0) {
      logger.warn('No deals to post');
      return;
    }

    // Filter and sort best deals
    const bestDeals = deals
      .filter(deal => deal.title && deal.price)
      .sort((a, b) => {
        const discountA = this.extractDiscountPercent(a.discount);
        const discountB = this.extractDiscountPercent(b.discount);
        return discountB - discountA;
      })
      .slice(0, 5); // Top 5 deals

    logger.info(`📤 Posting top ${bestDeals.length} deals...`);

    let postedCount = 0;
    for (const deal of bestDeals) {
      const success = await this.postDealToChannel(deal);
      if (success) postedCount++;
      
      // Delay between posts (Telegram rate limit: ~20 messages per minute)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    logger.info(`📊 Successfully posted ${postedCount}/${bestDeals.length} deals`);
  }

  extractDiscountPercent(discountStr) {
    if (!discountStr) return 0;
    const match = discountStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    if (timeSinceLastMessage < 3000) { // 3 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 3000 - timeSinceLastMessage));
    }
    
    this.lastMessageTime = Date.now();
  }

  async sendMessage(chatId, message, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, message, options);
    } catch (error) {
      logger.error('Error sending message:', error.message);
      return null;
    }
  }
}

module.exports = DealBot;
