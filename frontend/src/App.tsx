import { useState, useEffect, lazy, Suspense } from 'react';
import HeroSection from './components/HeroSection';
import PujaGuideSection from './components/PujaGuideSection';
import SectionDivider from './components/SectionDivider';

import { Heart, WifiOff, Mail, Phone, MapPin } from 'lucide-react';
import { LanguageProvider } from './context/LanguageContext';
import { InitialLanguageModal } from './components/InitialLanguageModal';
import { LanguageToggle } from './components/LanguageToggle';
import BetaModal from './components/BetaModal';

const NorthCalcuttaSection = lazy(() => import('./components/NorthCalcuttaSection'));
const SouthCalcuttaSection = lazy(() => import('./components/SouthCalcuttaSection'));
const CentralCalcuttaSection = lazy(() => import('./components/CentralCalcuttaSection'));
const BonediCalcuttaSection = lazy(() => import('./components/BonediCalcuttaSection'));
const FacilitiesSection = lazy(() => import('./components/FacilitiesSection'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const StorySection = lazy(() => import('./components/StorySection'));
const RoutePlanner = lazy(() => import('./components/RoutePlanner'));

function SectionLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-[#FAF6ED] font-serif">
      <img 
        src="/shiuli2.png" 
        alt="Loading" 
        className="h-16 w-16 object-contain mb-4"
        style={{
          animation: 'shiuli-spin 1.5s linear infinite',
          transformOrigin: '50% 50%',
        }}
      />
      <p className="text-sm font-bold text-[#3D0D11] tracking-wide font-serif">লোড হচ্ছে...</p>
    </div>
  );
}

/*
 * InitialLogoLoader — Cinematic Shiuli Flower Intro
 * 
 * Architecture (3 nested GPU-accelerated layers):
 *   Layer 1: OVERLAY — full-screen container, fades out via shiuli-overlay-fade
 *   Layer 2: ZOOM ANCHOR — positioned at exact viewport center (50%/50%), 
 *            scales from 1→80x via shiuli-zoom keyframe
 *   Layer 3: SPIN — continuous clockwise rotation via shiuli-spin, 
 *            runs independently throughout the entire animation
 *
 * Timeline (~2.2s total):
 *   0.0s – 1.2s  Pure rotation (spin visible, zoom = 1x)
 *   1.2s – 2.0s  Zoom accelerates while rotation continues
 *   1.6s – 2.2s  Overlay crossfades out, website crossfades in
 *   2.2s          Loader unmounted, website fully interactive
 */
function InitialLogoLoader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'spin' | 'zoom' | 'done'>('spin');

  const SPIN_MS = 1200;
  const TOTAL_MS = 2200;

  useEffect(() => {
    const zoomTimer = setTimeout(() => setPhase('zoom'), SPIN_MS);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, TOTAL_MS);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  const isZooming = phase === 'zoom';

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#FAF6ED] overflow-hidden"
      style={{
        opacity: isZooming ? 0 : 1,
        transition: isZooming ? 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s' : 'none',
        pointerEvents: 'none',
        willChange: 'opacity',
      }}
    >
      {/* Centering anchor — strict 50%/50% absolute positioning.
          translate(-50%, -50%) lives here and never changes. */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Zoom layer — scales from center. Separate div so scale 
            doesn't conflict with the translate above. */}
        <div
          style={{
            transform: isZooming ? 'scale(80)' : 'scale(1)',
            transition: isZooming ? 'transform 1s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
            transformOrigin: '50% 50%',
            willChange: 'transform',
          }}
        >
          {/* Spin layer — continuous clockwise rotation from frame 0,
              never stops, runs on its own compositing layer. */}
          <div
            style={{
              animation: 'shiuli-spin 1.5s linear infinite',
              transformOrigin: '50% 50%',
              willChange: 'transform',
            }}
          >
            <img
              src="/shiuli2.png"
              alt="Shiuli Loading"
              draggable={false}
              style={{
                width: 'min(220px, 30vw)',
                height: 'auto',
                display: 'block',
                objectFit: 'contain' as const,
                userSelect: 'none',
                filter: 'drop-shadow(0 6px 18px rgba(200, 96, 64, 0.18))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


function AppContent() {
  const [showLoader, setShowLoader] = useState(false);
  const [view, setView] = useState<'home' | 'north' | 'south' | 'central' | 'bonedi' | 'facilities' | 'route-planner' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('admin') ? 'admin' : 'home';
  });
  const [_searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  return (
    <div className="min-h-screen bg-paper relative font-sans text-ink flex flex-col selection:bg-bengali-red/20 selection:text-ink">
      <InitialLanguageModal />
      <BetaModal onClose={() => setShowLoader(true)} />
      
      {/* Sticky Floating Beta Badge */}
      <div className="fixed bottom-4 right-4 z-40 bg-[#7A1F26]/95 text-[#FAF6ED] border border-[#D4A24C]/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xl flex items-center gap-2 backdrop-blur-md select-none pointer-events-auto">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A24C] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4A24C]"></span>
        </span>
        <span>BETA VERSION</span>
      </div>

      {showLoader && <InitialLogoLoader onComplete={() => setShowLoader(false)} />}
      {isOffline && (
        <div className="bg-[#8B1E2D] text-[#FAF6ED] text-xs font-serif font-bold py-2.5 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md border-b border-[#E5B05C]/30">
          <WifiOff className="w-4 h-4 text-[#E5B05C] flex-shrink-0 animate-pulse" />
          <span>আপনি অফলাইনে আছেন — ক্যাশ করা লোকাল ডাটা ও অফলাইন মোড সক্রিয় রয়েছে</span>
        </div>
      )}
      {view !== 'admin' && (
        <>
          {/* Heavy Noise Overlay for Vintage Print Feel */}
          <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

          {/* Global Subtle Navigation Overlay */}
          <nav className="fixed top-0 left-0 right-0 p-6 md:p-8 z-40 flex justify-between items-start pointer-events-none text-paper">

            {/* Left: Brand Logo (Transparent background, only logo shown) */}
            <div 
              onClick={() => setView('home')}
              className="pointer-events-auto cursor-pointer group flex items-center gap-2"
            >
              <img 
                src="/logo-shiuli.png" 
                alt="Shiuli Logo" 
                className="h-12 sm:h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md" 
              />
              <span className="px-2 py-0.5 rounded-md bg-[#941F28] text-white text-[10px] font-mono font-bold tracking-widest uppercase border border-[#DFB86C]/40 shadow-xs">
                BETA
              </span>
            </div>

            {/* Center: Year & City */}
            <div className="hidden md:block pointer-events-auto">
              <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-60">কলকাতা</span>
            </div>

            {/* Right: Language Selector & Navigation */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <LanguageToggle />
              {view !== 'home' && (
                <button
                  onClick={() => setView('home')}
                  className="bg-[#FAF6ED]/95 hover:bg-white text-[#7A1F26] border border-[#7A1F26]/30 px-3.5 py-1.5 rounded-full text-xs font-serif font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  হোম &rarr;
                </button>
              )}
            </div>
          </nav>
        </>
      )}

      <Suspense fallback={<SectionLoader />}>
        {view === 'admin' ? (
          <AdminPanel onBack={() => { setView('home'); window.history.replaceState({}, '', window.location.pathname); }} />
        ) : (
          <main className="w-full relative">
            {view === 'north' ? (
              <NorthCalcuttaSection onBack={() => setView('home')} />
            ) : view === 'south' ? (
              <SouthCalcuttaSection onBack={() => setView('home')} />
            ) : view === 'central' ? (
              <CentralCalcuttaSection onBack={() => setView('home')} />
            ) : view === 'bonedi' ? (
              <BonediCalcuttaSection onBack={() => setView('home')} />
            ) : view === 'facilities' ? (
              <FacilitiesSection onBack={() => setView('home')} />
            ) : view === 'route-planner' ? (
              <RoutePlanner onBack={() => setView('home')} />
            ) : (
              <>
                <HeroSection
                  onSearch={setSearchQuery}
                  onFilterChange={setActiveFilter}
                  activeFilter={activeFilter}
                  onSelectZone={(zone) => {
                    if (zone === 'north') {
                      setView('north');
                    } else if (zone === 'south') {
                      setView('south');
                    } else if (zone === 'central') {
                      setView('central');
                    } else if (zone === 'bonedi') {
                      setView('bonedi');
                    }
                  }}
                  onSelectFacilities={() => setView('facilities')}
                />

                <SectionDivider />

                {/* CONTENT SECTION */}
                <div className="w-full">
                  <PujaGuideSection 
                    onSelectRoutePlanner={() => setView('route-planner')} 
                    onSelectFacilities={() => setView('facilities')}
                  />

                  <StorySection />
                </div>
              </>
            )}

            {/* Footer Design - Exact Match to Screenshot */}
            <footer className="bg-[#3D0D11] border-t border-[#6B181E] text-[#F7F2E7] pt-14 pb-8 relative z-10 font-serif">
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                
                {/* Main 4-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-10 items-start">
                  
                  {/* Column 1: Brand Logo & Tagline */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/logo-shiuli.png" 
                        alt="Shiuli Logo" 
                        className="h-14 sm:h-16 w-auto object-contain" 
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-[#FFFFFF] tracking-tight leading-none mb-1 font-serif">
                          শিউলি
                        </h2>
                        <p className="text-xs text-[#E5B05C] font-medium font-serif">
                          কলকাতার পুজো সঙ্গী
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#F7F2E7]/85 leading-relaxed max-w-xs font-serif">
                      কলকাতার পুজোকে আরও কাছে থেকে আনতে ও জানতে আমাদের সাথে থাকুন।
                    </p>

                    {/* Social Icons */}
                    <div className="flex items-center gap-3 pt-1">
                      <a href="#" className="w-9 h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318]" aria-label="Facebook">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </a>
                      <a href="#" className="w-9 h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318]" aria-label="Instagram">
                        <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                      </a>
                      <a href="#" className="w-9 h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318]" aria-label="YouTube">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#2A090C"/></svg>
                      </a>
                      <a href="#" className="w-9 h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318]" aria-label="Twitter">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                      </a>
                    </div>
                  </div>

                  {/* Column 2: দ্রুত লিঙ্ক */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#FFFFFF] tracking-wide font-serif">
                      দ্রুত লিঙ্ক
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-[#F7F2E7]/80 font-serif">
                      <li><button onClick={() => setView('home')} className="hover:text-[#E5B05C] transition-colors">হোম</button></li>
                      <li><a href="#pujaparba" className="hover:text-[#E5B05C] transition-colors">পুজোপার্ব</a></li>
                      <li><a href="#stories" className="hover:text-[#E5B05C] transition-colors">কলকাতার গল্প</a></li>
                      <li><a href="#search" className="hover:text-[#E5B05C] transition-colors">সন্ধান</a></li>
                      <li><a href="#gallery" className="hover:text-[#E5B05C] transition-colors">গ্যালারি</a></li>
                      <li><a href="#contact" className="hover:text-[#E5B05C] transition-colors">যোগাযোগ</a></li>
                    </ul>
                  </div>

                  {/* Column 3: গুরুত্বপূর্ণ লিঙ্ক */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#FFFFFF] tracking-wide font-serif">
                      গুরুত্বপূর্ণ লিঙ্ক
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-[#F7F2E7]/80 font-serif">
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">প্রাইভেসি পলিসি</a></li>
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">টার্মস & কন্ডিশনস</a></li>
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">FAQ</a></li>
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">সাইট ম্যাপ</a></li>
                    </ul>
                  </div>

                  {/* Column 4: যোগাযোগ */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#FFFFFF] tracking-wide font-serif">
                      যোগাযোগ
                    </h3>
                    <ul className="space-y-3 text-xs sm:text-sm text-[#F7F2E7]/85 font-serif">
                      <li className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[#E5B05C] flex-shrink-0" />
                        <span className="font-sans">info@shiuli.in</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[#E5B05C] flex-shrink-0" />
                        <span className="font-sans">+91 98765 43210</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#E5B05C] flex-shrink-0" />
                        <span>কলকাতা, পশ্চিমবঙ্গ, ভারত</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-[#581318] my-6" />

                {/* Bottom Copyright & Credits */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F2E7]/75 font-serif">
                  <div>
                    © 2024 শিউলি | সর্বস্বত্ব সংরক্ষিত
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>ডিজাইন করা হয়েছে</span>
                    <Heart className="w-3.5 h-3.5 fill-[#C86040] text-[#C86040] inline mx-0.5" />
                    <span>কলকাতার জন্য</span>
                  </div>
                </div>

              </div>
            </footer>

          </main>
        )}
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
