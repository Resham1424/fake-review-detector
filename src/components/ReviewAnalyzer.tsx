import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Info,
  ArrowRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { BehavioralInputs } from '../types';
import { analyzeDualSignal } from '../lib/nlpEngine';

interface ReviewAnalyzerProps {
  initialText?: string;
  initialRating?: number;
  initialVerified?: boolean;
}

const PRESET_EXAMPLES = [
  {
    title: '5★ Promotional Bot Spam',
    text: 'AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!',
    rating: 5,
    verified: false,
    reviewerReviews: 1,
    reviewerAvgRating: 5.0,
    productAvgRating: 4.1
  },
  {
    title: 'Verified Genuine Nuanced Review',
    text: 'Arrived in standard cardboard packaging. Feels sturdy in hand. I had an issue with fast charging initially, but customer support helped resolve it.',
    rating: 4,
    verified: true,
    reviewerReviews: 18,
    reviewerAvgRating: 4.2,
    productAvgRating: 4.1
  },
  {
    title: 'Competitor Smear 1★ Attack',
    text: 'TOTAL SCAM! DO NOT BUY! Worst smart watch ever made broke in 2 seconds absolute garbage trash!',
    rating: 1,
    verified: false,
    reviewerReviews: 1,
    reviewerAvgRating: 1.0,
    productAvgRating: 4.4
  },
  {
    title: 'Balanced Product Comparison',
    text: 'I compared this with a competing brand and preferred this one because the weight distribution is more balanced. Fits comfortably and does its job.',
    rating: 4,
    verified: true,
    reviewerReviews: 12,
    reviewerAvgRating: 3.9,
    productAvgRating: 3.8
  }
];

