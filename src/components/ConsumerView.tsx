import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Send,
  FileCheck2,
  FileX2,
  CheckCircle2,
  XCircle,
  FileSearch,
  Scale
} from 'lucide-react';

interface FactorItem {
  feature: string;
  impact: number;
  direction: 'increases_suspicion' | 'decreases_suspicion';
}

interface AnalysisResult {
  trustScore: number;
  label: 'genuine' | 'deceptive';
  humanExplanation: string;
  factors: FactorItem[];
}

const SAMPLE_PRESETS = [
  {
    title: 'Promotional bot template',
    text: 'AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!',
    rating: 5,
    verified: false,
    reviewerId: 'USR_BOT_0034'
  },
  {
    title: 'Verified authentic purchase',
    text: 'Arrived in standard cardboard packaging. Feels sturdy in hand. I had an issue with fast charging initially, but customer support helped resolve it.',
    rating: 4,
    verified: true,
    reviewerId: 'USR_GEN_0139'
  },
  {
    title: 'Competitor smear campaign',
    text: 'TOTAL SCAM! DO NOT BUY! Worst smart watch ever made broke in 2 seconds absolute garbage trash!',
    rating: 1,
    verified: false,
    reviewerId: 'USR_BOT_0005'
  },
  {
    title: 'Cold-start unknown reviewer',
    text: 'AMAZING PRODUCT BEST EVER FIVE STARS MUST BUY NOW!!!',
    rating: 5,
    verified: false,
    reviewerId: 'USR_UNKNOWN_COLDSTART'
  }
];

const SUPERLATIVES = [
  'best', 'greatest', 'amazing', 'magic', 'perfect', 'must buy', 'life',
  'super', 'flawless', 'incredible', 'unbelievable', 'worst', 'scam',
  'crook', 'trash', 'garbage', '10/10', 'five stars', 'zero stars'
];

