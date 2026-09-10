import fs from "fs";
import { consoleLog } from "../core/logger.js";
import { registerAgent } from "../core/skillRegistry.js";

export class ReporterAgent {
  async execute(context: any) {
    if (!fs.existsSync("./reports")) fs.mkdirSync("./reports");

    const jsonPath = "./reports/report.json";
    const htmlPath = "./reports/summary.html";

    const resultsArray = Object.values(context.results || {});
    const passed = resultsArray.filter((r: any) => r.status === "passed").length;
    const failed = resultsArray.filter((r: any) => r.status === "failed").length;
    const blocked = resultsArray.filter((r: any) => r.status === "blocked").length;

    fs.writeFileSync(jsonPath, JSON.stringify(context, null, 2));

    // Build Execution Rows
    let executionHtml = "";
    const sortedEntries = Object.entries(context.results || {}).sort(([a], [b]) => a.localeCompare(b));
    for (const [tcId, result] of sortedEntries) {
      const res: any = result;
      const payload: any = res.ui || res.api || res;
      const statusColor = res.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50';
      
      let stepsHtml = payload.steps ? payload.steps.map((s: any) => `
        <tr class="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
          <td class="p-3 text-slate-400 font-mono text-xs">${s.id}</td>
          <td class="p-3 text-slate-200">${s.description}</td>
          <td class="p-3 font-bold ${s.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}">${s.status.toUpperCase()}</td>
          <td class="p-3 text-slate-400">${s.durationMs}ms</td>
          <td class="p-3 text-red-400 text-xs font-mono">${s.error || ''}</td>
        </tr>
      `).join('') : '';

      let screenshotsHtml = '';
      if (payload.screenshots && payload.screenshots.length > 0) {
        screenshotsHtml = `
          <div class="mt-6">
            <h4 class="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Browser Snapshot</h4>
            ${payload.screenshots.map((b64: string) => `<img src="${b64}" class="w-full max-w-3xl rounded-lg shadow-2xl border border-slate-700" />`).join('')}
          </div>
        `;
      }

      executionHtml += `
      <div class="mb-4 bg-slate-800/50 rounded-xl shadow border border-slate-700/50 overflow-hidden backdrop-blur-sm">
        <div class="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-700/30 transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <div class="flex items-center gap-4">
            <span class="px-3 py-1 rounded-md text-xs font-bold border ${statusColor}">${res.status.toUpperCase()}</span>
            <h3 class="font-bold text-lg text-slate-100 tracking-wide">${tcId}</h3>
          </div>
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <div class="hidden p-0 border-t border-slate-700/50">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-800/80 text-slate-300 uppercase text-xs tracking-wider">
                <tr>
                  <th class="p-3 font-medium">Step ID</th>
                  <th class="p-3 font-medium">Description</th>
                  <th class="p-3 font-medium">Status</th>
                  <th class="p-3 font-medium">Duration</th>
                  <th class="p-3 font-medium">Error Trace</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                ${stepsHtml}
              </tbody>
            </table>
          </div>
          <div class="p-5 bg-slate-900/50">
            ${screenshotsHtml}
          </div>
        </div>
      </div>
      `;
    }

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Antigravity SDLC Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #0f172a; }
          ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #475569; }
        </style>
      </head>
      <body class="bg-slate-950 text-slate-200 min-h-screen selection:bg-blue-500/30">
        <div class="max-w-7xl mx-auto p-8">
          
          <header class="mb-12 flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
              <h1 class="text-5xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                SDLC Automation Dashboard
              </h1>
              <p class="text-slate-400 text-lg">AI-Orchestrated End-to-End Test Execution</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-slate-500 font-mono">Generated: ${new Date().toISOString()}</p>
              <p class="text-sm text-slate-500 font-mono">Engine: Groq / Llama-3</p>
            </div>
          </header>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            <!-- Metrics Card -->
            <div class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
              <h2 class="text-xl font-bold mb-6 text-slate-300 relative z-10 uppercase tracking-widest text-sm">Execution Metrics</h2>
              <div class="w-56 h-56 relative z-10"><canvas id="myChart"></canvas></div>
              <div class="mt-8 grid grid-cols-3 gap-4 w-full relative z-10 text-center">
                <div><p class="text-3xl font-bold text-emerald-400">${passed}</p><p class="text-xs text-slate-500 uppercase">Pass</p></div>
                <div><p class="text-3xl font-bold text-red-400">${failed}</p><p class="text-xs text-slate-500 uppercase">Fail</p></div>
                <div><p class="text-3xl font-bold text-yellow-400">${blocked}</p><p class="text-xs text-slate-500 uppercase">Blocked</p></div>
              </div>
            </div>
            
            <!-- Agent Artifacts Grid -->
            <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg flex flex-col">
                <h3 class="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Requirements Analyst
                </h3>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/50 font-mono text-xs text-blue-200/70 overflow-auto flex-grow h-48">
                  <pre>${JSON.stringify(context.requirements, null, 2)}</pre>
                </div>
              </div>

              <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg flex flex-col">
                <h3 class="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  Test Planner
                </h3>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/50 font-mono text-xs text-purple-200/70 overflow-auto flex-grow h-48">
                  <pre>${JSON.stringify(context.plan, null, 2)}</pre>
                </div>
              </div>

              <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg flex flex-col">
                <h3 class="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                  Test Data Agent
                </h3>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/50 font-mono text-xs text-yellow-200/70 overflow-auto flex-grow h-48">
                  <pre>${JSON.stringify(context.data, null, 2)}</pre>
                </div>
              </div>

              <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg flex flex-col">
                <h3 class="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Cross Validator
                </h3>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/50 font-mono text-xs text-emerald-200/70 overflow-auto flex-grow h-48">
                  <pre>${JSON.stringify(context.validation, null, 2)}</pre>
                </div>
              </div>

            </div>
          </div>

          <div class="mt-16">
            <h2 class="text-2xl font-bold mb-8 text-slate-100 flex items-center gap-3">
              <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Execution Trace
            </h2>
            <div class="space-y-4">
              ${executionHtml}
            </div>
          </div>

          <div class="mt-16" id="deepeval-section">
            <h2 class="text-2xl font-bold mb-8 text-slate-100 flex items-center gap-3">
              <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              DeepEval — LLM Quality Metrics
            </h2>
            <div id="deepeval-content">
              <div class="bg-slate-800/50 rounded-xl p-8 border border-slate-700/50 text-center">
                <p class="text-slate-400 animate-pulse">⏳ Evaluation results will appear here after DeepEval completes...</p>
                <p class="text-slate-500 text-sm mt-2">Check <code class="text-cyan-400">reports/eval_results.json</code></p>
              </div>
            </div>
          </div>

        </div>
        <script>
          const ctx = document.getElementById('myChart');
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Pass', 'Fail', 'Blocked'],
              datasets: [{ 
                data: [${passed}, ${failed}, ${blocked}], 
                backgroundColor: ['#34d399', '#f87171', '#fbbf24'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: { 
              cutout: '75%', 
              plugins: { 
                legend: { display: false } 
              },
              layout: { padding: 10 }
            }
          });

          // ── DeepEval Results Loader ──
          window.__DEEPEVAL_DATA__ = null; // INJECT_DEEPEVAL_DATA_HERE

          async function loadDeepEvalResults() {
            if (window.__DEEPEVAL_DATA__) {
              renderDeepEval(window.__DEEPEVAL_DATA__);
              return;
            }
            try {
              const res = await fetch('./eval_results.json');
              if (!res.ok) return;
              const data = await res.json();
              renderDeepEval(data);
            } catch(e) {
              // Retry after 5 seconds (eval might still be running)
              setTimeout(loadDeepEvalResults, 5000);
            }
          }

          function renderDeepEval(data) {
            const container = document.getElementById('deepeval-content');
            if (!container) return;

            const overallColor = data.overallPassed 
              ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' 
              : 'from-red-500/20 to-red-500/5 border-red-500/30';
            const overallIcon = data.overallPassed ? '✅' : '❌';
            const overallText = data.overallPassed ? 'text-emerald-400' : 'text-red-400';

            let metricsHtml = '';
            (data.metrics || []).forEach(m => {
              const pct = Math.round(m.score * 100);
              const barColor = m.passed 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                : 'bg-gradient-to-r from-red-500 to-red-400';
              const statusBadge = m.passed 
                ? '<span class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">PASS</span>'
                : '<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">FAIL</span>';

              metricsHtml += \`
                <div class="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-slate-200">\${m.name}</h4>
                    <div class="flex items-center gap-3">
                      \${statusBadge}
                      <span class="text-lg font-bold \${m.passed ? 'text-emerald-400' : 'text-red-400'}">\${pct}%</span>
                    </div>
                  </div>
                  <div class="w-full bg-slate-900 rounded-full h-2 mb-3">
                    <div class="\${barColor} h-2 rounded-full transition-all duration-700" style="width: \${pct}%"></div>
                  </div>
                  <p class="text-xs text-slate-400 leading-relaxed">\${m.reason || 'No reason provided'}</p>
                </div>
              \`;
            });

            container.innerHTML = \`
              <div class="bg-gradient-to-br \${overallColor} rounded-2xl p-6 border mb-6">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="text-sm text-slate-400 uppercase tracking-wider font-medium">Overall Quality Score</p>
                    <p class="text-4xl font-extrabold \${overallText} mt-1">\${Math.round(data.overallScore * 100)}%</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl">\${overallIcon}</p>
                    <p class="text-xs text-slate-500 font-mono mt-1">Model: \${data.model || 'unknown'}</p>
                    <p class="text-xs text-slate-500 font-mono">\${data.timestamp || ''}</p>
                  </div>
                </div>
              </div>
              <div class="grid gap-4">
                \${metricsHtml}
              </div>
            \`;
          }

          // Load eval results after a short delay
          setTimeout(loadDeepEvalResults, 1000);
        </script>
      </body>
    </html>`;
    
    fs.writeFileSync(htmlPath, html);

    consoleLog("AGENT reporter — detailed dashboard written to /reports/");
    return { jsonPath, htmlPath, totalPassRate: (passed + failed + blocked) > 0 ? passed / (passed + failed + blocked) * 100 : 0 };
  }
}

registerAgent("reporter", "Generates detailed reports", new ReporterAgent());
