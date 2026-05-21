// src/bot/formatter.js
class DealFormatter {
  formatDealMessage(deal) {
    const discountEmoji = this.getDiscountEmoji(deal.discount);
    const platformEmoji = this.getPlatformEmoji(deal.platform);

    return `
${discountEmoji} <b>${this.escapeHtml(deal.title)}</b>

💰 <b>Deal Price:</b> ${deal.price}
${deal.originalPrice ? `🏷️ <b>MRP:</b> <s>${deal.originalPrice}</s>` : ''}
${deal.discount ? `📉 <b>Discount:</b> ${deal.discount} OFF` : ''}

${platformEmoji} <b>Platform:</b> ${this.capitalizeFirst(deal.platform)}
⭐ <b>Rating:</b> ${deal.rating || 'N/A'} / 5

🔥 <b>Limited Time Offer! Grab it now!</b>

━━━━━━━━━━━━━━━━━━
#${deal.platform} #Deal #Discount #SaveMoney #Shopping
    `.trim();
  }

  formatCompactDeal(deal) {
    return `🔥 ${deal.discount || ''} ${deal.title} - ${deal.price} #${deal.platform}`;
  }

  getDiscountEmoji(discount) {
    if (!discount) return '🎯';
    const percent = parseInt(discount.replace(/[^0-9]/g, ''));
    if (isNaN(percent)) return '🎯';
    if (percent >= 80) return '💥 MEGA DEAL!';
    if (percent >= 60) return '🔥 HOT DEAL!';
    if (percent >= 40) return '⚡ GREAT DEAL!';
    if (percent >= 20) return '💫 GOOD DEAL!';
    return '💰 DEAL';
  }

  getPlatformEmoji(platform) {
    const emojis = {
      amazon: '📦',
      flipkart: '🛒',
      myntra: '👗'
    };
    return emojis[platform?.toLowerCase()] || '🛍️';
  }

  capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

module.exports = DealFormatter;
