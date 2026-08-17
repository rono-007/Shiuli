import React, { useState, useRef } from 'react';
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { verifyBetaAccessAsync } from '../config/betaKeys';

interface BetaAccessModalProps {
  onVerified?: (email: string) => void;
}

export const BetaAccessModal: React.FC<BetaAccessModalProps> = ({ onVerified }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.join('');

    setErrorMessage('');
    setSuccessMessage('');

    if (!email || finalCode.length < 5) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে সঠিক ইমেল ও ৫-সংখ্যার কোড দিন' : 'Please enter valid email & 5-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyBetaAccessAsync(email, finalCode);
      if (res.success) {
        setSuccessMessage(res.message);
        localStorage.setItem('shiuli_beta_verified', 'true');
        localStorage.setItem('shiuli_beta_name', res.name || 'Beta User');
        localStorage.setItem('shiuli_beta_email', email.trim().toLowerCase());
        localStorage.setItem('shiuli_beta_code', finalCode);

        setTimeout(() => {
          if (onVerified) onVerified(email);
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(isBn ? 'যাচাইকরণে ত্রুটি ঘটেছে' : 'Verification failed, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#150507]/90 backdrop-blur-2xl p-4 sm:p-6 font-serif select-none animate-in fade-in duration-300">

      {/* Background Ambient Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B1E2D]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4A24C]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Luxury Modal Card */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#FDFBF7] via-[#FAF6ED] to-[#F5EDE1] text-[#3D0D11] rounded-[2.5rem] p-7 sm:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.6),0_0_0_1px_rgba(212,162,76,0.35)] border-2 border-[#D4A24C]/60 overflow-hidden text-center animate-in zoom-in-95 duration-300">

        {/* Ornate Corner Accents */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#D4A24C]/70 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#D4A24C]/70 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#D4A24C]/70 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#D4A24C]/70 rounded-br-xl pointer-events-none" />

        {/* Inner Delicate Hairline Border */}
        <div className="absolute inset-2 border border-[#D4A24C]/25 rounded-[2.2rem] pointer-events-none" />

        {/* Shiuli Flower Centerpiece & Brand Title */}
        <div className="relative z-10 flex flex-col items-center mb-6">

          {/* Glowing Emblem */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#D4A24C]/30 via-[#941F28]/20 to-[#D4A24C]/30 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#FAF6ED] to-[#F1E4D0] border-2 border-[#D4A24C] shadow-lg flex items-center justify-center p-3">
              <img
                src="/shiuli2.png"
                alt="Shiuli Emblem"
                className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500 hover:rotate-45"
              />
            </div>
          </div>

          {/* Title Banner */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3D0D11] flex items-center justify-center gap-2 font-serif">
            <span className="text-[#8B1E2D]">{isBn ? 'শিউলি' : 'Shiuli'}</span>
            <span className="text-[#D4A24C] font-light">•</span>
            <span className="text-[#4A1015] font-serif font-bold">{isBn ? 'বিটা অ্যাক্সেস' : 'Beta Access'}</span>
          </h2>

          {/* Ornate Divider */}
          <div className="flex items-center gap-2 mt-2 w-full max-w-[200px] justify-center opacity-70">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#D4A24C]" />
            <span className="text-[#D4A24C] text-xs">❖</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#D4A24C]" />
          </div>

          <p className="text-xs sm:text-sm text-[#5C3B34] mt-2 font-sans font-medium max-w-xs leading-relaxed">
            {isBn
              ? 'শিউলি ব্যবহার করতে আপনার রেজিস্টার্ড ইমেল ও ৫-সংখ্যার গোপন কোড দিন:'
              : 'Enter your registered Email ID and 5-digit verification code to unlock access:'}
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerifySubmit} className="relative z-10 space-y-5 font-sans text-left">

          {/* Email Input Field */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8B1E2D] mb-1.5 font-serif">
              <span>{isBn ? 'ইমেল আইডি' : 'Email Address'}</span>
              <span className="text-[10px] text-[#A67C52] font-normal lowercase font-sans">{isBn ? '(রেজিস্টার্ড ইমেল)' : '(registered)'}</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8B1E2D]/60 group-focus-within:text-[#8B1E2D] transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@gmail.com"
                className="w-full bg-white/95 border border-[#D4A24C]/45 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#3D0D11] placeholder:text-[#3D0D11]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus:outline-none focus:border-[#8B1E2D] focus:ring-4 focus:ring-[#8B1E2D]/10 font-medium transition-all"
              />
            </div>
          </div>

          {/* 5-Digit OTP Verification Field */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8B1E2D] mb-2 font-serif">
              <span>{isBn ? '৫-সংখ্যার কোড' : '5-Digit Beta Code'}</span>
              <span className="text-[10px] text-[#A67C52] font-normal flex items-center gap-1 font-sans">
                <Lock className="w-2.5 h-2.5" /> {isBn ? 'গোপন কি' : 'secret key'}
              </span>
            </label>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={!!successMessage}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`aspect-square w-full rounded-2xl text-center text-2xl sm:text-3xl font-mono font-bold transition-all duration-300 ${successMessage
                      ? 'border-2 border-emerald-500 text-emerald-600 bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-105'
                      : errorMessage
                        ? 'border-2 border-rose-400 bg-rose-50/50 text-rose-700'
                        : 'bg-white border-2 border-[#D4A24C]/40 text-[#8B1E2D] shadow-[0_3px_10px_rgba(212,162,76,0.12),inset_0_2px_4px_rgba(0,0,0,0.02)] hover:border-[#D4A24C] focus:border-[#8B1E2D] focus:ring-4 focus:ring-[#8B1E2D]/15 focus:scale-105 focus:outline-none'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-800 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-in slide-in-from-top-1 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* CTA Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7A1F26] via-[#941F28] to-[#7A1F26] hover:from-[#66161C] hover:to-[#66161C] text-[#FAF6ED] font-serif font-bold text-base flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(122,31,38,0.4),0_0_0_1px_rgba(212,162,76,0.4)] hover:shadow-[0_12px_30px_rgba(122,31,38,0.5)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
              </>
            ) : (
              <>
                <span>{isBn ? 'যাচাই করুন ও প্রবেশ করুন' : 'Verify & Unlock Access'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default BetaAccessModal;
