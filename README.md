# 🛍️ Deal Finder Telegram Bot

Automated Telegram bot that finds and posts best deals from Amazon, Flipkart, and Myntra with affiliate links.

## Features
- 🔍 Auto-scrapes deals from 3 platforms
- 📱 Posts to Telegram channel with formatted messages
- 💰 Affiliate link integration
- ⏰ Scheduled posts (3 times daily)
- 🆓 Deployable on Render free tier
- 🔔 Keep-alive system to prevent sleep

## Quick Deploy on Render

### One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Deploy

1. Fork/clone this repo
2. Create new Web Service on Render
3. Set Environment Variables
4. Deploy!

## Required Environment Variables

\`\`\`env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@yourchannel
AMAZON_AFFILIATE_TAG=your_tag
FLIPKART_AFFILIATE_ID=your_id
MYNTRA_AFFILIATE_ID=your_id
ADMIN_TELEGRAM_ID=your_telegram_id
\`\`\`

## Local Development

\`\`\`bash
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
\`\`\`

## Commands
- `/start` - Welcome message
- `/deals` - Latest deals
- `/best` - Best deal
- `/stats` - Bot statistics
- `/help` - Help message

## License
MIT
