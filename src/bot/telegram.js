// src/bot/telegram.js
const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class DealBot {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;

    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required!');
    }
    if (!this.channelId) {
      throw new Error('TELEGRAM_CHANNEL_ID is required!');
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    this.lastMessageTime = 0;
    
    this.setupHandlers();
    logger.info('✅ Bot initialized');
  }

  setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '🛍️ *Deal Finder Bot*\n\n' +
        'I automatically find and post best deals!\n\n' +
        'Commands:\n' +
        '/deals - Latest deals\n' +
        '/stats - Bot status\n' +
        '/help - Help',
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.onText(/\/stats/, (msg) => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      this.bot.sendMessage(msg.chat.id,
        `📊 *Bot Stats*\n` +
        `⏰ Uptime: ${hours}h ${minutes}m\n` +
        `🔧 Node: ${process.version}\n` +
        `🌍 Env: ${process.env.NODE_ENV || 'dev'}`,
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, 'Use /start to see all commands.');
    });
  }

  async postBestDeals(deals) {
    if (!deals || deals.length === 0) {
      logger.warn('No deals to post');
      return;
    }

    // Sort by discount
    const sortedDeals = deals
      .filter(d => d.title && d.price)
      .sort((a, b) => {
        const getPercent = (str) => parseInt((str || '').replace(/[^0-9]/g, '')) || 0;
        return getPercent(b.discount) - getPercent(a.discount);
      })
      .slice(0, 5);

    logger.info(`Posting ${sortedDeals.length} deals...`);

    let successCount = 0;
    for (const deal of sortedDeals) {
      try {
        // Rate limiting
        const now = Date.now();
        const timeSince = now - this.lastMessageTime;
        if (timeSince < 3000) {
          await new Promise(r => setTimeout(r, 3000 - timeSince));
        }
        this.lastMessageTime = Date.now();

        // Format message
        const message = [
          `🔥 <b>${deal.title}</b>`,
          ``,
          `💰 <b>Price:</b> ${deal.price}`,
          deal.originalPrice ? `🏷️ <b>MRP:</b> <s>${deal.originalPrice}</s>` : '',
          deal.discount ? `📉 <b>Discount:</b> ${deal.discount}` : '',
          deal.rating ? `⭐ <b>Rating:</b> ${deal.rating}/5` : '',
          ``,
          `🛒 <a href="${deal.productUrl}">👉 BUY NOW</a>`,
          ``,
          `#${deal.platform} #Deal #Discount`
        ].filter(Boolean).join('\n');

        // Send to channel
        if (deal.imageUrl && deal.imageUrl.startsWith('http')) {
          await this.bot.sendPhoto(this.channelId, deal.imageUrl, {
            caption: message,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: '🛒 Buy Now', url: deal.productUrl }
              ]]
            }
          });
        } else {
          await this.bot.sendMessage(this.channelId, message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [[
                { text: '🛒 Buy Now', url: deal.productUrl }
              ]]
            }
          });
        }

        successCount++;
        logger.info(`✅ Posted: ${deal.title.substring(0, 40)}...`);

      } catch (error) {
        logger.error(`❌ Failed to post: ${error.message}`);
        
        if (error.response?.statusCode === 429) {
          logger.info('Rate limited, waiting 60s...');
          await new Promise(r => setTimeout(r, 60000));
        }
      }
    }

    logger.info(`📊 Posted ${successCount}/${sortedDeals.length} deals`);
  }
}

module.exports = DealBot;
