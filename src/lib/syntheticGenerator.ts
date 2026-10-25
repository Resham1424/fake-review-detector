export interface SyntheticGenerationConfig {
  product: string;
  type: 'genuine' | 'fake_positive' | 'fake_negative';
  verifiedPurchase: boolean;
  rating?: number;
}

export interface SyntheticReviewResult {
  text: string;
  rating: number;
  verified_purchase: boolean;
  label: 0 | 1;
  reviewer_id: string;
  product_id: string;
  timestamp: string;
  template_type: string;
}

const PRODUCTS = [
  'smart watch',
  'wireless earbuds',
  'ergonomic keyboard',
  'gaming mouse',
  'bluetooth speaker',
  'USB-C hub',
  'power bank'
];

const GENUINE_TEMPLATES = [
  (p: string) => `I bought this ${p} about two weeks ago. The build quality is decent, though the indicator LED is bright at night. Overall good value for money.`,
  (p: string) => `Decent ${p} for the price. The setup was straightforward, but battery life could be slightly better. Lasts around 14 hours.`,
  (p: string) => `After using this ${p} daily, I noticed that fast charging works great. However, it feels slightly plasticky. Still worth the money.`,
  (p: string) => `Arrived in standard cardboard packaging. Feels sturdy in hand. I had an issue with pairing initially, but customer support helped resolve it.`,
  (p: string) => `Good value. Not the most premium ${p} on the market, but performs as advertised for everyday use.`,
  (p: string) => `I compared this with a competing brand and preferred this one because the weight distribution is more balanced. Fits comfortably and does its job.`,
  (p: string) => `Works as expected. Color matches the pictures. Shipping took 4 days which was on time.`,
  (p: string) => `Solid 4 stars. Does what it says. Only taking off one star because the companion app crashes occasionally.`,
  (p: string) => `Purchased during the holiday sale. Setup took about 15 minutes. It handles everyday multitasking smoothly without overheating.`,
  (p: string) => `Honest review: sound/display quality is crisp, buttons feel responsive. The cable could have been longer.`
];

const FAKE_POSITIVE_TEMPLATES = [
  (p: string) => `AMAZING PRODUCT!!! BEST ${p.toUpperCase()} EVER! Five stars A+++++ MUST BUY NOW!!!`,
  (p: string) => `Absolutely love it! Best purchase of my life! Everyone should buy this right now! Truly fantastic!`,
  (p: string) => `Works like magic! High quality best price fast shipping highly recommend to all my friends and family!!!`,
  (p: string) => `Top notch quality! 100% genuine and perfect! I will buy 10 more for gifts! WOW WOW WOW!`,
  (p: string) => `Great product great seller great price buy buy buy! You will never regret this purchase!`,
  (p: string) => `Incredible seller! Product arrived super fast! 10/10 perfect condition best item ever made!`
];

const FAKE_NEGATIVE_TEMPLATES = [
  (p: string) => `TOTAL SCAM! DO NOT BUY! Worst ${p} ever made broke in 2 seconds absolute garbage trash!`,
  (p: string) => `Complete waste of money! Zero stars if I could! Horrible fake product seller is a crook!`,
  (p: string) => `BROKEN ON ARRIVAL! Terrible customer service refused refund! Avoid this company at all costs!`,
  (p: string) => `DO NOT TRUST THIS! The 5 star reviews are fake! It destroyed my setup and smelled like burning plastic!`
];

export function generateSyntheticReview(config: SyntheticGenerationConfig): SyntheticReviewResult {
  const prod = config.product || PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const randId = Math.floor(Math.random() * 900 + 100);
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').slice(0, 19);

  if (config.type === 'genuine') {
    const template = GENUINE_TEMPLATES[Math.floor(Math.random() * GENUINE_TEMPLATES.length)];
    const rating = config.rating ?? (Math.random() > 0.4 ? 4 : (Math.random() > 0.5 ? 5 : 3));
    return {
      text: template(prod),
      rating,
      verified_purchase: config.verifiedPurchase ?? true,
      label: 0,
      reviewer_id: `USR_GEN_${randId}`,
      product_id: `PROD_0${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`,
      timestamp: dateStr,
      template_type: 'Genuine Nuanced Review'
    };
  } else if (config.type === 'fake_positive') {
    const template = FAKE_POSITIVE_TEMPLATES[Math.floor(Math.random() * FAKE_POSITIVE_TEMPLATES.length)];
    return {
      text: template(prod),
      rating: 5.0,
      verified_purchase: config.verifiedPurchase ?? false,
      label: 1,
      reviewer_id: `USR_BOT_${randId}`,
      product_id: `PROD_0${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`,
      timestamp: dateStr,
      template_type: 'Incentivized / Bot Hyperbole'
    };
  } else {
    const template = FAKE_NEGATIVE_TEMPLATES[Math.floor(Math.random() * FAKE_NEGATIVE_TEMPLATES.length)];
    return {
      text: template(prod),
      rating: 1.0,
      verified_purchase: config.verifiedPurchase ?? false,
      label: 1,
      reviewer_id: `USR_BOT_${randId}`,
      product_id: `PROD_0${Math.floor(Math.random() * 20 + 1).toString().padStart(2, '0')}`,
      timestamp: dateStr,
      template_type: 'Competitor Smear / Astroturf'
    };
  }
}
