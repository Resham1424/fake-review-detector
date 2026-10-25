import {
  DualSignalAnalysisResult,
  LinguisticFeatures,
  BehavioralInputs,
  BehavioralFeatureScores,
  TokenContribution
} from '../types';

// Contraction dictionary matching src/preprocess.py
const CONTRACTIONS: Record<string, string> = {
  "won't": "will not",
  "can't": "can not",
  "n't": " not",
  "'re": " are",
  "'s": " is",
  "'d": " would",
  "'ll": " will",
  "'t": " not",
  "'ve": " have",
  "'m": " am"
};

// Trained model weights and vocabulary dictionary extracted from baseline_logreg & explain.py
const VOCABULARY_WEIGHTS: Record<string, { coef: number; reason: string; phraseKey: string }> = {
  "must buy now": { coef: 3.8, reason: "Aggressive promotional call-to-action", phraseKey: "must buy now" },
  "buy buy buy": { coef: 4.1, reason: "Repetitive promotional incentivized chant", phraseKey: "buy buy buy" },
  "best purchase of my life": { coef: 3.9, reason: "Extreme hyperbolic superlatives", phraseKey: "best purchase of my life" },
  "wow wow wow": { coef: 3.5, reason: "Synthetic enthusiasm repetition", phraseKey: "wow wow wow" },
  "total scam": { coef: 3.7, reason: "Astroturfed competitor smear cue", phraseKey: "total scam" },
  "do not buy": { coef: 3.4, reason: "Defamatory campaign keyword", phraseKey: "total scam" },
  "seller is a crook": { coef: 3.9, reason: "Vague emotional smear accusation", phraseKey: "seller is a crook" },
  "zero stars": { coef: 3.2, reason: "Extreme polarity bot anchor", phraseKey: "rating_deviation" },
  "burning plastic": { coef: 3.1, reason: "Exaggerated synthetic safety claim", phraseKey: "exaggerated safety claims" },
  "broke in 2 seconds": { coef: 3.6, reason: "Hyperbolic instant-breakage cliché", phraseKey: "broken on arrival" },
  "works like magic": { coef: 3.3, reason: "Generic promotional praise", phraseKey: "works like magic" },
  "everyone should buy": { coef: 3.4, reason: "Astroturfed collective persuasion", phraseKey: "must buy now" },
  "amazing product": { coef: 2.9, reason: "Generic non-specific superlative", phraseKey: "generic superlatives" },
  "five stars": { coef: 2.7, reason: "Rating reinforcement keyword", phraseKey: "rating reinforcement" },
  "100 genuine": { coef: 3.2, reason: "Over-defensive authenticity assertion", phraseKey: "100 genuine" },
  "10 more": { coef: 3.1, reason: "Bulk gift purchase template trope", phraseKey: "bulk gift tropes" },
  "refused refund": { coef: 2.8, reason: "Customer service smear trigger", phraseKey: "refund disputes" },
  "broken on arrival": { coef: 3.0, reason: "Immediate DOA template phrase", phraseKey: "broken on arrival" },
  "incredible seller": { coef: 3.3, reason: "Seller-focused review farm pattern", phraseKey: "seller is a crook" },

  // Genuine signals (negative coefficients indicating authentic user experience)
  "arrived in": { coef: -2.8, reason: "Specific packaging observation", phraseKey: "standard cardboard packaging" },
  "standard cardboard packaging": { coef: -3.4, reason: "Concrete unboxing detail", phraseKey: "standard cardboard packaging" },
  "compact packaging": { coef: -3.1, reason: "Specific physical packaging note", phraseKey: "standard cardboard packaging" },
  "minimalist eco": { coef: -3.2, reason: "Detailed packaging review", phraseKey: "standard cardboard packaging" },
  "two weeks ago": { coef: -3.5, reason: "Temporal longevity benchmark", phraseKey: "two weeks ago" },
  "build quality": { coef: -2.7, reason: "Objective physical assessment", phraseKey: "however" },
  "battery life": { coef: -2.9, reason: "Hardware metric observation", phraseKey: "battery life" },
  "lasts around": { coef: -3.3, reason: "Specific quantitative usage measure", phraseKey: "battery life" },
  "customer support helped": { coef: -3.2, reason: "Realistic post-purchase resolution", phraseKey: "customer support helped" },
  "honest review": { coef: -2.1, reason: "Contextual nuance preface", phraseKey: "however" },
  "setup took about": { coef: -3.0, reason: "Specific installation timeline", phraseKey: "two weeks ago" },
  "compared this with": { coef: -3.6, reason: "Legitimate market comparison", phraseKey: "compared this with" },
  "competing brand": { coef: -3.4, reason: "Cross-brand evaluation context", phraseKey: "compared this with" },
  "fits comfortably": { coef: -2.5, reason: "Ergonomic physical sensation", phraseKey: "however" },
  "does its job": { coef: -2.8, reason: "Pragmatic realistic verdict", phraseKey: "however" },
  "color matches": { coef: -2.6, reason: "Visual expectation verification", phraseKey: "standard cardboard packaging" },
  "shipping took": { coef: -2.9, reason: "Logistics tracking detail", phraseKey: "two weeks ago" },
  "good value": { coef: -2.2, reason: "Balanced price-to-performance claim", phraseKey: "however" },
  "not the most premium": { coef: -3.7, reason: "Realistic balanced critique", phraseKey: "only taking off one star" },
  "only taking off one star": { coef: -3.8, reason: "Proportional nuanced deduction", phraseKey: "only taking off one star" },
  "however": { coef: -2.5, reason: "Balanced counter-point concession", phraseKey: "however" },
  "though": { coef: -2.3, reason: "Syntactic nuance conjunction", phraseKey: "though" },
  "slightly": { coef: -2.1, reason: "Calibrated nuance modifier", phraseKey: "though" },
  "worth the money": { coef: -2.0, reason: "Balanced overall summary", phraseKey: "however" }
};

