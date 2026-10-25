import React, { useState, useEffect } from 'react';
import {
  User,
  AlertTriangle,
  RefreshCw,
  Search,
  UserX,
  FileText
} from 'lucide-react';

interface ReviewerProfileData {
  reviewer_id: string;
  is_known_reviewer: boolean;
  is_new_reviewer: boolean;
  total_reviews: number;
  average_rating: number;
  verified_purchase_ratio: number;
  rating_std: number;
  anomaly_flags: string[];
  reviews?: Array<{
    review_id: string;
    text: string;
    rating: number;
    verified_purchase: boolean;
    timestamp: string;
  }>;
}

const SAMPLE_REVIEWERS = [
  { id: 'USR_BOT_0021', label: 'Suspicious bot farm subject' },
  { id: 'USR_BOT_0005', label: 'Competitor smear subject' },
  { id: 'USR_GEN_0139', label: 'Verified authentic purchaser' },
  { id: 'USR_GEN_0284', label: 'Established multi-order buyer' },
  { id: 'USR_UNKNOWN_COLDSTART', label: 'Cold-start unknown subject' }
];

export const ReviewerProfileView: React.FC = () => {
  const [selectedReviewerId, setSelectedReviewerId] = useState('USR_BOT_0021');
  const [customInput, setCustomInput] = useState('');
  const [profile, setProfile] = useState<ReviewerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviewerProfile = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = baseUrl
        ? `${baseUrl}/reviewer/${encodeURIComponent(id)}`
        : `/api/reviewer/${encodeURIComponent(id)}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        if (res.status === 422) {
          throw new Error('Validation error: invalid subject identifier format.');
        }
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: ReviewerProfileData = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error('[ReviewerProfileView] Error:', err);
      setError(err.message || 'Network failure: could not retrieve subject history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewerProfile(selectedReviewerId);
  }, [selectedReviewerId]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      setSelectedReviewerId(customInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Dossier Header */}
      <div className="p-5 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-[#262f3d] pb-4">
          <div>
            <h2 className="text-base font-display font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500" aria-hidden="true" />
              Subject Dossier & Historical Telemetry
            </h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Behavioral cadence and transaction credibility records via <code className="text-[#c9d1d9] font-mono">/reviewer/{'{id}'}</code>
            </p>
          </div>

          <form onSubmit={handleCustomSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search subject ID..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="bg-[#0e1117] border border-[#262f3d] rounded-sm px-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-amber-500 w-44 sm:w-56 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 rounded-sm bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 border border-[#30363d]"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Sample Profile Links (Unboxed Text Tabs) */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-[#8b949e]">Exemplar subjects:</span>
          {SAMPLE_REVIEWERS.map((rev) => (
            <button
              key={rev.id}
              onClick={() => {
                setSelectedReviewerId(rev.id);
                setCustomInput('');
              }}
              disabled={isLoading}
              className={`transition-colors cursor-pointer ${
                selectedReviewerId === rev.id
                  ? 'text-amber-400 font-medium underline underline-offset-4'
                  : 'text-[#8b949e] hover:text-[#e6edf3]'
              }`}
            >
              {rev.id} <span className="text-[#6e7681]">({rev.label})</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border-l-2 border-red-500 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReviewerProfile(selectedReviewerId)}
            className="text-white underline underline-offset-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-xs text-[#8b949e] flex flex-col items-center gap-2">
          <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
          <span>Compiling subject telemetry records...</span>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Honest Cold-Start Notice */}
          {profile.is_new_reviewer && (
            <div className="p-4 bg-amber-950/20 border-l-2 border-amber-500 text-xs text-amber-200/90 space-y-1">
              <span className="font-semibold block text-amber-300">
                Cold-start account: No historical transactions on record
              </span>
              <p className="text-[#8b949e] leading-relaxed">
                This subject profile does not exist in platform training records. In accordance with Prompt A confidence weighting, the ensemble discounts the neutral behavioral score and weights text-level linguistic evidence at 85%.
              </p>
            </div>
          )}

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
              <span className="text-xs text-[#8b949e] font-medium block">
                Total review volume
              </span>
              <div className="text-2xl font-display font-bold text-white tabular-nums">
                {profile.total_reviews}
              </div>
              <span className="text-[11px] text-[#6e7681] block">Historical submission count</span>
            </div>

            <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
              <span className="text-xs text-[#8b949e] font-medium block">
                Verified order ratio
              </span>
              <div className="text-2xl font-display font-bold text-cyan-400 tabular-nums">
                {profile.is_new_reviewer
                  ? 'No data'
                  : `${Math.round(profile.verified_purchase_ratio * 100)}%`}
              </div>
              <span className="text-[11px] text-[#6e7681] block">Confirmed merchant checkout</span>
            </div>

            <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
              <span className="text-xs text-[#8b949e] font-medium block">
                Historical mean rating
              </span>
              <div className="text-2xl font-display font-bold text-amber-400 tabular-nums">
                {profile.is_new_reviewer ? 'No data' : `${profile.average_rating}★`}
              </div>
              <span className="text-[11px] text-[#6e7681] block">Polarity distribution</span>
            </div>

            <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
              <span className="text-xs text-[#8b949e] font-medium block">
                Subject audit tier
              </span>
              <div
                className={`text-lg font-semibold ${
                  profile.is_new_reviewer
                    ? 'text-amber-400'
                    : profile.verified_purchase_ratio >= 0.5
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {profile.is_new_reviewer
                  ? 'Unrecorded'
                  : profile.verified_purchase_ratio >= 0.5
                  ? 'Established'
                  : 'Elevated Risk'}
              </div>
              <span className="text-[11px] text-[#6e7681] block">Behavioral classification</span>
            </div>
          </div>

          {/* Telemetry Flags */}
          {profile.anomaly_flags.length > 0 && (
            <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Behavioral anomaly indicators ({profile.anomaly_flags.length})</span>
              </span>
              <ul className="space-y-1 text-xs text-[#c9d1d9]">
                {profile.anomaly_flags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">›</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historical Reviews Docket */}
          {profile.reviews && profile.reviews.length > 0 ? (
            <div className="bg-[#161b22] border border-[#262f3d] rounded-sm p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white">
                Archived reviews authored by {profile.reviewer_id} ({profile.reviews.length})
              </h3>
              <div className="divide-y divide-[#262f3d]/60">
                {profile.reviews.map((rev) => (
                  <div key={rev.review_id} className="py-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[#8b949e]">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-[#c9d1d9]">{rev.review_id}</span>
                        <span className="text-amber-400 font-medium">{rev.rating}★</span>
                        <span className="text-[11px]">
                          {rev.verified_purchase ? 'Verified purchase' : 'Unverified'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#6e7681]">{rev.timestamp}</span>
                    </div>
                    <p className="text-[#e6edf3] leading-relaxed">"{rev.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[#161b22] border border-[#262f3d] rounded-sm text-center text-xs text-[#8b949e]">
              No past review records cataloged for subject {profile.reviewer_id}.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
