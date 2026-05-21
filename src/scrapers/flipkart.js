// src/scrapers/flipkart.js
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class FlipkartScraper {
  constructor() {
    this.baseUrl = 'https://www.flipkart.com';
  }

  async scrapeDeals() {
    try {
      logger.info('Fetching Flipkart deals...');
      
      const response = await axios.get(`${this.baseUrl}/offers-store`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const deals = [];

      $('._1AtVbE, ._2kHMtA, ._1xHGtK, ._13oc-S').each((i, el) => {
        const title = $(el).find('._4rR01T, .s1Q9rs, .IRpwTa, div:first').text().trim();
        const price = $(el).find('._30jeq3').text().trim();
        const originalPrice = $(el).find('._3I9_wc').text().trim();
        const discount = $(el).find('._3Ay6Sb').first().text().trim();
        let productUrl = $(el).find('a').attr('href') || '';

        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = this.baseUrl + productUrl;
        }

        if (title && price) {
          deals.push({
            title,
            price,
            originalPrice,
            discount,
            imageUrl: '',
            productUrl: productUrl || this.baseUrl,
            platform: 'flipkart',
            rating: ''
          });
        }
      });

      logger.info(`Found ${deals.length} Flipkart deals`);
      return deals.slice(0, 10);

    } catch (error) {
      logger.error(`Flipkart error: ${error.message}`);
      return [];
    }
  }
}

module.exports = FlipkartScraper;
