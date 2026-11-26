import React, { useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';
import type { AuthErrorDetail } from '../firebase/config';

interface AuthErrorBoxProps {
  error: AuthErrorDetail;
}

export const AuthErrorBox: React.FC<AuthErrorBoxProps> = ({ error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyDomain = () => {
    if (!error.unauthorizedDomain) return;
    navigator.clipboard?.writeText(error.unauthorizedDomain).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-2xl border-2 border-[#D9384A] bg-[#FFE8EB] p-3 text-left text-xs text-[#7D1422] space-y-2">
      <div className="flex items-start gap-2 font-bold">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D9384A]" strokeWidth={2.5} />
        <span className="leading-snug">{error.message}</span>
      </div>

      {error.unauthorizedDomain && (
        <div className="space-y-2 rounded-xl border border-[#D9384A]/30 bg-white p-2.5 text-[#432B1D]">
          <div className="text-[11px] font-bold text-[#6A4C3A]">
            Cara memperbaiki (1 menit):
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] font-medium text-[#5A3D2C]">
            <li>Salin domain web Android ini:</li>
          </ol>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#432B1D]/25 bg-[#FFF8F0] px-2.5 py-1.5">
            <code className="font-mono-num min-w-0 flex-1 truncate text-[11px] font-bold text-[#432B1D]">
              {error.unauthorizedDomain}
            </code>
            <button
              type="button"
              onClick={handleCopyDomain}
              className="btn-25d flex shrink-0 items-center gap-1 rounded-lg bg-[#FFD166] px-2 py-1 text-[11px] font-bold text-[#432B1D]"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={2.75} />
                  <span>Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" strokeWidth={2.5} />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>

          <ol start={2} className="list-decimal pl-4 space-y-1 text-[11px] font-medium text-[#5A3D2C]">
            <li>
              Buka <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong> lalu klik <strong>Add domain</strong>.
            </li>
          </ol>

          {error.consoleUrl && (
            <a
              href={error.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-25d inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#432B1D] px-3 py-2 text-[11px] font-bold text-[#FFFBF7]"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
              Buka Authorized Domains Firebase
            </a>
          )}
        </div>
      )}
    </div>
  );
};