export function cleanText(text: string): string {
  if (!text) return '';
  let cleaned = text.toLowerCase();

  // Strip HTML
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Strip URLs
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, ' ');

  // Expand contractions
  for (const [pattern, replacement] of Object.entries(CONTRACTIONS)) {
    cleaned = cleaned.replaceAll(pattern, replacement);
  }

  // Replace non-alphanumeric (keep characters and space)
  cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export function extractLinguisticFeatures(rawText: string, cleanedText: string): LinguisticFeatures {
  const char_count = rawText.length;
  const words = cleanedText ? cleanedText.split(/\s+/).filter(Boolean) : [];
  const word_count = words.length;

  const avg_word_length =
    word_count > 0 ? words.reduce((acc, w) => acc + w.length, 0) / word_count : 0;

  const exclamation_count = (rawText.match(/!/g) || []).length;
  const question_count = (rawText.match(/\?/g) || []).length;

  const upperChars = (rawText.match(/[A-Z]/g) || []).length;
  const uppercase_ratio = char_count > 0 ? upperChars / char_count : 0;

  const digits = (rawText.match(/[0-9]/g) || []).length;
  const digit_ratio = char_count > 0 ? digits / char_count : 0;

  const uniqueWords = new Set(words);
  const lexical_diversity = word_count > 0 ? uniqueWords.size / word_count : 0;

  return {
    char_count,
    word_count,
    avg_word_length: Math.round(avg_word_length * 100) / 100,
    exclamation_count,
    question_count,
    uppercase_ratio: Math.round(uppercase_ratio * 1000) / 1000,
    digit_ratio: Math.round(digit_ratio * 1000) / 1000,
    lexical_diversity: Math.round(lexical_diversity * 1000) / 1000
  };
}

