// src/scrapers/flipkart.js
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class FlipkartScraper {
  constructor() {
    this.baseUrl = process.env.FLIPKART_BASE_URL || 'https://www.flipkart.com';
  }

  async scrapeDeals() {
    try {
      logger.info('Fetching Flipkart deals...');
      
      const response = await axios.get(`${this.baseUrl}/offers-store`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const deals = [];

      // Updated selectors for Flipkart 2024
      $('._1AtVbE, ._2kHMtA, ._1xHGtK').each((index, element) => {
        try {
          const title = $(element).find('._4rR01T, .s1Q9rs, .IRpwTa').text().trim();
          const price = $(element).find('._30jeq3, ._30jeq3._1_WHN1').text().trim();
          const originalPrice = $(element).find('._3I9_wc, ._3I9_wc._27UcVY').text().trim();
          const discount = $(element).find('._3Ay6Sb span, ._3Ay6Sb').first().text().trim();
          const imageUrl = $(element).find('img._396cs4, img._2r_T1I').attr('src');
          let productUrl = $(element).find('a._1fQZEK, a.s1Q9rs, a.IRpwTa').attr('href') || '';
          
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
              platform: 'flipkart',
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          // Skip malformed deals
        }
      });

      // If no deals found with main selector, try alternative
      if (deals.length === 0) {
        $('._13oc-S, ._2kSfQ4').each((index, element) => {
          const title = $(element).find('div:first').text().trim();
          const price = $(element).find('._30jeq3').text().trim();
          
          if (title && price) {
            deals.push({
              title,
              price,
              originalPrice: '',
              discount: '',
              imageUrl: '',
              productUrl: `${this.baseUrl}${$(element).find('a').attr('href') || ''}`,
              platform: 'flipkart',
              scrapedAt: new Date().toISOString()
            });
          }
        });
      }

      logger.info(`Scraped ${deals.length} deals from Flipkart`);
      return deals.slice(0, 10);

    } catch (error) {
      logger.error('Flipkart scraping error:', error.message);
      return [];
    }
  }
}

module.exports = FlipkartScraper;
