import React, { useState } from "react";
import { FileText, Upload, CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { uploadDebrief, type DebriefResponse } from "../../services/api";
import { auth } from "../../lib/firebase";

interface PostRaceDebriefProps {
  showHeader?: boolean;
}

export const PostRaceDebrief: React.FC<PostRaceDebriefProps> = ({ showHeader = true }) => {
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
      setError(err.message || "Failed to upload and process debrief");
    } finally {
      setLoading(false);
    }
  };

  const downloadDebrief = () => {
    if (!debrief) return;
    const blob = new Blob([debrief.report_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pitmind_debrief_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="pm-panel-header">
          <div className="flex items-center justify-between w-full">
            <div className="pm-panel-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--f1-red)]" />
              Post-Race Debrief
            </div>
            <div className="flex items-center gap-2">
              <span className="pm-chip">Docling Enabled</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col p-5">
        {!debrief ? (
          <div className="flex flex-col items-center justify-center py-10 border border-[var(--border)] bg-[var(--carbon-mid)] hover:border-[var(--f1-red)] transition-colors cursor-pointer group relative flex-1">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept=".pdf,.csv,.json,.txt"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[var(--f1-red-dim)] border border-[var(--f1-red-glow)] group-hover:scale-110 transition-transform clip-para-sm">
                <Upload className="w-8 h-8 text-[var(--f1-red)]" />
              </div>
              <div className="text-center">
                <p className="font-label text-[var(--text-primary)] font-bold uppercase tracking-wider text-lg">
                  {file ? file.name : "Upload race data or PDF"}
                </p>
                <p className="font-tele text-[10px] text-[var(--text-secondary)] mt-1 uppercase">
                  Supports .PDF, .CSV, .JSON, .TXT (Max 5MB)
                </p>
              </div>
              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={loading}
                  className="pm-btn-primary mt-4 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process with Granite"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-[var(--neon-green-dim)] border border-[var(--neon-green)]">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[var(--neon-green)]" />
                <div>
                  <p className="font-label text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Analysis Complete
                  </p>
                  <p className="font-tele text-[10px] text-[var(--neon-green)] uppercase">
                    {debrief.source_note}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDebrief(null)}
                  className="px-3 py-1.5 border border-[var(--border)] text-xs text-[var(--text-secondary)] uppercase font-bold hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition"
                >
                  Upload New
                </button>
                <button
                  onClick={downloadDebrief}
                  className="pm-btn-primary px-3 py-1.5 text-xs flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Save MD
                </button>
              </div>
            </div>

            <div className="pm-panel p-6 flex-1 overflow-y-auto max-h-[500px]">
              <div className="font-tele text-sm leading-relaxed text-[var(--text-secondary)] max-w-none">
                {debrief.report_markdown.split("\n").map((line, i) => {
                  if (line.startsWith("# "))
                    return (
                      <h1
                        key={i}
                        className="font-label text-2xl font-black text-[var(--text-primary)] mt-6 mb-4 uppercase tracking-tighter border-b border-[var(--f1-red-glow)] pb-2"
                      >
                        {line.replace("# ", "")}
                      </h1>
                    );
                  if (line.startsWith("## "))
                    return (
                      <h2
                        key={i}
                        className="font-label text-xl font-bold text-[var(--text-primary)] mt-5 mb-3 uppercase tracking-tighter"
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  if (line.startsWith("### "))
                    return (
                      <h3
                        key={i}
                        className="font-label text-lg font-bold text-[var(--f1-red)] mt-4 mb-2 uppercase"
                      >
                        {line.replace("### ", "")}
                      </h3>
                    );
                  if (line.startsWith("- "))
                    return (
                      <div key={i} className="flex gap-2 mb-1">
                        <span className="text-[var(--f1-red)]">•</span>
                        <span>{line.replace("- ", "")}</span>
                      </div>
                    );
                  if (line.trim() === "") return <div key={i} className="h-4" />;
                  return (
                    <p key={i} className="mb-4">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 border border-[var(--f1-red)] bg-[var(--f1-red-dim)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--f1-red)] shrink-0" />
            <div>
              <p className="font-label text-sm font-bold text-[var(--text-primary)] uppercase">
                Upload Failed
              </p>
              <p className="font-tele text-xs text-[var(--f1-red)] mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
