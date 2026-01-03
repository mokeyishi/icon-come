
import React, { useState, useEffect, useCallback } from 'react';
import { Search, History, Globe, Download, Trash2, Loader2, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { IconResult, SearchHistoryItem, BrandAnalysis } from './types';
import { analyzeBrand } from './services/geminiService';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<IconResult | null>(null);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 加载本地历史记录
  useEffect(() => {
    const saved = localStorage.getItem('icon_fetch_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  // 保存到历史记录
  const saveToHistory = useCallback((item: SearchHistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.domain !== item.domain);
      const updated = [item, ...filtered].slice(0, 15);
      localStorage.setItem('icon_fetch_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const cleanDomain = (input: string): string => {
    let domain = input.trim().toLowerCase();
    domain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    return domain;
  };

  const fetchIcon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    setError(null);
    setIsLoading(true);
    setCopied(false);
    setBrandAnalysis(null);
    
    const domain = cleanDomain(url);
    if (!domain || !domain.includes('.')) {
      setError("请输入有效的网址 (例如: github.com)");
      setIsLoading(false);
      return;
    }

    // 使用 Google 的 Favicon 服务获取 128px 的大图
    const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    
    try {
      const result: IconResult = {
        domain,
        iconUrl,
        timestamp: Date.now()
      };

      setCurrentResult(result);
      saveToHistory(result);
      
      // Call Gemini for brand analysis in parallel or after fetching the icon
      const analysis = await analyzeBrand(domain);
      setBrandAnalysis(analysis);
    } catch (err) {
      console.error("Error during fetch:", err);
      setError("处理请求时出错，请检查网络或稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.iconUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('icon_fetch_history');
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setUrl(item.domain);
    setCurrentResult(item);
    setBrandAnalysis(null);
    setCopied(false);
    // Trigger analysis for history item if selected
    analyzeBrand(item.domain).then(setBrandAnalysis);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#0f172a] text-slate-200">
      <nav className="sticky top-0 z-50 glass-effect border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">IconFetch</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <section className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
            获取网站 <span className="text-indigo-400">Favicon</span> 图标
          </h2>
          <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto">
            极简、快速。输入域名，获取官方图标资源地址并享受 AI 品牌深度分析。
          </p>

          <form onSubmit={fetchIcon} className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入网址，例如: github.com"
              className="w-full h-14 pl-12 pr-32 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-base"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '获取'}
            </button>
          </form>
          {error && <p className="text-rose-400 mt-3 text-sm font-medium">{error}</p>}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentResult ? (
              <div className="glass-effect rounded-2xl p-6 md:p-8 border border-white/10 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-white/5 rounded-2xl p-4 flex items-center justify-center border border-white/10 shadow-inner">
                    <img
                      src={currentResult.iconUrl}
                      alt={currentResult.domain}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="w-full text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">{currentResult.domain}</h3>
                      <a href={`https://${currentResult.domain}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    
                    <div className="mt-6 space-y-4 text-left">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">图标完整地址 (URL)</label>
                        <div className="flex items-center gap-2 bg-black/40 p-3 rounded-lg border border-white/5 font-mono text-[10px] md:text-xs break-all">
                          <span className="flex-1 text-slate-300">{currentResult.iconUrl}</span>
                          <button 
                            onClick={copyToClipboard}
                            className="shrink-0 p-2 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                            title="点击复制"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => window.open(currentResult.iconUrl, '_blank')}
                          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors font-semibold border border-indigo-500/20"
                        >
                          <Download className="w-4 h-4" />
                          在新窗口打开
                        </button>
                      </div>
                    </div>

                    {/* Gemini Brand Analysis Section */}
                    {brandAnalysis ? (
                      <div className="mt-8 pt-8 border-t border-white/5 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">AI 品牌视觉分析</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase block mb-2 font-bold">品牌调色盘</label>
                              <div className="flex flex-wrap gap-2">
                                {brandAnalysis.colors.map((color, i) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                    <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }}></div>
                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">视觉风格</label>
                              <span className="text-sm text-slate-300 font-medium">{brandAnalysis.style}</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">品牌意涵</label>
                              <p className="text-xs text-slate-400 leading-relaxed">{brandAnalysis.brandIdentity}</p>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">AI 图标优化方案</label>
                              <p className="text-xs text-indigo-300/80 leading-relaxed italic">"{brandAnalysis.suggestedImprovements}"</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isLoading && (
                      <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center justify-center py-6 text-slate-500 animate-pulse">
                        <Sparkles className="w-5 h-5 animate-bounce mb-2" />
                        <p className="text-xs italic">Gemini 正在分析品牌视觉语言...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-2xl">
                <Globe className="w-16 h-16 mb-4 stroke-1" />
                <p>输入域名即可开始提取图标</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="font-semibold text-sm">最近查询</h3>
                </div>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors text-slate-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-600 italic">暂无历史记录</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(item)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group border border-transparent hover:border-white/5"
                    >
                      <div className="w-8 h-8 bg-white/5 rounded-md flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/30">
                        <img src={item.iconUrl} alt={item.domain} className="w-5 h-5 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate group-hover:text-indigo-400 transition-colors">
                          {item.domain}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-600 text-[10px] uppercase tracking-widest">
        <p>© {new Date().getFullYear()} IconFetch - 纯净版</p>
      </footer>
    </div>
  );
};

export default App;
