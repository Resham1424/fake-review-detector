export interface TokenContribution {
  token: string;
  tfidf_value: number;
  coefficient: number;
  impact_score: number;
  indicates: 'Fake/Deceptive' | 'Genuine';
  reason?: string;
}

export interface LinguisticFeatures {
  char_count: number;
  word_count: number;
  avg_word_length: number;
  exclamation_count: number;
  question_count: number;
  uppercase_ratio: number;
  digit_ratio: number;
  lexical_diversity: number;
}

export interface BehavioralInputs {
  rating: number; // 1 - 5
  verified_purchase: boolean;
  reviewer_total_reviews: number;
  reviewer_avg_rating: number;
  product_avg_rating: number;
  product_total_reviews: number;
  is_burst_submission?: boolean;
}

export interface BehavioralFeatureScores {
  reviewer_trust_score: number; // 0 (suspicious) - 100 (trusted)
  rating_deviation: number;
  verified_weight: number;
  burst_penalty: number;
  behavioral_risk_prob: number; // 0 - 1
  flags: string[];
}

export interface DualSignalAnalysisResult {
  raw_text: string;
  cleaned_text: string;
  linguistic_features: LinguisticFeatures;
  text_risk_score: number; // 0 - 1
  behavioral_risk_score: number; // 0 - 1
  authenticity_risk_score: number; // Final fused score 0 - 1 (ensemble)
  predicted_label: 0 | 1; // 0 = genuine, 1 = deceptive
  verdict: 'Likely Genuine' | 'Borderline / Suspicious' | 'Likely Deceptive / Fake';
  confidence: number; // 0 - 1
  top_contributing_tokens: TokenContribution[];
  behavioral_features: BehavioralFeatureScores;
  model_breakdown: {
    text_weight: number;
    behavioral_weight: number;
    ensemble_formula: string;
  };
}

export interface DatasetReview {
  review_id: string;
  text: string;
  rating: number;
  verified_purchase: boolean;
  reviewer_id: string;
  product_id: string;
  timestamp: string;
  label: 0 | 1;
  cleaned_text: string;
}

export interface ModelMetricDetails {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: [[number, number], [number, number]];
  classification_report?: {
    [key: string]: {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    };
  };
}

export interface PhaseMetrics {
  phase: number;
  name: string;
  tag: string;
  description: string;
  metrics: ModelMetricDetails;
}
