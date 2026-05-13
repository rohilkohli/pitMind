import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { uploadDebrief, type DebriefResponse } from '../../services/api';
import { auth } from '../../lib/firebase';

export const PostRaceDebrief: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<DebriefResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const res = await uploadDebrief(file, token);
      setDebrief(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload and process debrief');
    } finally {
      setLoading(false);
    }
  };

  const downloadDebrief = () => {
    if (!debrief) return;
    const blob = new Blob([debrief.report_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitmind_debrief_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="border-f1-border bg-f1-black overflow-hidden">
      <CardHeader className="border-b border-f1-border bg-f1-dark/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-f1-white flex items-center gap-2 uppercase tracking-widest">
            <FileText className="w-5 h-5 text-f1-red" />
            Post-Race Debrief
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded border border-f1-red/30 bg-f1-red/10 text-f1-red font-bold uppercase tracking-tighter">AI Analysis</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold uppercase tracking-tighter">Docling Enabled</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!debrief ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-f1-border rounded-xl bg-f1-dark/20 hover:bg-f1-dark/40 transition-colors cursor-pointer group relative">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.csv,.json,.txt"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-f1-red/10 border border-f1-red/20 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-f1-red" />
              </div>
              <div className="text-center">
                <p className="text-f1-white font-bold uppercase tracking-wider">
                  {file ? file.name : 'Upload race data or PDF'}
                </p>
                <p className="text-xs text-f1-muted mt-1 uppercase">Supports .PDF, .CSV, .JSON, .TXT (Max 5MB)</p>
              </div>
              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={loading}
                  className="mt-4 px-6 py-2 bg-f1-red text-white font-bold uppercase tracking-widest hover:bg-f1-red-dark transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process with Granite'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between p-4 bg-inter/10 border border-inter/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-inter" />
                <div>
                  <p className="text-sm font-bold text-f1-white uppercase tracking-wider">Analysis Complete</p>
                  <p className="text-[10px] text-f1-muted uppercase">{debrief.source_note}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDebrief(null)}
                  className="px-3 py-1.5 border border-f1-border text-xs text-f1-muted uppercase font-bold hover:text-white hover:border-white transition"
                >
                  Upload New
                </button>
                <button
                  onClick={downloadDebrief}
                  className="px-3 py-1.5 bg-f1-red text-white text-xs uppercase font-bold hover:bg-f1-red-dark transition flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Save MD
                </button>
              </div>
            </div>

            <div className="f1-card border border-f1-border bg-f1-black/40 p-6 font-mono text-sm leading-relaxed text-f1-secondary overflow-y-auto max-h-[500px]">
              <div className="prose prose-invert max-w-none">
                {debrief.report_markdown.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-f1-white mt-6 mb-4 uppercase tracking-tighter border-b border-f1-red/30 pb-2">{line.replace('# ', '')}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-f1-white mt-5 mb-3 uppercase tracking-tighter">{line.replace('## ', '')}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-f1-red mt-4 mb-2 uppercase">{line.replace('### ', '')}</h3>;
                  if (line.startsWith('- ')) return <div key={i} className="flex gap-2 mb-1"><span className="text-f1-red">•</span><span>{line.replace('- ', '')}</span></div>;
                  if (line.trim() === '') return <div key={i} className="h-4" />;
                  return <p key={i} className="mb-4">{line}</p>;
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 border border-f1-red/30 bg-f1-red/10 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-f1-red shrink-0" />
            <div>
              <p className="text-sm font-bold text-f1-white uppercase">Upload Failed</p>
              <p className="text-xs text-f1-red mt-1">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
