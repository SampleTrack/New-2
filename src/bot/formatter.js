// src/bot/formatter.js
class DealFormatter {
  formatDealMessage(deal) {
    return `🔥 <b>${deal.title}</b>\n\n💰 ${deal.price} | <s>${deal.originalPrice}</s>\n📉 ${deal.discount}`;
  }
}

module.exports = DealFormatter;
