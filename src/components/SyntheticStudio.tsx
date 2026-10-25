import React, { useState } from 'react';
import { Sparkles, Play, RefreshCw, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { generateSyntheticReview, SyntheticReviewResult } from '../lib/syntheticGenerator';
import { analyzeDualSignal } from '../lib/nlpEngine';

interface SyntheticStudioProps {
  onSendToAnalyzer: (review: { text: string; rating: number; verified: boolean }) => void;
}

export const SyntheticStudio: React.FC<SyntheticStudioProps> = ({ onSendToAnalyzer }) => {
  const [product, setProduct] = useState('wireless earbuds');
  const [reviewType, setReviewType] = useState<'genuine' | 'fake_positive' | 'fake_negative'>('fake_positive');
  const [verified, setVerified] = useState(false);
  const [generatedReview, setGeneratedReview] = useState<SyntheticReviewResult | null>(null);

  const handleGenerate = () => {
    const res = generateSyntheticReview({
      product,
      type: reviewType,
      verifiedPurchase: verified
    });
    setGeneratedReview(res);
  };

  React.useEffect(() => {
    handleGenerate();
  }, [product, reviewType, verified]);

  const quickAnalysis = generatedReview
    ? analyzeDualSignal(generatedReview.text, {
        rating: generatedReview.rating,
        verified_purchase: generatedReview.verified_purchase,
        reviewer_total_reviews: reviewType === 'genuine' ? 14 : 1,
        reviewer_avg_rating: reviewType === 'genuine' ? 4.1 : (reviewType === 'fake_positive' ? 5.0 : 1.0),
        product_avg_rating: 4.2,
        product_total_reviews: 150
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Synthetic Review & Campaign Simulator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the realistic synthetic data generator from <code className="text-cyan-300">src/preprocess.py</code> used for benchmark validation and adversarial stress-testing.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-cyan-950/50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Regenerate Sample</span>
        </button>
      </div>

      {/* Simulator Controls & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Generator Configuration
          </h3>

          {/* Product Category */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400">Target Product</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="wireless earbuds">Wireless Earbuds</option>
              <option value="smart watch">Smart Watch</option>
              <option value="ergonomic keyboard">Ergonomic Keyboard</option>
              <option value="gaming mouse">Gaming Mouse</option>
              <option value="bluetooth speaker">Bluetooth Speaker</option>
              <option value="USB-C hub">USB-C Hub</option>
              <option value="power bank">Power Bank</option>
            </select>
          </div>

          {/* Campaign Strategy / Type */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-400">Review Persona / Intent</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setReviewType('fake_positive');
                  setVerified(false);
                }}
                className={`w-full p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  reviewType === 'fake_positive'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs">Incentivized / Bot 5★ Spam</div>
                <div className="text-[10px] opacity-80">Hyperbolic superlatives, repetitive enthusiasm, fake verified status</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReviewType('fake_negative');
                  setVerified(false);
                }}
                className={`w-full p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  reviewType === 'fake_negative'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs">Competitor Smear 1★ Attack</div>
                <div className="text-[10px] opacity-80">Severe defamatory terms ("scam", "crook", "garbage trash")</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReviewType('genuine');
                  setVerified(true);
                }}
                className={`w-full p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  reviewType === 'genuine'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold text-xs">Authentic Balanced Experience (0)</div>
                <div className="text-[10px] opacity-80">Nuanced pros & cons, specific hardware metrics, realistic packaging notes</div>
              </button>
            </div>
          </div>

          {/* Verified purchase status */}
          <div className="space-y-1.5 text-xs pt-1">
            <label className="text-slate-400">Order Verification Badge</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVerified(true)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition cursor-pointer ${
                  verified
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Verified Purchase
              </button>
              <button
                type="button"
                onClick={() => setVerified(false)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition cursor-pointer ${
                  !verified
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Unverified Organic
              </button>
            </div>
          </div>
        </div>

        {/* Output & Instant Analysis */}
        <div className="lg:col-span-7 space-y-4">
          {generatedReview && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Generated Synthetic Review Artifact
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {generatedReview.reviewer_id} → {generatedReview.product_id}
                </span>
              </div>

              {/* Review card */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-400 font-semibold">
                    {'★'.repeat(Math.round(generatedReview.rating))}
                    <span className="text-slate-700">
                      {'★'.repeat(5 - Math.round(generatedReview.rating))}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      generatedReview.verified_purchase
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {generatedReview.verified_purchase ? 'Verified Purchase' : 'Unverified'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Template: {generatedReview.template_type}
                  </span>
                </div>

                <p className="text-sm text-slate-100 font-medium leading-relaxed">
                  "{generatedReview.text}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">
                    Synthetic Ground Truth: <strong className="text-white">{generatedReview.label === 1 ? '1 (Fake)' : '0 (Genuine)'}</strong>
                  </span>
                  <button
                    onClick={() =>
                      onSendToAnalyzer({
                        text: generatedReview.text,
                        rating: generatedReview.rating,
                        verified: generatedReview.verified_purchase
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send to Full Analyzer</span>
                  </button>
                </div>
              </div>

              {/* Instant Verification Telemetry */}
              {quickAnalysis && (
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Instant Model Verdict:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded ${
                        quickAnalysis.predicted_label === 1
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {quickAnalysis.verdict} ({Math.round(quickAnalysis.authenticity_risk_score * 100)}% risk)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Text Signal Score</span>
                      <span className="text-base font-bold font-mono text-cyan-400">
                        {Math.round(quickAnalysis.text_risk_score * 100)}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Behavioral Risk Score</span>
                      <span className="text-base font-bold font-mono text-indigo-400">
                        {Math.round(quickAnalysis.behavioral_risk_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
