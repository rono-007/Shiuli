import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#101827] flex items-center justify-center p-6 text-[#FAF6ED] font-serif">
          <div className="max-w-md w-full bg-[#1A0E10] border-2 border-[#D4A24C]/40 rounded-3xl p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#8B1E2D]/20 border border-[#8B1E2D]/40 flex items-center justify-center mx-auto text-[#D4A24C]">
              <AlertTriangle className="w-8 h-8 text-[#E5B05C]" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#E5B05C] mb-2 font-serif">
                পেজ লোড করতে সমস্যা হয়েছে
              </h2>
              <p className="text-xs sm:text-sm text-[#FAF6ED]/80 font-sans leading-relaxed">
                Something went wrong while loading the page. Please tap the button below to reload Shiuli.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#7A1F26] via-[#941F28] to-[#7A1F26] hover:from-[#8B1E2D] hover:to-[#8B1E2D] text-[#FAF6ED] font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পুনরায় লোড করুন / Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