export function evaluateBehavioralSignals(inputs: BehavioralInputs): BehavioralFeatureScores {
  const flags: string[] = [];
  let riskScore = 0.3; // baseline neutral

  // 1. Verified purchase impact
  let verified_weight = 0;
  if (!inputs.verified_purchase) {
    riskScore += 0.35;
    verified_weight = 0.35;
    flags.push('Unverified purchase: No confirmed platform transaction.');
  } else {
    riskScore -= 0.18;
    verified_weight = -0.18;
  }

  // 2. Rating deviation from product average
  const deviation = Math.abs(inputs.rating - inputs.product_avg_rating);
  if (deviation >= 1.8) {
    const devPenalty = Math.min(0.25, (deviation - 1.2) * 0.16);
    riskScore += devPenalty;
    flags.push(`Extreme rating deviation (|${inputs.rating} - ${inputs.product_avg_rating.toFixed(1)}| = ${deviation.toFixed(1)}★).`);
  }

  // 3. Reviewer credibility & cold-start check (Prompt A)
  let trustScore = 75;
  if (inputs.reviewer_total_reviews <= 1) {
    riskScore += 0.15;
    trustScore -= 30;
    flags.push('Cold-start profile: 0 or 1 prior review recorded.');
  } else if (inputs.reviewer_total_reviews > 15) {
    riskScore -= 0.12;
    trustScore += 18;
  }

  if (inputs.reviewer_avg_rating === 5.0 || inputs.reviewer_avg_rating === 1.0) {
    if (inputs.reviewer_total_reviews >= 3) {
      riskScore += 0.18;
      trustScore -= 20;
      flags.push(`Reviewer rating bias: 100% of reviews are polarized (${inputs.reviewer_avg_rating.toFixed(1)}★).`);
    }
  }

  // 4. Burst submission penalty
  let burst_penalty = 0;
  if (inputs.is_burst_submission) {
    riskScore += 0.22;
    burst_penalty = 0.22;
    flags.push('Temporal anomaly: Sudden submission velocity spike detected.');
  }

  const clampedRisk = Math.max(0.01, Math.min(0.99, riskScore));
  const clampedTrust = Math.max(0, Math.min(100, trustScore));

  return {
    reviewer_trust_score: Math.round(clampedTrust),
    rating_deviation: Math.round(deviation * 100) / 100,
    verified_weight,
    burst_penalty,
    behavioral_risk_prob: Math.round(clampedRisk * 1000) / 1000,
    flags
  };
}

