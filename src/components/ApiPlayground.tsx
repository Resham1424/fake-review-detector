import React, { useState } from 'react';
import { Terminal, Copy, Check, Server, Cloud, FileCode2 } from 'lucide-react';

export const ApiPlayground: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const curlSingle = `curl -X POST http://localhost:3000/analyze \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "AMAZING PRODUCT!!! BEST USB-C hub EVER! Five stars A+++++ MUST BUY NOW!!!",
    "rating": 5.0,
    "verified_purchase": false,
    "reviewer_id": "USR_BOT_0034",
    "product_id": "PROD_004"
  }'`;

  const curlBatch = `curl -X POST http://localhost:3000/batch-analyze \\
  -H "Content-Type: application/json" \\
  -d '[
    {
      "text": "AMAZING PRODUCT! MUST BUY NOW!",
      "rating": 5.0,
      "verified_purchase": false
    },
    {
      "text": "Arrived in cardboard packaging. Works fine.",
      "rating": 4.0,
      "verified_purchase": true
    }
  ]'`;

  const curlReviewer = `curl -X GET http://localhost:3000/reviewer/USR_BOT_0021`;

  const dockerComposeCmd = `# Orchestrate backend and frontend containers
docker compose up --build

# Run in detached daemon mode
docker compose up -d`;

  const pythonExplainCli = `# Direct inference diagnosis
python src/explain.py --text "AMAZING PRODUCT! BEST PURCHASE OF MY LIFE 5 STARS MUST BUY NOW!"

# Automated test suite
pytest -v tests/`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 bg-[#161b22] border border-[#262f3d] rounded-sm flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500" aria-hidden="true" />
            API & Deployment Specification
          </h2>
          <p className="text-xs text-[#8b949e] mt-1">
            HTTP microservice specifications (<code className="font-mono text-[#c9d1d9]">server.ts</code> & <code className="font-mono text-[#c9d1d9]">api/main.py</code>) and multi-stage containerization.
          </p>
        </div>

        <span className="text-xs text-[#8b949e]">
          OpenAPI 3.1 compatible
        </span>
      </div>

      {/* Grid: Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Single Review */}
        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-amber-500" />
              <span>POST /analyze (single review audit)</span>
            </span>
            <button
              onClick={() => copyToClipboard(curlSingle, 'single')}
              className="text-[#8b949e] hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
            >
              {copiedId === 'single' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-[#0e1117] rounded-sm border border-[#262f3d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            {curlSingle}
          </pre>
        </div>

        {/* Batch Analyze */}
        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-amber-500" />
              <span>POST /batch-analyze (bulk audit triage)</span>
            </span>
            <button
              onClick={() => copyToClipboard(curlBatch, 'batch')}
              className="text-[#8b949e] hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
            >
              {copiedId === 'batch' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-[#0e1117] rounded-sm border border-[#262f3d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            {curlBatch}
          </pre>
        </div>

        {/* Reviewer Telemetry */}
        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-emerald-400" />
              <span>GET /reviewer/{'{id}'} (subject profile history)</span>
            </span>
            <button
              onClick={() => copyToClipboard(curlReviewer, 'rev')}
              className="text-[#8b949e] hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
            >
              {copiedId === 'rev' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-[#0e1117] rounded-sm border border-[#262f3d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            {curlReviewer}
          </pre>
        </div>

        {/* Docker Compose */}
        <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5 text-cyan-400" />
              <span>Docker Compose deployment</span>
            </span>
            <button
              onClick={() => copyToClipboard(dockerComposeCmd, 'compose')}
              className="text-[#8b949e] hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
            >
              {copiedId === 'compose' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-[#0e1117] rounded-sm border border-[#262f3d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
            {dockerComposeCmd}
          </pre>
        </div>
      </div>

      {/* CLI & Pytest */}
      <div className="p-4 bg-[#161b22] border border-[#262f3d] rounded-sm space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-white flex items-center gap-2">
            <FileCode2 className="h-3.5 w-3.5 text-amber-500" />
            <span>Python CLI & test invocation</span>
          </span>
          <button
            onClick={() => copyToClipboard(pythonExplainCli, 'pycli')}
            className="text-[#8b949e] hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
          >
            {copiedId === 'pycli' ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-3 bg-[#0e1117] rounded-sm border border-[#262f3d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed">
          {pythonExplainCli}
        </pre>
      </div>
    </div>
  );
};
