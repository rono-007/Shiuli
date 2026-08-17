import React from 'react';
import { AlertTriangle, X, Sparkles, ArrowRight, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BetaModalProps {
  onClose?: () => void;
}

export const BetaModal: React.FC<BetaModalProps> = ({ onClose }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#2B231D]/75 backdrop-blur-md p-4 sm:p-6 font-serif animate-in fade-in duration-300">
      <div className="bg-[#FAF6ED] text-[#3D0D11] rounded-[2rem] border-2 border-[#D4A24C]/60 shadow-2xl w-full max-w-lg overflow-hidden relative p-6 sm:p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        
        {/* Background Decorative Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#941F28]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#DFB86C]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Icon Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#3D0D11]/5 hover:bg-[#3D0D11]/10 text-[#5C4D43] flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close Notice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Beta Badge & Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#941F28]/10 border border-[#941F28]/20 flex items-center justify-center text-[#941F28] mb-5 shadow-xs relative">
          <Wrench className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#941F28] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#941F28]"></span>
          </span>
        </div>

        {/* Tag Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFB86C]/20 border border-[#DFB86C]/40 text-[#7A1F26] text-xs font-mono font-bold tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isBn ? 'বিটা ভার্সন বিজ্ঞপ্তি' : 'BETA VERSION NOTICE'}</span>
        </div>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl font-bold text-[#3D0D11] mb-3 font-serif leading-tight">
          {isBn ? 'শিউলি বিটা ভার্সন' : 'Shiuli is in Beta'}
        </h3>

        {/* Notice Description Box */}
        <div className="bg-white/80 rounded-2xl p-4 sm:p-5 border border-[#EAE3D9] text-left mb-6 space-y-2 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#941F28] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-[#4A3930] leading-relaxed font-sans">
              {isBn ? (
                <>
                  <strong className="font-serif text-[#7A1F26] block mb-1 text-sm">গুরুত্বপূর্ণ তথ্য:</strong>
                  বর্তমানে অ্যাপটি <strong>বিটা ভার্সনে (Beta Testing)</strong> রয়েছে। কিছু ফিচার, নেভিগেশন ম্যাপ ও লাইভ তথ্য সাময়িকভাবে পরিবর্তনশীল হতে পারে এবং সম্পূর্ণ কাজ নাও করতে পারে।
                </>
              ) : (
                <>
                  <strong className="font-serif text-[#7A1F26] block mb-1 text-sm">Please Note:</strong>
                  This application is currently in <strong>Beta testing</strong>. Some features, route maps, and live tools are under active development and may not function completely as expected.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#941F28] via-[#A82531] to-[#941F28] hover:from-[#7A1F26] hover:to-[#7A1F26] text-white font-serif font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>{isBn ? 'বুঝেছি, এগিয়ে যান' : 'I Understand, Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};

export default BetaModal;
