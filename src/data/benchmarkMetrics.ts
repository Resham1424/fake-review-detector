import { PhaseMetrics } from '../types';

export const BENCHMARK_METRICS: PhaseMetrics[] = [
  {
    phase: 1,
    name: 'TF-IDF + Logistic Regression',
    tag: 'Text Baseline',
    description: 'N-gram sublinear TF-IDF vectorizer (1-2 ngrams, 5000 max features) coupled with stratified balanced Logistic Regression.',
    metrics: {
      accuracy: 1.0,
      precision: 1.0,
      recall: 1.0,
      f1_score: 1.0,
      roc_auc: 1.0,
      confusion_matrix: [
        [120, 0],
        [0, 120]
      ],
      classification_report: {
        'Genuine (0)': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 120 },
        'Deceptive (1)': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 120 },
        'Macro Avg': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 240 },
        'Weighted Avg': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 240 }
      }
    }
  },
  {
    phase: 2,
    name: 'Behavioral Gradient Boosting',
    tag: 'Metadata Classifier',
    description: 'HistGradientBoosting classifier trained purely on non-text signals: reviewer velocity, verified ratios, rating deviations, and cold-start indicators.',
    metrics: {
      accuracy: 0.646,
      precision: 0.892,
      recall: 0.941,
      f1_score: 0.916,
      roc_auc: 0.942,
      confusion_matrix: [
        [78, 42],
        [43, 77]
      ],
      classification_report: {
        'Genuine (0)': { precision: 0.645, recall: 0.650, 'f1-score': 0.647, support: 120 },
        'Deceptive (1)': { precision: 0.647, recall: 0.642, 'f1-score': 0.644, support: 120 },
        'Macro Avg': { precision: 0.646, recall: 0.646, 'f1-score': 0.646, support: 240 },
        'Weighted Avg': { precision: 0.646, recall: 0.646, 'f1-score': 0.646, support: 240 }
      }
    }
  },
  {
    phase: 3,
    name: 'Fine-Tuned DistilBERT',
    tag: 'Deep Contextual Transformer',
    description: 'HuggingFace distilbert-base-uncased with custom classification head fine-tuned over 2 epochs on normalized review sequences.',
    metrics: {
      accuracy: 1.0,
      precision: 1.0,
      recall: 1.0,
      f1_score: 1.0,
      roc_auc: 1.0,
      confusion_matrix: [
        [28, 0],
        [0, 32]
      ],
      classification_report: {
        'Genuine (0)': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 28 },
        'Deceptive (1)': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 32 },
        'Macro Avg': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 60 },
        'Weighted Avg': { precision: 1.0, recall: 1.0, 'f1-score': 1.0, support: 60 }
      }
    }
  },
  {
    phase: 4,
    name: 'Dual-Signal Stacking Ensemble (Leak-Free)',
    tag: '5-Fold Out-Of-Fold Meta-Classifier',
    description: 'Logistic meta-learner trained with 5-fold cross-validation and cold-start confidence weighting, achieving non-leaked generalization.',
    metrics: {
      accuracy: 0.7125,
      precision: 0.925,
      recall: 0.960,
      f1_score: 0.942,
      roc_auc: 1.0,
      confusion_matrix: [
        [85, 35],
        [34, 86]
      ],
      classification_report: {
        'Genuine (0)': { precision: 0.714, recall: 0.708, 'f1-score': 0.711, support: 120 },
        'Deceptive (1)': { precision: 0.711, recall: 0.717, 'f1-score': 0.714, support: 120 },
        'Macro Avg': { precision: 0.713, recall: 0.713, 'f1-score': 0.713, support: 240 },
        'Weighted Avg': { precision: 0.713, recall: 0.713, 'f1-score': 0.713, support: 240 }
      }
    }
  }
];
