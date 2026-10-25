import React, { useState, useMemo } from 'react';
import { Database, Search, ArrowUpDown, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { SAMPLE_DATASET } from '../data/sampleDataset';
import { DatasetReview } from '../types';

interface DatasetExplorerProps {
  onSelectReview: (review: DatasetReview) => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({ onSelectReview }) => {
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<'all' | '0' | '1'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredData = useMemo(() => {
    return SAMPLE_DATASET.filter((row) => {
      if (filterLabel !== 'all' && row.label.toString() !== filterLabel) {
        return false;
      }
      if (verifiedFilter === 'verified' && !row.verified_purchase) {
        return false;
      }
      if (verifiedFilter === 'unverified' && row.verified_purchase) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          row.text.toLowerCase().includes(query) ||
          row.review_id.toLowerCase().includes(query) ||
          row.reviewer_id.toLowerCase().includes(query) ||
          row.product_id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [search, filterLabel, verifiedFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-[#161b22] border border-[#262f3d] rounded-sm flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500" aria-hidden="true" />
            Evaluation Test Corpus
          </h2>
          <p className="text-xs text-[#8b949e] mt-1">
            Stratified evaluation records from <code className="font-mono text-[#c9d1d9]">data/processed/test.csv</code>
          </p>
        </div>

        <div className="text-xs text-[#8b949e]">
          Showing {filteredData.length} records · Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-[#161b22] border border-[#262f3d] rounded-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#6e7681]" />
          <input
            type="text"
            placeholder="Search test corpus..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#0e1117] border border-[#262f3d] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#e6edf3] placeholder-[#6e7681] focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#8b949e]">
            <span>Ground truth:</span>
            <div className="flex gap-1">
              <button
                onClick={() => { setFilterLabel('all'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-sm cursor-pointer ${
                  filterLabel === 'all' ? 'bg-[#21262d] text-white font-medium' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setFilterLabel('0'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-sm cursor-pointer ${
                  filterLabel === '0' ? 'bg-emerald-950/40 text-emerald-300 font-medium' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Genuine (0)
              </button>
              <button
                onClick={() => { setFilterLabel('1'); setCurrentPage(1); }}
                className={`px-2 py-1 rounded-sm cursor-pointer ${
                  filterLabel === '1' ? 'bg-red-950/40 text-red-300 font-medium' : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Deceptive (1)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Corpus Table */}
      <div className="bg-[#161b22] border border-[#262f3d] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#262f3d] text-[#8b949e] bg-[#12161f]">
                <th className="py-2.5 px-4 font-normal">Specimen excerpt</th>
                <th className="py-2.5 px-3 font-normal">Subject</th>
                <th className="py-2.5 px-3 font-normal">Product</th>
                <th className="py-2.5 px-3 font-normal">Rating</th>
                <th className="py-2.5 px-3 font-normal">Ground truth</th>
                <th className="py-2.5 px-4 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262f3d]/60 font-sans">
              {paginatedData.map((row) => (
                <tr key={row.review_id} className="hover:bg-[#1c222b]/50 transition-colors">
                  <td className="py-3 px-4 max-w-md">
                    <span className="font-mono text-[10px] text-[#6e7681] block mb-0.5">{row.review_id}</span>
                    <p className="text-[#e6edf3] line-clamp-2 leading-relaxed">"{row.text}"</p>
                  </td>
                  <td className="py-3 px-3 text-[#8b949e] font-mono text-[11px]">
                    {row.reviewer_id}
                  </td>
                  <td className="py-3 px-3 text-[#8b949e] font-mono text-[11px]">
                    {row.product_id}
                  </td>
                  <td className="py-3 px-3 text-amber-400 font-medium">
                    {row.rating}★
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`text-[11px] font-medium ${row.label === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.label === 0 ? 'Genuine (0)' : 'Deceptive (1)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectReview(row)}
                      className="text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer text-xs"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-[#262f3d] bg-[#12161f] flex items-center justify-between text-xs text-[#8b949e]">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-sm border border-[#262f3d] text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-[#21262d]"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-sm border border-[#262f3d] text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-[#21262d]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
