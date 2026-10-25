import React, { useState } from 'react';
import { Header } from './components/Header';
import { ConsumerView } from './components/ConsumerView';
import { ModeratorDashboard } from './components/ModeratorDashboard';
import { ReviewerProfileView } from './components/ReviewerProfileView';
import { AdversarialLab } from './components/AdversarialLab';
import { BenchmarkDashboard } from './components/BenchmarkDashboard';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ApiPlayground } from './components/ApiPlayground';
import { DatasetReview } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('consumer');
  const [inspectReview, setInspectReview] = useState<{
    text: string;
    rating: number;
    verified: boolean;
  }>({
    text: 'AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!',
    rating: 5,
    verified: false
  });

  const handleInspectReview = (text: string, rating: number, verified: boolean) => {
    setInspectReview({ text, rating, verified });
    setActiveTab('consumer');
  };

  const handleSelectFromDataset = (review: DatasetReview) => {
    setInspectReview({
      text: review.text,
      rating: Math.round(review.rating),
      verified: review.verified_purchase
    });
    setActiveTab('consumer');
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-[#e6edf3] flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'consumer' && <ConsumerView key={inspectReview.text} />}

        {activeTab === 'moderator' && (
          <ModeratorDashboard onInspect={handleInspectReview} />
        )}

        {activeTab === 'reviewer' && <ReviewerProfileView />}

        {activeTab === 'adversarial' && (
          <AdversarialLab onInspect={handleInspectReview} />
        )}

        {activeTab === 'benchmarks' && <BenchmarkDashboard />}

        {activeTab === 'dataset' && (
          <DatasetExplorer onSelectReview={handleSelectFromDataset} />
        )}

        {activeTab === 'api' && <ApiPlayground />}
      </main>

      {/* Forensic Document Footer */}
      <footer className="border-t border-[#262f3d] bg-[#12161f] py-4 text-xs text-[#8b949e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-white">VerityCheck</span>
            <span>·</span>
            <span>Forensic Review Authenticity Auditor & Evidentiary Attribution</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#6e7681]">
            <span>5-fold cross-validated stacking meta-classifier</span>
            <span>·</span>
            <span>Dual-signal forensic analysis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