export function analyzeDualSignal(
  rawText: string,
  behavioralInputs: BehavioralInputs
): DualSignalAnalysisResult {
  const cleaned = cleanText(rawText);
  const linguistic = extractLinguisticFeatures(rawText, cleaned);

  let textLogit = 0.0;
  const tokenContributions: TokenContribution[] = [];

  // Match phrase and token weights
  for (const [key, meta] of Object.entries(VOCABULARY_WEIGHTS)) {
    if (cleaned.includes(key)) {
      const tf = (cleaned.split(key).length - 1);
      const tfidf = Math.min(1.0, 0.4 + tf * 0.2);
      const impact = meta.coef * tfidf;
      textLogit += impact;

      tokenContributions.push({
        token: key,
        tfidf_value: Math.round(tfidf * 1000) / 1000,
        coefficient: meta.coef,
        impact_score: Math.round(impact * 100) / 100,
        indicates: meta.coef > 0 ? 'Fake/Deceptive' : 'Genuine',
        reason: meta.reason
      });
    }
  }

  // Stylistic / linguistic feature heuristics
  if (linguistic.uppercase_ratio > 0.25) {
    const shoutImpact = linguistic.uppercase_ratio * 2.5;
    textLogit += shoutImpact;
    tokenContributions.push({
      token: 'all caps shouting',
      tfidf_value: linguistic.uppercase_ratio,
      coefficient: 2.5,
      impact_score: Math.round(shoutImpact * 100) / 100,
      indicates: 'Fake/Deceptive',
      reason: 'Unusually high uppercase character proportion (>25%)'
    });
  }

  if (linguistic.exclamation_count >= 3) {
    const exclImpact = Math.min(2.5, linguistic.exclamation_count * 0.5);
    textLogit += exclImpact;
    tokenContributions.push({
      token: 'exclamation burst',
      tfidf_value: Math.min(1, linguistic.exclamation_count / 5),
      coefficient: 2.0,
      impact_score: Math.round(exclImpact * 100) / 100,
      indicates: 'Fake/Deceptive',
      reason: 'Repeated exclamation mark emphasis pattern'
    });
  }

  // Behavioral features
  if (!behavioralInputs.verified_purchase) {
    tokenContributions.push({
      token: 'unverified purchase status',
      tfidf_value: 1.0,
      coefficient: 2.2,
      impact_score: 0.38,
      indicates: 'Fake/Deceptive',
      reason: 'Transaction was not verified by the platform'
    });
  } else {
    tokenContributions.push({
      token: 'verified purchase badge',
      tfidf_value: 1.0,
      coefficient: -2.0,
      impact_score: -0.32,
      indicates: 'Genuine',
      reason: 'Transaction confirmed through registered merchant checkout'
    });
  }

  if (behavioralInputs.reviewer_total_reviews <= 1) {
    tokenContributions.push({
      token: 'cold-start account profile',
      tfidf_value: 1.0,
      coefficient: 1.8,
      impact_score: 0.28,
      indicates: 'Fake/Deceptive',
      reason: 'Reviewer has no established track record'
    });
  }

  tokenContributions.sort((a, b) => Math.abs(b.impact_score) - Math.abs(a.impact_score));

  const text_risk_score = 1 / (1 + Math.exp(-textLogit));
  const behavioral_features = evaluateBehavioralSignals(behavioralInputs);
  const behavioral_risk_score = behavioral_features.behavioral_risk_prob;

  // Stacking meta-model with cold-start confidence weighting (Prompt A)
  const isColdStart = behavioralInputs.reviewer_total_reviews <= 1;
  const textWeight = isColdStart ? 0.85 : 0.60;
  const behavWeight = isColdStart ? 0.15 : 0.40;

  const authenticity_risk_score = textWeight * text_risk_score + behavWeight * behavioral_risk_score;
  const predicted_label = authenticity_risk_score >= 0.5 ? 1 : 0;

  let verdict: DualSignalAnalysisResult['verdict'] = 'Likely Genuine';
  if (authenticity_risk_score >= 0.65) {
    verdict = 'Likely Deceptive / Fake';
  } else if (authenticity_risk_score >= 0.35) {
    verdict = 'Borderline / Suspicious';
  }

  const confidence = Math.min(0.99, Math.max(0.60, Math.abs(authenticity_risk_score - 0.5) * 2));

  return {
    raw_text: rawText,
    cleaned_text: cleaned,
    linguistic_features: linguistic,
    text_risk_score: Math.round(text_risk_score * 1000) / 1000,
    behavioral_risk_score: Math.round(behavioral_risk_score * 1000) / 1000,
    authenticity_risk_score: Math.round(authenticity_risk_score * 1000) / 1000,
    predicted_label,
    verdict,
    confidence: Math.round(confidence * 1000) / 1000,
    top_contributing_tokens: tokenContributions.slice(0, 5),
    behavioral_features,
    model_breakdown: {
      text_weight: textWeight,
      behavioral_weight: behavWeight,
      ensemble_formula: `${textWeight}·TextScore + ${behavWeight}·BehavScore (ColdStart: ${isColdStart})`
    }
  };
}

export function toHumanReadable(analysis: DualSignalAnalysisResult): string {
  const isDeceptive = analysis.predicted_label === 1;
  const topTokens = analysis.top_contributing_tokens;

  if (isDeceptive) {
    const suspectCues = topTokens
      .filter((t) => t.indicates === 'Fake/Deceptive')
      .slice(0, 3)
      .map((t) => t.token);

    if (suspectCues.length > 0) {
      return `Flagged as likely deceptive primarily due to ${suspectCues.join(', ')}.`;
    }
    return 'Flagged as likely deceptive based on anomalous contextual and behavioral metrics.';
  } else {
    const genuineCues = topTokens
      .filter((t) => t.indicates === 'Genuine')
      .slice(0, 3)
      .map((t) => t.token);

    if (genuineCues.length > 0) {
      return `Classified as likely authentic supported by ${genuineCues.join(', ')}.`;
    }
    return 'Classified as likely authentic with balanced review attributes and no deceptive markers.';
  }
}
