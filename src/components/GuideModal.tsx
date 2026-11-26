import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ onClose }) => {
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#432B1D]/40 p-4">
      <div className="card-25d w-full max-w-md overflow-hidden rounded-3xl bg-[#FFFBF7]">
        <div className="flex items-center justify-between border-b-2 border-[#432B1D]/15 bg-[#FFF0F3] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#432B1D] bg-[#F26B7A] text-white">
              <BookOpen className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold leading-tight text-[#432B1D]">
                Panduan Bermain
              </h2>
              <p className="text-xs font-semibold text-[#7A5B47]">
                Kontrol, nilai buah &amp; sistem kombo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-25d flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#432B1D]"
            aria-label="Tutup panduan"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs font-medium text-[#5A4031]">
          <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-white p-3.5">
            <div className="font-display text-sm font-bold text-[#432B1D]">
              Kontrol Karakter
            </div>
            <p className="mt-1 leading-relaxed">
              Gerak kiri/kanan pakai tombol <strong className="text-[#432B1D]">A / D</strong>,{' '}
              <strong className="text-[#432B1D]">Panah</strong>, atau{' '}
              <strong className="text-[#432B1D]">geser layar</strong>. Tekan{' '}
              <strong className="text-[#432B1D]">Spasi / W</strong> untuk melompat dan{' '}
              <strong className="text-[#432B1D]">P / Esc</strong> untuk jeda.
            </p>
          </div>

          <div>
            <div className="font-display text-sm font-bold text-[#432B1D]">
              Daftar Makanan &amp; Efek
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#432B1D]/20 bg-[#FFF0F3] px-3 py-2">
                <div className="font-bold text-[#432B1D]">Stroberi &amp; Persik</div>
                <div className="font-mono-num text-[#D94F70]">+10 s/d +15 poin</div>
              </div>
              <div className="rounded-xl border border-[#432B1D]/20 bg-[#FFF4E6] px-3 py-2">
                <div className="font-bold text-[#432B1D]">Semangka &amp; Donat</div>
                <div className="font-mono-num text-[#C06B2B]">+25 s/d +35 poin</div>
              </div>
              <div className="rounded-xl border border-[#432B1D]/20 bg-[#FFF9DB] px-3 py-2">
                <div className="font-bold text-[#432B1D]">Boba Susu / Jam</div>
                <div className="font-mono-num text-[#9A6E00]">+50 poin / +5 detik</div>
              </div>
              <div className="rounded-xl border border-[#432B1D]/20 bg-[#FFE3E3] px-3 py-2">
                <div className="font-bold text-[#C92A3E]">Bom Gosong</div>
                <div className="font-mono-num text-[#C92A3E]">-1 Nyawa (3x → Menu)</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#432B1D]/20 bg-[#FFF8E1] p-3.5">
            <div className="font-display text-sm font-bold text-[#432B1D]">
              Pesta Manis x2 &amp; Tukar Poin
            </div>
            <p className="mt-1 leading-relaxed">
              Tangkap 10 buah beruntun untuk masuk mode <strong className="text-[#432B1D]">Pesta Manis x2</strong>. Semua poin akhir ronde masuk ke Celengan Poin dan dapat ditukar menjadi saldo <strong className="text-[#432B1D]">Rupiah (Rp)</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
