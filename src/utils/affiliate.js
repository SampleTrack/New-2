// src/utils/affiliate.js
const logger = require('./logger');

class AffiliateManager {
  constructor() {
    this.affiliateTags = {
      amazon: {
        tag: process.env.AMAZON_AFFILIATE_TAG || 'default-21',
        baseUrl: process.env.AMAZON_BASE_URL || 'https://www.amazon.in'
      },
      flipkart: {
        tag: process.env.FLIPKART_AFFILIATE_ID || 'defaulttag',
        baseUrl: process.env.FLIPKART_BASE_URL || 'https://www.flipkart.com'
      },
      myntra: {
        tag: process.env.MYNTRA_AFFILIATE_ID || 'defaulttag',
        baseUrl: process.env.MYNTRA_BASE_URL || 'https://www.myntra.com'
      }
    };
  }

  addAffiliate(deal) {
    try {
      const platform = deal.platform?.toLowerCase();
      if (!platform || !this.affiliateTags[platform]) {
        logger.warn(`Unknown platform: ${platform}`);
        return deal.productUrl;
      }

      const affiliate = this.affiliateTags[platform];
      const url = new URL(deal.productUrl);

      switch(platform) {
        case 'amazon':
          url.searchParams.set('tag', affiliate.tag);
          break;
          
        case 'flipkart':
          url.searchParams.set('affid', affiliate.tag);
          url.searchParams.set('affExtParam1', 'dealbot');
          break;
          
        case 'myntra':
          url.searchParams.set('utm_source', affiliate.tag);
          url.searchParams.set('utm_medium', 'affiliate');
          break;
      }

      return url.toString();
    } catch (error) {
      logger.error('Error adding affiliate:', error);
      return deal.productUrl;
    }
  }
}

module.exports = AffiliateManager;
