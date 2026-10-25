import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, ShieldAlert, Download, RefreshCw } from 'lucide-react';
import { analyzeDualSignal } from '../lib/nlpEngine';
import { SAMPLE_DATASET } from '../data/sampleDataset';

const DEFAULT_BATCH_TEXT = `AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!
Arrived in standard cardboard packaging. Feels sturdy in hand. I had an issue with fast charging initially, but customer support helped resolve it.
TOTAL SCAM! DO NOT BUY! Worst smart watch ever made broke in 2 seconds absolute garbage trash!
Purchased during the holiday sale. Setup took about 15 minutes. It handles daily gym workouts smoothly without overheating.
Top notch quality! 100% genuine and perfect! I will buy 10 more for gifts! WOW WOW WOW!
I compared this with a competing brand and preferred this one because the weight distribution is more balanced. Fits comfortably and does its job.`;

export const BatchTriage: React.FC = () => {
  const [rawBatchInput, setRawBatchInput] = useState(DEFAULT_BATCH_TEXT);
  const [results, setResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const runBatchAnalysis = () => {
    setIsProcessing(true);
    const lines = rawBatchInput.split('\n').filter((l) => l.trim().length > 0);

    const batchResults = lines.map((line, idx) => {
      // Default heuristic metadata for bulk triage
      const isSuspect = line.toUpperCase() === line || line.includes('!!!') || line.toLowerCase().includes('scam');
      const analysis = analyzeDualSignal(line, {
        rating: line.toLowerCase().includes('scam') ? 1 : 5,
        verified_purchase: !isSuspect,
        reviewer_total_reviews: isSuspect ? 1 : 10,
        reviewer_avg_rating: isSuspect ? 5.0 : 4.1,
        product_avg_rating: 4.2,
        product_total_reviews: 120
      });

      return {
        id: `BATCH_${idx + 1}`,
        rawText: line,
        analysis
      };
    });

    setResults(batchResults);
    setIsProcessing(false);
  };

  const loadFromDataset = () => {
    const lines = SAMPLE_DATASET.slice(0, 10).map((d) => d.text).join('\n');
    setRawBatchInput(lines);
  };

  const exportCSV = () => {
    if (results.length === 0) return;
    const rows = [
      ['ID', 'Review Text', 'Risk Score', 'Verdict', 'Predicted Label'],
      ...results.map((r) => [
        r.id,
        `"${r.rawText.replace(/"/g, '""')}"`,
        `${Math.round(r.analysis.authenticity_risk_score * 100)}%`,
        r.analysis.verdict,
        r.analysis.predicted_label === 1 ? 'Fake' : 'Genuine'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `veritycheck_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run initial triage on mount if empty
  React.useEffect(() => {
    runBatchAnalysis();
  }, []);

  const fakeCount = results.filter((r) => r.analysis.predicted_label === 1).length;
  const genuineCount = results.filter((r) => r.analysis.predicted_label === 0).length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Batch Review Triage Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bulk-evaluate multiple product reviews simultaneously with instant dual-signal scoring and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFromDataset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer border border-slate-700"
          >
            Load from Test Dataset
          </button>
          <button
            onClick={runBatchAnalysis}
            disabled={isProcessing}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-cyan-950/50"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Process Batch</span>
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300">
            Paste Reviews (One review per line)
          </label>
          <span className="text-slate-500">
            {rawBatchInput.split('\n').filter((l) => l.trim().length > 0).length} reviews in queue
          </span>
        </div>
        <textarea
          rows={5}
          value={rawBatchInput}
          onChange={(e) => setRawBatchInput(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
          placeholder="Enter reviews, one per line..."
        />
      </div>

      {/* Batch Summary Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Evaluated</span>
              <span className="text-xl font-bold font-mono text-white">{results.length}</span>
            </div>
            <Layers className="h-6 w-6 text-slate-600" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 block">Likely Genuine</span>
              <span className="text-xl font-bold font-mono text-emerald-300">
                {genuineCount} ({((genuineCount / results.length) * 100).toFixed(0)}%)
              </span>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-500/40" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 block">Flagged Deceptive / Fake</span>
              <span className="text-xl font-bold font-mono text-rose-300">
                {fakeCount} ({((fakeCount / results.length) * 100).toFixed(0)}%)
              </span>
            </div>
            <ShieldAlert className="h-6 w-6 text-rose-500/40" />
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">Batch Inference Results</h3>
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Review Snippet</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Key Triggers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {results.map((r) => {
                  const risk = Math.round(r.analysis.authenticity_risk_score * 100);
                  const isDeceptive = r.analysis.predicted_label === 1;
                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono font-medium text-slate-400">
                        {r.id}
                      </td>
                      <td className="py-3 px-3 max-w-md text-slate-200 leading-snug">
                        "{r.rawText}"
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={
                            risk >= 65
                              ? 'text-rose-400'
                              : risk >= 35
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {risk}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            isDeceptive
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {r.analysis.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {r.analysis.top_contributing_tokens.slice(0, 2).map((t: any, i: number) => (
                            <span
                              key={i}
                              className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                                t.indicates === 'Fake/Deceptive'
                                  ? 'bg-rose-950/80 text-rose-300'
                                  : 'bg-emerald-950/80 text-emerald-300'
                              }`}
                            >
                              {t.token}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
