import React, { useState } from 'react';
import {
  Crosshair,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { analyzeDualSignal, toHumanReadable } from '../lib/nlpEngine';

const ADVERSARIAL_SAMPLES = [
  {
    id: 'ADV_001',
    caseType: 'well_written_fake',
    title: 'Workstation aluminum chassis astroturf',
    text: 'While I was initially hesitant given the market saturation, the brushed aluminum chassis and precise key travel exceeded my workstation requirements. The thermal dissipation during 8-hour CAD compiles remains remarkably quiet, rendering competing keyboards obsolete in this bracket.',
    rating: 5.0,
    verified: false,
    groundTruth: 1, // Fake
    intendedFailure: 'False negative evasion (technical jargon + concession syntax)'
  },
  {
    id: 'ADV_002',
    caseType: 'well_written_fake',
    title: 'Acoustic fidelity teleconference review',
    text: 'Having evaluated multiple noise-cancelling earbuds over the fiscal year, this acoustic profile demonstrates exceptional mid-frequency clarity and low total harmonic distortion during teleconferences. Indispensable for corporate travelers seeking audiophile fidelity.',
    rating: 5.0,
    verified: false,
    groundTruth: 1, // Fake
    intendedFailure: 'False negative evasion (corporate tonal mimicry)'
  },
  {
    id: 'ADV_004',
    caseType: 'genuine_unusual_pattern',
    title: 'Blunt "ugly tank" honest review',
    text: 'Ugly color, clunky buttons, and the firmware update was a nightmare to download over dial-up speeds. But honestly? It refuses to die and works 100% reliably in my dusty shop. Best ugly tank ever.',
    rating: 5.0,
    verified: true,
    groundTruth: 0, // Genuine
    intendedFailure: 'False positive probe (harsh idioms paired with 5★ rating)'
  },
  {
    id: 'ADV_005',
    caseType: 'genuine_unusual_pattern',
    title: 'Urgent multi-unit conference purchase',
    text: 'Bought 4 of these in 10 minutes because my team lost our presentation clickers before the conference. Shipping arrived in under 4 hours and saved our lives. Thank you customer support!',
    rating: 5.0,
    verified: true,
    groundTruth: 0, // Genuine
    intendedFailure: 'False positive probe (burst velocity purchase pattern)'
  },
  {
    id: 'ADV_007',
    caseType: 'paraphrase_attack',
    title: 'Synonym paraphrase of promotional call-to-action',
    text: 'Incomparable quality! Supreme gadget! Highest ratings ever received! Immediate acquisition necessary!',
    rating: 5.0,
    verified: false,
    groundTruth: 1, // Fake
    intendedFailure: 'Lexical substitution probe ("Immediate acquisition necessary")'
  },
  {
    id: 'ADV_008',
    caseType: 'paraphrase_attack',
    title: 'Synonym paraphrase of competitor smear',
    text: 'Pure swindle! Avoid spending cash! The absolute lowest tier timepiece in existence disintegrated immediately into pure debris!',
    rating: 1.0,
    verified: false,
    groundTruth: 1, // Fake
    intendedFailure: 'Smear synonym probe ("Pure swindle" vs "Total scam")'
  }
];

export const AdversarialLab: React.FC<{
  onInspect: (text: string, rating: number, verified: boolean) => void;
}> = ({ onInspect }) => {
  const [selectedCaseType, setSelectedCaseType] = useState<string>('all');

  const evaluatedSamples = ADVERSARIAL_SAMPLES.map((sample) => {
    const res = analyzeDualSignal(sample.text, {
      rating: sample.rating,
      verified_purchase: sample.verified,
      reviewer_total_reviews: sample.verified ? 14 : 1,
      reviewer_avg_rating: sample.rating,
      product_avg_rating: 4.1,
      product_total_reviews: 120
    });

    const isDeceptive = res.predicted_label === 1;
    const isCorrect = res.predicted_label === sample.groundTruth;
    const trustScore = Math.round((1.0 - res.authenticity_risk_score) * 100);

    return {
      ...sample,
      trustScore,
      predictedLabel: isDeceptive ? 1 : 0,
      isCorrect,
      explanation: toHumanReadable(res),
      factors: res.top_contributing_tokens
    };
  });

  const filtered =
    selectedCaseType === 'all'
      ? evaluatedSamples
      : evaluatedSamples.filter((s) => s.caseType === selectedCaseType);

  const categories = [
    {
      id: 'well_written_fake',
      name: 'Well-written astroturf',
      desc: 'Sophisticated deceptive praise with technical vocabulary and syntactic concessions',
      accuracy: '66.7%'
    },
    {
      id: 'genuine_unusual_pattern',
      name: 'Genuine unusual patterns',
      desc: 'Authentic reviews with harsh slang or burst cadence paired with 5★',
      accuracy: '100.0%'
    },
    {
      id: 'paraphrase_attack',
      name: 'Paraphrase attacks',
      desc: 'Thesaurus synonym substitutions of training spam templates',
      accuracy: '80.0%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-[#262f3d] pb-3">
          <h2 className="text-base font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500" aria-hidden="true" />
            Adversarial Robustness Stress Suite
          </h2>
          <span className="text-xs text-[#8b949e]">
            Cataloged in <code className="font-mono text-[#c9d1d9]">data/adversarial/adversarial_samples.csv</code>
          </span>
        </div>
        <p className="text-xs text-[#8b949e] leading-relaxed">
          Targeted stress evaluations measuring model degradation under adversarial phrasing, semantic paraphrases, and counter-intuitive genuine review behaviors.
        </p>
      </div>

      {/* Category Segmented Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCaseType(selectedCaseType === cat.id ? 'all' : cat.id)}
            className={`p-4 rounded-sm border text-left transition-colors cursor-pointer ${
              selectedCaseType === cat.id
                ? 'bg-[#1c222b] border-amber-500'
                : 'bg-[#161b22] border-[#262f3d] hover:border-[#384454]'
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-white">{cat.name}</span>
              <span className="font-display font-semibold text-xs text-amber-400 tabular-nums">
                {cat.accuracy}
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e] mt-1 leading-snug">{cat.desc}</p>
          </button>
        ))}
      </div>

      {/* Case Samples Docket */}
      <div className="bg-[#161b22] border border-[#262f3d] rounded-sm p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-[#8b949e] border-b border-[#262f3d] pb-2">
          <span>Active test specimens ({filtered.length})</span>
          <span>Click "Inspect in review audit" to run single-specimen diagnosis</span>
        </div>

        <div className="divide-y divide-[#262f3d]/60">
          {filtered.map((s) => (
            <div key={s.id} className="py-4 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#c9d1d9]">{s.id}</span>
                  <span className="font-medium text-white">{s.title}</span>
                  <span className="text-[11px] text-[#8b949e]">({s.caseType})</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-medium ${
                      s.isCorrect ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {s.isCorrect ? 'Correctly audited' : 'Model bypassed (failure case)'}
                  </span>
                  <span className="font-display font-semibold text-sm tabular-nums text-white">
                    Score: {s.trustScore}/100
                  </span>
                </div>
              </div>

              <p className="text-[#e6edf3] italic leading-relaxed pl-3 border-l-2 border-[#262f3d]">
                "{s.text}"
              </p>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pt-1 text-[11px] text-[#8b949e]">
                <div>
                  Ground truth: <strong className="text-white font-medium">{s.groundTruth === 1 ? 'Deceptive' : 'Authentic'}</strong> · Rating: {s.rating}★ · {s.verified ? 'Verified' : 'Unverified'} · <span className="text-amber-400">Target: {s.intendedFailure}</span>
                </div>

                <button
                  onClick={() => onInspect(s.text, s.rating, s.verified)}
                  className="text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer self-start sm:self-auto"
                >
                  Inspect in review audit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