export const ConsumerView: React.FC = () => {
  const [text, setText] = useState(SAMPLE_PRESETS[0].text);
  const [rating, setRating] = useState(SAMPLE_PRESETS[0].rating);
  const [verified, setVerified] = useState(SAMPLE_PRESETS[0].verified);
  const [reviewerId, setReviewerId] = useState(SAMPLE_PRESETS[0].reviewerId);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [displayedScore, setDisplayedScore] = useState<number>(0);
  const [barsAnimated, setBarsAnimated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced live inline indicators (400ms)
  const [liveIndicators, setLiveIndicators] = useState({
    wordCount: 0,
    charCount: 0,
    exclamationCount: 0,
    superlativeCount: 0,
    uppercaseRatio: 0
  });

  const lastSubmitRef = useRef<number>(0);
  const debounceTimerRef = useRef<any>(null);

  // 1. Live reactive inline feedback (debounced 400ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const words = text.trim() ? text.trim().split(/\s+/) : [];
      const wordCount = words.length;
      const charCount = text.length;
      const exclamationCount = (text.match(/!/g) || []).length;
      const upperCount = (text.match(/[A-Z]/g) || []).length;
      const uppercaseRatio = charCount > 0 ? Math.round((upperCount / charCount) * 100) : 0;

      const lowerText = text.toLowerCase();
      let superlativeCount = 0;
      for (const sup of SUPERLATIVES) {
        const regex = new RegExp(`\\b${sup}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) superlativeCount += matches.length;
      }

      setLiveIndicators({
        wordCount,
        charCount,
        exclamationCount,
        superlativeCount,
        uppercaseRatio
      });
    }, 400);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [text]);

  // 2. Smooth Score Counting Animation (over 400ms)
  useEffect(() => {
    if (!result) return;
    const targetScore = result.trustScore;
    const startScore = displayedScore;
    const startTime = performance.now();
    const duration = 400;

    setBarsAnimated(false);
    let animationFrameId: number;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startScore + (targetScore - startScore) * easeProgress);

      setDisplayedScore(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayedScore(targetScore);
        setTimeout(() => setBarsAnimated(true), 60);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [result?.trustScore]);

  // 3. Real Backend API Call (/api/analyze)
  const executeAnalysis = async (
    inputText: string,
    inputRating: number,
    inputVerified: boolean,
    inputReviewerId: string
  ) => {
    const now = Date.now();
    if (now - lastSubmitRef.current < 500 && isLoading) return;
    lastSubmitRef.current = now;

    if (!inputText.trim()) {
      setError('Please provide review text to analyze.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = baseUrl ? `${baseUrl}/analyze` : '/api/analyze';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          rating: inputRating,
          verified_purchase: inputVerified,
          reviewer_id: inputReviewerId,
          product_id: 'PROD_001'
        })
      });

      if (!response.ok) {
        if (response.status === 422) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Validation error: invalid review input parameters.');
        }
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setResult({
        trustScore: data.trust_score,
        label: data.label,
        humanExplanation: data.human_readable_explanation,
        factors: data.top_factors || []
      });
    } catch (err: any) {
      console.error('[VerityCheck] Analysis call error:', err);
      setError(err.message || 'Network failure: could not reach backend /analyze endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeAnalysis(text, rating, verified, reviewerId);
  }, []);

  const handlePresetSelect = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setText(preset.text);
    setRating(preset.rating);
    setVerified(preset.verified);
    setReviewerId(preset.reviewerId);
    executeAnalysis(preset.text, preset.rating, preset.verified, preset.reviewerId);
  };

  const isGenuine = result?.label === 'genuine';

  return (
    <div className="space-y-6">
      {/* Evidence Presets Ribbon (No Pill Boxes, Clean Unboxed Text Links) */}
      <div className="border-b border-[#262f3d] pb-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#8b949e]">
          <FileSearch className="h-3.5 w-3.5 text-amber-500" />
          <span>Curated audit cases:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(p)}
              disabled={isLoading}
              className="text-[#8b949e] hover:text-[#e6edf3] transition-colors underline-offset-4 hover:underline cursor-pointer disabled:opacity-40"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Asymmetric Workspace Grid: Input Docket (Left) vs Forensic Certificate Docket (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Field & Linguistic Inspector */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#161b22] border border-[#262f3d] rounded-sm p-6 space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#262f3d] pb-3">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Review text under examination
              </h2>
              <span className="text-xs text-[#8b949e]">
                Dual-signal ingestion
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-950/30 border-l-2 border-red-500 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Textarea */}
            <div className="space-y-3">
              <textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste verbatim customer review text here for forensic authenticity audit..."
                className="w-full bg-[#0e1117] border border-[#262f3d] rounded-sm p-3.5 text-sm text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-amber-500 transition-colors leading-relaxed font-normal"
              />

              {/* Reactive Live Inline Telemetry Bar (Debounced 400ms) */}
              <div className="py-2 px-3 bg-[#0e1117] border border-[#262f3d] rounded-sm flex flex-wrap items-center justify-between gap-y-2 text-xs text-[#8b949e]">
                <div className="flex items-center gap-3">
                  <span>
                    <strong className="text-[#e6edf3] font-medium">{liveIndicators.wordCount}</strong> words
                  </span>
                  <span className="text-[#30363d]">/</span>
                  <span>
                    <strong className="text-[#e6edf3] font-medium">{liveIndicators.charCount}</strong> characters
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                  <span className={liveIndicators.exclamationCount >= 3 ? 'text-red-400 font-medium' : ''}>
                    Punctuation: {liveIndicators.exclamationCount} {liveIndicators.exclamationCount >= 3 ? '(burst anomaly)' : 'marks'}
                  </span>
                  <span className="text-[#30363d]">·</span>
                  <span className={liveIndicators.superlativeCount >= 2 ? 'text-amber-400 font-medium' : ''}>
                    Superlatives: {liveIndicators.superlativeCount}
                  </span>
                  <span className="text-[#30363d]">·</span>
                  <span className={liveIndicators.uppercaseRatio > 25 ? 'text-red-400 font-medium' : ''}>
                    Caps: {liveIndicators.uppercaseRatio}%
                  </span>
                </div>
              </div>
            </div>

            {/* Parameter Matrix: Rating & Transaction Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#262f3d]">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs text-[#8b949e] block font-medium">
                  Reported customer rating ({rating} stars)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`py-1.5 text-xs font-medium rounded-sm border transition-colors cursor-pointer ${
                        rating === s
                          ? 'bg-[#21262d] text-white border-amber-500'
                          : 'bg-[#0e1117] text-[#8b949e] border-[#262f3d] hover:text-white hover:border-[#384454]'
                      }`}
                    >
                      {s}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Verification */}
              <div className="space-y-2">
                <label className="text-xs text-[#8b949e] block font-medium">
                  Merchant transaction record
                </label>
                <button
                  type="button"
                  onClick={() => setVerified(!verified)}
                  className={`w-full py-1.5 px-3 text-xs font-medium rounded-sm border flex items-center justify-between transition-colors cursor-pointer ${
                    verified
                      ? 'bg-emerald-950/20 border-emerald-700/60 text-emerald-300'
                      : 'bg-red-950/20 border-red-800/60 text-red-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {verified ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                    {verified ? 'Verified buyer transaction' : 'Unverified / organic review'}
                  </span>
                  <span className="text-[10px] text-[#8b949e]">Click to alter</span>
                </button>
              </div>
            </div>

            {/* Flat Confident Action Button (No Gradient) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => executeAnalysis(text, rating, verified, reviewerId)}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-sm bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs tracking-wide transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-200" />
                    <span>Running multi-signal model inference...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Execute forensic authenticity audit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Audited Certification Docket (Distinct Structural Treatment) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#161b22] border-2 border-[#2c3646] rounded-sm p-6 space-y-6 relative shadow-md">
            {/* Top Docket Header */}
            <div className="border-b border-[#262f3d] pb-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 block">
                  Official Audit Certificate
                </span>
                <span className="text-xs text-[#8b949e] block mt-0.5">
                  VerityCheck Stacking Meta-Classifier
                </span>
              </div>
              <span className="text-xs font-mono text-[#6e7681]">
                /analyze
              </span>
            </div>

            {/* Skeleton Shimmer vs Real Certificate */}
            {isLoading ? (
              <div className="space-y-6 animate-pulse py-2">
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-[#21262d] rounded-sm"></div>
                  <div className="h-16 w-36 bg-[#21262d] rounded-sm"></div>
                </div>
                <div className="h-12 bg-[#21262d] rounded-sm"></div>
                <div className="space-y-3">
                  <div className="h-3 w-44 bg-[#21262d] rounded-sm"></div>
                  <div className="h-14 bg-[#21262d] rounded-sm"></div>
                  <div className="h-14 bg-[#21262d] rounded-sm"></div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Prominent Trust Score Numeral (Newsreader Serif Display) */}
                <div className="flex items-baseline justify-between border-b border-[#262f3d] pb-5">
                  <div>
                    <span className="text-xs text-[#8b949e] uppercase tracking-wide block">
                      Authenticity confidence rating
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span
                        className={`text-6xl font-display font-bold tabular-nums tracking-tight ${
                          displayedScore >= 65
                            ? 'text-emerald-400'
                            : displayedScore >= 35
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {displayedScore}
                      </span>
                      <span className="text-base font-display text-[#6e7681]">/ 100</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#8b949e] block">Audited verdict</span>
                    <span
                      className={`text-sm font-semibold block mt-1 ${
                        isGenuine ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {isGenuine ? 'Authentic purchaser' : 'Deceptive review pattern'}
                    </span>
                  </div>
                </div>

                {/* Plain-English Human Summary (Editorial Quote Treatment) */}
                <div className="border-l-2 border-amber-500 pl-4 py-1 space-y-1 bg-[#12161f]/60 pr-2">
                  <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wide block">
                    Synthesized findings
                  </span>
                  <p className="text-xs text-[#e6edf3] leading-relaxed font-normal">
                    "{result.humanExplanation}"
                  </p>
                </div>

                {/* Evidentiary Factor Ledger (Replacing generic red horizontal bars) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-[#262f3d] pb-2 text-xs">
                    <span className="font-semibold text-white">
                      SHAP Evidentiary Ledger
                    </span>
                    <span className="text-[#8b949e] text-[11px]">
                      Top contributing signals
                    </span>
                  </div>

                  <div className="divide-y divide-[#262f3d]/60">
                    {result.factors.map((factor, i) => {
                      const impact = Math.abs(factor.impact);
                      const isSuspicion = factor.direction === 'increases_suspicion';
                      const pips = Math.min(5, Math.max(1, Math.round(impact * 8)));

                      return (
                        <div key={i} className="py-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#e6edf3] font-medium">
                              {factor.feature}
                            </span>
                            <span
                              className={`tabular-nums font-medium text-[11px] ${
                                isSuspicion ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {isSuspicion ? `+${impact.toFixed(2)} suspicion` : `-${impact.toFixed(2)} risk`}
                            </span>
                          </div>

                          {/* Calibrated forensic tick meter */}
                          <div className="flex items-center justify-between text-[11px] text-[#6e7681]">
                            <span className="text-[10px]">
                              {isSuspicion ? 'Adversarial risk cue' : 'Corroborating signal'}
                            </span>
                            <div
                              className="flex items-center gap-1 transition-opacity duration-500"
                              style={{ opacity: barsAnimated ? 1 : 0 }}
                            >
                              {[1, 2, 3, 4, 5].map((p) => (
                                <span
                                  key={p}
                                  className={`w-2.5 h-1.5 rounded-none inline-block ${
                                    p <= pips
                                      ? isSuspicion
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500'
                                      : 'bg-[#262f3d]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
