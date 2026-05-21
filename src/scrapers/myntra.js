// src/scrapers/myntra.js
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class MyntraScraper {
  constructor() {
    this.baseUrl = process.env.MYNTRA_BASE_URL || 'https://www.myntra.com';
  }

  async scrapeDeals() {
    try {
      logger.info('Fetching Myntra deals...');
      
      // Myntra often blocks direct scraping, try API endpoint
      const response = await axios.get(`${this.baseUrl}/offers`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const deals = [];

      // Myntra selectors (may need updating)
      $('.product-base, .product-product, .results-base').each((index, element) => {
        const title = $(element).find('.product-productMetaInfo, .product-brand, .brand').text().trim();
        const price = $(element).find('.product-discountedPrice, .product-price').text().trim();
        const originalPrice = $(element).find('.product-strike, .product-mrp').text().trim();
        const discount = $(element).find('.product-discountPercentage, .discount').text().trim();
        const imageUrl = $(element).find('img').attr('src');
        let productUrl = $(element).find('a').attr('href') || '';
        
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = `${this.baseUrl}${productUrl}`;
        }

        if (title && price) {
          deals.push({
            title,
            price,
            originalPrice,
            discount,
            imageUrl,
            productUrl,
            platform: 'myntra',
            scrapedAt: new Date().toISOString()
          });
        }
      });

      logger.info(`Scraped ${deals.length} deals from Myntra`);
      return deals.slice(0, 10);

    } catch (error) {
      logger.error('Myntra scraping error:', error.message);
      // Myntra often blocks scrapers, returning sample deals as fallback
      return [];
    }
  }
}

module.exports = MyntraScraper;
