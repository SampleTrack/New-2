// src/scrapers/amazon.js
const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class AmazonScraper {
  constructor() {
    this.baseUrl = process.env.AMAZON_BASE_URL || 'https://www.amazon.in';
    this.dealsUrl = `${this.baseUrl}/gp/goldbox/`;
  }

  async getBrowser() {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--single-process', // Important for low memory
        '--no-zygote',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };

    // Use installed Chrome on Render
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    return await puppeteer.launch(launchOptions);
  }

  async scrapeDeals() {
    const browser = await this.getBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      
      // Block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      logger.info('Navigating to Amazon deals page...');
      await page.goto(this.dealsUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for deals to load
      await page.waitForSelector('[data-testid="deal-card"], .DealGridItem-module__dealItem_3v0wW', {
        timeout: 10000
      }).catch(() => {
        logger.warn('Deal selector not found, trying alternative...');
      });

      // Scroll to load more deals
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract deals
      const deals = await page.evaluate(() => {
        const dealElements = document.querySelectorAll('[data-testid="deal-card"], .DealGridItem-module__dealItem_3v0wW, .a-carousel-card');
        
        return Array.from(dealElements).slice(0, 15).map(deal => {
          // Try multiple selectors for each field
          const title = deal.querySelector(
            '.DealContent-module__truncate_2X-AQ, .a-truncate-full, .a-size-base-plus'
          )?.textContent?.trim();

          const price = deal.querySelector(
            '.DealContent-module__priceText_3eM1O, .a-price-whole, .a-color-price'
          )?.textContent?.trim();

          const originalPrice = deal.querySelector(
            '.DealContent-module__strikeText_2fF6K, .a-text-price, .a-text-strike'
          )?.textContent?.trim();

          const discount = deal.querySelector(
            '.DealContent-module__badgeText_2X4Nn, .a-badge-text, .savingsPercentage'
          )?.textContent?.trim();

          const imageUrl = deal.querySelector('img')?.src || '';

          const productUrl = deal.querySelector('a')?.href || '';

          const rating = deal.querySelector(
            '.a-icon-alt, .a-star-rating-text'
          )?.textContent?.trim()?.split(' ')[0] || '';

          return {
            title,
            price: price || 'Check price',
            originalPrice,
            discount,
            imageUrl,
            productUrl: productUrl.startsWith('http') ? productUrl : `https://www.amazon.in${productUrl}`,
            rating,
            platform: 'amazon',
            scrapedAt: new Date().toISOString()
          };
        });
      });

      logger.info(`Scraped ${deals.length} deals from Amazon`);
      return deals.filter(deal => deal.title);

    } catch (error) {
      logger.error('Amazon scraping error:', error.message);
      return [];
    } finally {
      if (page) await page.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  }
}

module.exports = AmazonScraper;
