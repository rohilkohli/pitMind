import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ShareButtonProps {
  onCopyUrl: () => Promise<boolean>;
  getShareUrl: () => string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onCopyUrl, getShareUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopyUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      {/* Share button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-pit-accent text-white hover:bg-pit-accent/90"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {/* Share panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="p-4 border border-slate-200 bg-white shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-3">Share this view</h3>

            {/* URL display */}
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-2">Shareable URL:</div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 break-all">
                {getShareUrl()}
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy URL
                </>
              )}
            </button>

            {/* Info */}
            <p className="mt-3 text-xs text-slate-600">
              Share this URL with your team to show them your current dashboard view, including filters and metrics.
            </p>

            {/* Quick copy option */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-3 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </Card>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
