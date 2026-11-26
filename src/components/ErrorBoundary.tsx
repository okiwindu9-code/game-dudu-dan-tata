import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan pada aplikasi.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('App ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#FFE8EC] p-4">
          <div className="card-25d w-full max-w-md rounded-3xl bg-[#FFFBF7] p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-[#432B1D] bg-[#FFE3E6] text-[#D9384A]">
              <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h1 className="mt-3 font-display text-xl font-bold text-[#432B1D]">
              Oops, Ada Gangguan Koneksi
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[#7A5B47]">
              Terjadi kesalahan saat menyinkronkan data. Muat ulang halaman untuk kembali bermain dengan aman.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-25d mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#49C829] px-5 py-2.5 font-display text-sm font-bold text-white"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
              Muat Ulang Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