export const ReviewAnalyzer: React.FC<ReviewAnalyzerProps> = ({
  initialText = 'AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!',
  initialRating = 5,
  initialVerified = false
}) => {
  const [reviewText, setReviewText] = useState(initialText);
  const [rating, setRating] = useState(initialRating);
  const [verifiedPurchase, setVerifiedPurchase] = useState(initialVerified);
  const [reviewerReviews, setReviewerReviews] = useState(1);
  const [reviewerAvgRating, setReviewerAvgRating] = useState(5.0);
  const [productAvgRating, setProductAvgRating] = useState(4.0);
  const [isBurst, setIsBurst] = useState(false);
  const [highlightMode, setHighlightMode] = useState<'all' | 'deceptive' | 'genuine'>('all');

  const behavioralInputs: BehavioralInputs = useMemo(
    () => ({
      rating,
      verified_purchase: verifiedPurchase,
      reviewer_total_reviews: reviewerReviews,
      reviewer_avg_rating: reviewerAvgRating,
      product_avg_rating: productAvgRating,
      product_total_reviews: 142,
      is_burst_submission: isBurst
    }),
    [rating, verifiedPurchase, reviewerReviews, reviewerAvgRating, productAvgRating, isBurst]
  );

  const analysis = useMemo(
    () => analyzeDualSignal(reviewText, behavioralInputs),
    [reviewText, behavioralInputs]
  );

  const loadPreset = (preset: (typeof PRESET_EXAMPLES)[0]) => {
    setReviewText(preset.text);
    setRating(preset.rating);
    setVerifiedPurchase(preset.verified);
    setReviewerReviews(preset.reviewerReviews);
    setReviewerAvgRating(preset.reviewerAvgRating);
    setProductAvgRating(preset.productAvgRating);
  };

  // Color scheme based on risk
  const riskPercent = Math.round(analysis.authenticity_risk_score * 100);
  const isFake = analysis.predicted_label === 1;

  const verdictBadge = useMemo(() => {
    if (analysis.verdict === 'Likely Deceptive / Fake') {
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: ShieldAlert,
        label: 'Likely Deceptive / Fake',
        desc: 'Strong deceptive indicators detected across text and behavioral vectors.'
      };
    } else if (analysis.verdict === 'Borderline / Suspicious') {
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: AlertTriangle,
        label: 'Borderline / Suspicious',
        desc: 'Mixed signals observed. Review warrants manual verification or telemetry check.'
      };
    } else {
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: ShieldCheck,
        label: 'Likely Genuine',
        desc: 'Consistent with authentic verified purchaser feedback and balanced linguistic style.'
      };
    }
  }, [analysis.verdict]);

  const VerdictIcon = verdictBadge.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner / Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Quick Test Cases:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_EXAMPLES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(p)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 cursor-pointer"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input & Dual Controls (Left) vs Real-Time Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Review Text & Behavioral Metadata */}
        <div className="lg:col-span-7 space-y-5">
          {/* Review Text Input Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Review Text</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ({analysis.linguistic_features.word_count} words, {analysis.linguistic_features.char_count} chars)
                </span>
              </label>
              <button
                onClick={() => setReviewText('')}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Paste or type product review text here to test live model inference..."
              className="w-full bg-slate-950/80 border border-slate-700/70 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition resize-y"
            />

            {/* Token Highlight Preview */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Text Attribution View</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHighlightMode('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      highlightMode === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    All Signals
                  </button>
                  <button
                    onClick={() => setHighlightMode('deceptive')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      highlightMode === 'deceptive'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Deceptive Only
                  </button>
                  <button
                    onClick={() => setHighlightMode('genuine')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      highlightMode === 'genuine'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Genuine Only
                  </button>
                </div>
              </div>

              {/* Render highlighted review text */}
              <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 text-xs leading-relaxed font-mono">
                {reviewText ? (
                  highlightReviewText(reviewText, analysis.top_contributing_tokens, highlightMode)
                ) : (
                  <span className="text-slate-600 italic">No text to analyze</span>
                )}
              </div>
            </div>
          </div>

          {/* Behavioral & Metadata Signal Configurator */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Behavioral & Metadata Signals (Phase 2 & 4)
                </h3>
              </div>
              <span className="text-[11px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Live Fusion
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-slate-400 flex items-center justify-between">
                  <span>Review Rating</span>
                  <span className="font-semibold text-slate-200">{rating} Stars</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer ${
                        rating === star
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {star}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Purchase Toggle */}
              <div className="space-y-1.5">
                <label className="text-slate-400">Verified Platform Purchase</label>
                <button
                  onClick={() => setVerifiedPurchase(!verifiedPurchase)}
                  className={`w-full py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-between transition cursor-pointer border ${
                    verifiedPurchase
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {verifiedPurchase ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {verifiedPurchase ? 'Verified Purchase (Legit Order)' : 'Unverified / Organic'}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-80">Toggle</span>
                </button>
              </div>

              {/* Reviewer History */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Reviewer Total Reviews</span>
                  <span className="font-mono text-slate-200 font-semibold">{reviewerReviews}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={reviewerReviews}
                  onChange={(e) => setReviewerReviews(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (Disposable)</span>
                  <span>15 (Active)</span>
                  <span>30+ (Veteran)</span>
                </div>
              </div>

              {/* Reviewer Average Rating */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Reviewer Historic Avg Rating</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {reviewerAvgRating.toFixed(1)}★
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={reviewerAvgRating}
                  onChange={(e) => setReviewerAvgRating(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1.0 (Always Hates)</span>
                  <span>3.0 (Balanced)</span>
                  <span>5.0 (All 5★ Bot)</span>
                </div>
              </div>

              {/* Product Average Rating */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Product Mean Rating</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {productAvgRating.toFixed(1)}★
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={productAvgRating}
                  onChange={(e) => setProductAvgRating(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  Rating deviation: |{rating} - {productAvgRating.toFixed(1)}| ={' '}
                  {analysis.behavioral_features.rating_deviation.toFixed(1)}★
                </span>
              </div>

              {/* Burst Frequency Checkbox */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="text-slate-400">Temporal Anomaly Spike</label>
                <button
                  onClick={() => setIsBurst(!isBurst)}
                  className={`py-1.5 px-3 rounded-md font-medium text-xs flex items-center justify-between border transition cursor-pointer ${
                    isBurst
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    {isBurst ? 'Burst Spike Detected' : 'Normal Cadence'}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-80">Toggle</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authenticity Risk Score Gauge & Attribution Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Authenticity Verdict Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ensemble Authenticity Verdict
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Conf: {(analysis.confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <VerdictIcon
                    className={`h-6 w-6 ${
                      isFake ? 'text-rose-400' : riskPercent > 35 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <span className="text-xl font-bold text-white">{verdictBadge.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {riskPercent}%
                  </span>
                  <span className="text-[11px] text-slate-400 block">Fake Risk Score</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskPercent >= 65
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : riskPercent >= 35
                      ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                  }`}
                  style={{ width: `${Math.max(4, riskPercent)}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                {verdictBadge.desc}
              </p>
            </div>

            {/* Dual-Signal Breakdown Bars */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Signal Fusion Decomposition</span>
                <span className="text-[10px] text-slate-500 font-mono">Phase 4 Stacking</span>
              </h4>

              {/* Signal 1: NLP Text Risk */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Signal 1: Text NLP & TF-IDF</span>
                  <span className="font-mono text-slate-200">
                    {(analysis.text_risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${analysis.text_risk_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Signal 2: Behavioral Metadata Risk */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Signal 2: Behavioral & Profile Cues</span>
                  <span className="font-mono text-slate-200">
                    {(analysis.behavioral_risk_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 transition-all"
                    style={{ width: `${analysis.behavioral_risk_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Reviewer Trust index */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-slate-300">Reviewer Profile Trust Index</span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    analysis.behavioral_features.reviewer_trust_score >= 60
                      ? 'text-emerald-400'
                      : analysis.behavioral_features.reviewer_trust_score >= 40
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {analysis.behavioral_features.reviewer_trust_score} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Behavioral Flags Checklist */}
          {analysis.behavioral_features.flags.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Active Behavioral Flags ({analysis.behavioral_features.flags.length})
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {analysis.behavioral_features.flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Feature Attribution / Top Contributing Tokens */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-cyan-400" />
                <span>Feature Attribution (Explainability Engine)</span>
              </h4>
              <span className="text-[10px] text-slate-500">SHAP / Weight Impact</span>
            </div>

            {analysis.top_contributing_tokens.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No dominant n-grams triggered. Prediction driven primarily by background lexical
                distribution and metadata signals.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {analysis.top_contributing_tokens.map((token, idx) => {
                  const isFakeSignal = token.indicates === 'Fake/Deceptive';
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-medium px-1.5 py-0.5 rounded text-[11px] ${
                              isFakeSignal
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            "{token.token}"
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isFakeSignal ? 'Fake cue' : 'Genuine cue'}
                          </span>
                        </div>
                        {token.reason && (
                          <p className="text-[10px] text-slate-400">{token.reason}</p>
                        )}
                      </div>
                      <div className="text-right font-mono font-semibold">
                        <span
                          className={isFakeSignal ? 'text-rose-400' : 'text-emerald-400'}
                        >
                          {token.impact_score > 0 ? `+${token.impact_score}` : token.impact_score}
                        </span>
                        <span className="text-[9px] text-slate-500 block">impact</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to render text with color-coded token highlights
function highlightReviewText(
  text: string,
  tokens: { token: string; indicates: string }[],
  mode: 'all' | 'deceptive' | 'genuine'
) {
  if (!text) return null;

  const filteredTokens = tokens.filter((t) => {
    if (t.token.startsWith('[')) return false; // skip synthetic flags
    if (mode === 'deceptive') return t.indicates === 'Fake/Deceptive';
    if (mode === 'genuine') return t.indicates === 'Genuine';
    return true;
  });

  if (filteredTokens.length === 0) return <span>{text}</span>;

  // Build regex matching any token
  const pattern = new RegExp(
    `(${filteredTokens.map((t) => escapeRegExp(t.token)).join('|')})`,
    'gi'
  );

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const matched = filteredTokens.find(
          (t) => t.token.toLowerCase() === part.toLowerCase()
        );
        if (matched) {
          const isDeceptive = matched.indicates === 'Fake/Deceptive';
          return (
            <mark
              key={i}
              className={`px-1 py-0.5 rounded font-semibold text-white ${
                isDeceptive
                  ? 'bg-rose-600/60 border border-rose-500/80'
                  : 'bg-emerald-600/60 border border-emerald-500/80'
              }`}
            >
              {part}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
