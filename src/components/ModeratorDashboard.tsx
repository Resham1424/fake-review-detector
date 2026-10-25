import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  ListFilter
} from 'lucide-react';
import { SAMPLE_DATASET } from '../data/sampleDataset';

interface ModerationItem {
  id: string;
  text: string;
  rating: number;
  verified: boolean;
  reviewerId: string;
  productId: string;
  trustScore: number;
  status: 'pending' | 'flagged' | 'approved';
}

export const ModeratorDashboard: React.FC<{
  onInspect: (text: string, rating: number, verified: boolean) => void;
}> = ({ onInspect }) => {
  const [reviewsState, setReviewsState] = useState<ModerationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // lowest trust first
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'approved'>('all');

  const fetchBatchReviews = async () => {
    setIsLoading(true);
    setError(null);

    const initialBatch = SAMPLE_DATASET.slice(0, 16).map((rev) => ({
      text: rev.text,
      rating: rev.rating,
      verified_purchase: rev.verified_purchase,
      reviewer_id: rev.reviewer_id,
      product_id: rev.product_id
    }));

    try {
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = baseUrl ? `${baseUrl}/batch-analyze` : '/api/batch-analyze';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialBatch)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const analyzedList = await res.json();
      const items: ModerationItem[] = analyzedList.map((item: any, idx: number) => {
        const original = SAMPLE_DATASET[idx];
        const trust = item.trust_score;
        return {
          id: original.review_id,
          text: original.text,
          rating: original.rating,
          verified: original.verified_purchase,
          reviewerId: original.reviewer_id,
          productId: original.product_id,
          trustScore: trust,
          status: trust < 40 ? 'flagged' : trust >= 70 ? 'approved' : 'pending'
        };
      });

      setReviewsState(items);
    } catch (err: any) {
      console.error('[ModeratorDashboard] Error:', err);
      setError('Unable to fetch triage records from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchReviews();
  }, []);

  const handleAction = (id: string, newStatus: 'approved' | 'flagged' | 'pending') => {
    setReviewsState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const filteredReviews = useMemo(() => {
    return reviewsState
      .filter((r) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !r.text.toLowerCase().includes(q) &&
            !r.id.toLowerCase().includes(q) &&
            !r.reviewerId.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        if (statusFilter === 'flagged' && r.status !== 'flagged') return false;
        if (statusFilter === 'approved' && r.status !== 'approved') return false;
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'asc'
          ? a.trustScore - b.trustScore
          : b.trustScore - a.trustScore;
      });
  }, [reviewsState, search, sortOrder, statusFilter]);

  const flaggedCount = reviewsState.filter((r) => r.status === 'flagged').length;
  const approvedCount = reviewsState.filter((r) => r.status === 'approved').length;
  const avgTrust = reviewsState.length
    ? Math.round(reviewsState.reduce((acc, r) => acc + r.trustScore, 0) / reviewsState.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Triage Overview Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
          <span className="text-xs text-[#8b949e] font-medium block">
            Awaiting verification triage
          </span>
          <div className="text-2xl font-display font-bold text-white tabular-nums">
            {isLoading ? '—' : reviewsState.length}
          </div>
          <span className="text-[11px] text-[#6e7681] block">Active incoming submissions</span>
        </div>

        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
          <span className="text-xs text-red-400 font-medium block">
            Flagged deception risk
          </span>
          <div className="text-2xl font-display font-bold text-red-400 tabular-nums">
            {isLoading ? '—' : flaggedCount}
          </div>
          <span className="text-[11px] text-[#6e7681] block">Confidence below 40 / 100</span>
        </div>

        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-1">
          <span className="text-xs text-emerald-400 font-medium block">
            Verified authentic
          </span>
          <div className="text-2xl font-display font-bold text-emerald-400 tabular-nums">
            {isLoading ? '—' : approvedCount}
          </div>
          <span className="text-[11px] text-[#6e7681] block">Mean portfolio trust: {avgTrust}%</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border-l-2 border-red-500 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchBatchReviews}
            className="text-xs text-white underline underline-offset-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Control Ribbon */}
      <div className="p-3.5 bg-[#161b22] border border-[#262f3d] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#6e7681]" />
          <input
            type="text"
            placeholder="Filter by review text or subject ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0e1117] border border-[#262f3d] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-1.5 rounded-sm bg-[#0e1117] hover:bg-[#21262d] text-[#8b949e] hover:text-white flex items-center gap-1.5 cursor-pointer border border-[#262f3d]"
          >
            <ArrowUpDown className="h-3 w-3 text-amber-500" />
            <span>{sortOrder === 'asc' ? 'Order: Lowest trust first' : 'Order: Highest trust first'}</span>
          </button>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-sm cursor-pointer transition-colors ${
                statusFilter === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('flagged')}
              className={`px-2 py-1 rounded-sm cursor-pointer transition-colors ${
                statusFilter === 'flagged' ? 'bg-red-950/40 text-red-300 font-medium' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Flagged
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2 py-1 rounded-sm cursor-pointer transition-colors ${
                statusFilter === 'approved' ? 'bg-emerald-950/40 text-emerald-300 font-medium' : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Approved
            </button>
          </div>
        </div>
      </div>

      {/* Forensic Docket Table */}
      <div className="bg-[#161b22] border border-[#262f3d] rounded-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#8b949e] flex flex-col items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />
            <span>Fetching triage queue...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#262f3d] text-[#8b949e] font-medium bg-[#12161f]">
                  <th className="py-2.5 px-4 font-normal">Evidence excerpt</th>
                  <th className="py-2.5 px-3 font-normal">Subject</th>
                  <th className="py-2.5 px-3 font-normal">Rating</th>
                  <th className="py-2.5 px-3 font-normal">Score</th>
                  <th className="py-2.5 px-3 font-normal">Audited state</th>
                  <th className="py-2.5 px-4 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262f3d]/70 font-sans">
                {filteredReviews.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-[#1c222b]/50 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <span className="font-mono text-[10px] text-[#6e7681] block mb-0.5">{r.id}</span>
                        <p className="text-[#e6edf3] line-clamp-2 leading-relaxed">"{r.text}"</p>
                      </td>
                      <td className="py-3 px-3 text-[#8b949e]">
                        <span className="font-mono text-xs block text-[#c9d1d9]">{r.reviewerId}</span>
                        <span className="text-[10px] text-[#6e7681]">
                          {r.verified ? 'Verified transaction' : 'Unverified'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-amber-400 whitespace-nowrap">
                        {r.rating}★
                      </td>
                      <td className="py-3 px-3 font-display font-semibold text-base whitespace-nowrap tabular-nums">
                        <span
                          className={
                            r.trustScore >= 65
                              ? 'text-emerald-400'
                              : r.trustScore >= 35
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {r.trustScore}
                        </span>
                        <span className="text-[11px] font-sans text-[#6e7681] font-normal"> / 100</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium ${
                            r.status === 'flagged'
                              ? 'text-red-400'
                              : r.status === 'approved'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {r.status === 'flagged'
                            ? 'Flagged risk'
                            : r.status === 'approved'
                            ? 'Audited authentic'
                            : 'Pending audit'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Inspect in review auditor"
                            onClick={() => onInspect(r.text, r.rating, r.verified)}
                            className="p-1 rounded-sm text-[#8b949e] hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Approve authentic"
                            onClick={() => handleAction(r.id, 'approved')}
                            className="p-1 rounded-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Flag as deceptive"
                            onClick={() => handleAction(r.id, 'flagged')}
                            className="p-1 rounded-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
