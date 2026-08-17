import { useState, useEffect, lazy, Suspense } from 'react';
import HeroSection from './components/HeroSection';
import PujaGuideSection from './components/PujaGuideSection';
import SectionDivider from './components/SectionDivider';

import { Heart, WifiOff, Mail, Phone, MapPin } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
const MedicalFacilitiesSection = lazy(() => import('./components/MedicalFacilitiesSection'));

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

type ViewType = 'home' | 'north' | 'south' | 'central' | 'bonedi' | 'facilities' | 'route-planner' | 'medical' | 'admin';

const VALID_VIEWS: ViewType[] = ['home', 'north', 'south', 'central', 'bonedi', 'facilities', 'route-planner', 'medical', 'admin'];

function AppContent() {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [view, setViewState] = useState<ViewType>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin')) return 'admin';
    const v = params.get('view') as ViewType;
    return v && VALID_VIEWS.includes(v) ? v : 'home';
  });
  const [_searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Navigate to a new view & push state to browser history
  const changeView = (newView: ViewType, replace = false) => {
    if (newView === view && !replace) return;
    setViewState(newView);
    const searchParams = new URLSearchParams(window.location.search);
    if (newView === 'home') {
      searchParams.delete('view');
    } else {
      searchParams.set('view', newView);
    }
    const newSearch = searchParams.toString();
    const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;

    if (replace) {
      window.history.replaceState({ view: newView }, '', newUrl);
    } else {
      window.history.pushState({ view: newView }, '', newUrl);
    }
  };

  // Handle Back button action (pops browser history or returns home)
  const handleBack = () => {
    if (window.history.state && window.history.state.view && window.history.state.view !== 'home') {
      window.history.back();
    } else {
      changeView('home');
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize window history state if missing
    const searchParams = new URLSearchParams(window.location.search);
    const currentView = (searchParams.get('view') as ViewType) || (searchParams.has('admin') ? 'admin' : 'home');
    if (!window.history.state) {
      window.history.replaceState({ view: currentView }, '', window.location.href);
    }

    // Listen to browser Back & Forward button events (popstate)
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view && VALID_VIEWS.includes(e.state.view)) {
        setViewState(e.state.view);
      } else {
        const params = new URLSearchParams(window.location.search);
        const v = params.get('view') as ViewType;
        setViewState(v && VALID_VIEWS.includes(v) ? v : 'home');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);


  return (
    <div className="min-h-screen bg-paper relative font-sans text-ink flex flex-col selection:bg-bengali-red/20 selection:text-ink">
      <InitialLanguageModal />
      <BetaModal />

      {/* Sticky Floating Beta Badge */}
      <div className="fixed bottom-4 right-4 z-40 bg-[#7A1F26]/95 text-[#FAF6ED] border border-[#D4A24C]/40 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xl flex items-center gap-2 backdrop-blur-md select-none pointer-events-auto">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A24C] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4A24C]"></span>
        </span>
        <span>BETA VERSION</span>
      </div>

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

            {/* Left: Brand Logo */}
            <div
              onClick={() => changeView('home')}
              className="pointer-events-auto cursor-pointer group flex items-center gap-2"
            >
              <img
                src="/logo-shiuli.png"
                alt="Shiuli Logo"
                className="h-12 sm:h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-md"
              />
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
                  onClick={handleBack}
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
          <AdminPanel onBack={handleBack} />
        ) : (
          <main className="w-full relative">
            {view === 'north' ? (
              <NorthCalcuttaSection onBack={handleBack} />
            ) : view === 'south' ? (
              <SouthCalcuttaSection onBack={handleBack} />
            ) : view === 'central' ? (
              <CentralCalcuttaSection onBack={handleBack} />
            ) : view === 'bonedi' ? (
              <BonediCalcuttaSection onBack={handleBack} />
            ) : view === 'facilities' ? (
              <FacilitiesSection onBack={handleBack} />
            ) : view === 'route-planner' ? (
              <RoutePlanner onBack={handleBack} />
            ) : view === 'medical' ? (
              <MedicalFacilitiesSection onBack={handleBack} />
            ) : (
              <>
                <HeroSection
                  onSearch={setSearchQuery}
                  onFilterChange={setActiveFilter}
                  activeFilter={activeFilter}
                  onSelectZone={(zone) => changeView(zone as ViewType)}
                  onSelectFacilities={() => changeView('facilities')}
                />

                <SectionDivider />

                {/* CONTENT SECTION */}
                <div className="w-full">
                  <PujaGuideSection
                    onSelectRoutePlanner={() => changeView('route-planner')}
                    onSelectFacilities={() => changeView('facilities')}
                    onSelectMedical={() => changeView('medical')}
                  />

                  <StorySection />
                </div>
              </>
            )}

            {/* Footer Design - Mobile & Desktop Responsive Backgrounds */}
            <footer
              className="bg-[#3D0D11] text-[#F7F2E7] -mt-12 sm:-mt-16 md:-mt-20 pt-36 sm:pt-44 md:pt-48 lg:pt-56 pb-12 sm:pb-16 relative z-20 font-serif bg-top bg-no-repeat bg-[url('/footer-mobile.png')] md:bg-[url('/footer.png')] min-h-[180vw] md:min-h-[52.6vw]"
              style={{
                backgroundColor: '#3D0D11',
                backgroundSize: '100% auto',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 30px)',
                maskImage: 'linear-gradient(to bottom, transparent 0px, black 30px)',
              }}
            >
              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-4 sm:pt-6">

                {/* Main 4-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 items-start">

                  {/* Column 1: Brand Logo & Tagline */}
                  <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3">
                      <img
                        src="/logo-shiuli.png"
                        alt="Shiuli Logo"
                        className="h-12 sm:h-16 w-auto object-contain"
                      />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#FFFFFF] tracking-tight leading-none mb-1 font-serif">
                          {isBn ? 'শিউলি' : 'Shiuli'}
                        </h2>
                        <p className="text-[11px] sm:text-xs text-[#E5B05C] font-medium font-serif">
                          {isBn ? 'কলকাতার পুজো সঙ্গী' : 'Kolkata Puja Companion'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#F7F2E7]/85 leading-relaxed max-w-xs font-serif">
                      {isBn
                        ? 'কলকাতার ঐতিহ্যবাহী দুর্গাপুজো পরিক্রমা, প্যান্ডেল গাইড ও সেরা রুট প্ল্যানিংয়ের ডিজিটাল মাধ্যম।'
                        : 'Digital companion for exploring historic Durga Pujas, pandal guides, and smart route planning in Kolkata.'}
                    </p>
                  </div>

                  {/* Column 2: পুজো অঞ্চল গাইড */}
                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-bold text-[#E5B05C] tracking-wide font-serif">
                      {isBn ? 'পুজো অঞ্চল গাইড' : 'Puja Zone Guide'}
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-[#F7F2E7]/85 font-serif">
                      <li><button onClick={() => changeView('north')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'উত্তর কলকাতা পরিক্রমা' : 'North Kolkata Tour'}</button></li>
                      <li><button onClick={() => changeView('south')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'দক্ষিণ কলকাতা পরিক্রমা' : 'South Kolkata Tour'}</button></li>
                      <li><button onClick={() => changeView('central')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'মধ্য কলকাতা পরিক্রমা' : 'Central Kolkata Tour'}</button></li>
                      <li><button onClick={() => changeView('bonedi')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'ঐতিহ্যবাহী বনেদি বাড়ির পুজো' : 'Traditional Bonedi Bari Pujas'}</button></li>
                      <li><button onClick={() => changeView('route-planner')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'স্মার্ট রুট প্ল্যানার' : 'Smart Route Planner'}</button></li>
                    </ul>
                  </div>

                  {/* Column 3: সেবা ও সহায়িকা */}
                  <div className="space-y-3">
                    <h3 className="text-sm sm:text-base font-bold text-[#E5B05C] tracking-wide font-serif">
                      {isBn ? 'সেবা ও সহায়িকা' : 'Services & Guide'}
                    </h3>
                    <ul className="space-y-2 text-xs sm:text-sm text-[#F7F2E7]/85 font-serif">
                      <li><button onClick={() => changeView('medical')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'জরুরি চিকিৎসা সেবা' : 'Emergency Medical Services'}</button></li>
                      <li><button onClick={() => changeView('facilities')} className="hover:text-[#E5B05C] transition-colors text-left">{isBn ? 'রেস্তোরাঁ ও সুবিধা' : 'Food & Amenities'}</button></li>
                      <li>
                        <button
                          onClick={() => {
                            changeView('home');
                            setTimeout(() => {
                              document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="hover:text-[#E5B05C] transition-colors text-left"
                        >
                          {isBn ? 'কলকাতার পুজো ইতিহাস' : 'Kolkata Puja History'}
                        </button>
                      </li>
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">{isBn ? 'প্রাইভেসি পলিসি' : 'Privacy Policy'}</a></li>
                      <li><a href="#" className="hover:text-[#E5B05C] transition-colors">{isBn ? 'টার্মস & কন্ডিশনস' : 'Terms & Conditions'}</a></li>
                    </ul>
                  </div>

                  {/* Column 4: যোগাযোগ & সোশ্যাল লিঙ্ক */}
                  <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                    <h3 className="text-sm sm:text-base font-bold text-[#E5B05C] tracking-wide font-serif">
                      {isBn ? 'যোগাযোগ' : 'Contact Us'}
                    </h3>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-[#F7F2E7]/85 font-serif">
                      <li className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-[#E5B05C] flex-shrink-0" />
                        <a href="mailto:officialronojoy03@gmail.com" className="hover:text-[#E5B05C] transition-colors font-sans truncate">
                          officialronojoy03@gmail.com
                        </a>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-[#E5B05C] flex-shrink-0" />
                        <span>{isBn ? 'কলকাতা, পশ্চিমবঙ্গ, ভারত' : 'Kolkata, West Bengal, India'}</span>
                      </li>
                    </ul>

                    {/* Social Icons - Placed Under Contact Section */}
                    <div className="pt-2">
                      <p className="text-[11px] text-[#E5B05C] mb-2 font-serif font-medium">
                        {isBn ? 'সোশ্যাল মিডিয়া:' : 'Follow Me:'}
                      </p>
                      <div className="flex items-center gap-3">
                        <a
                          href="https://www.facebook.com/share/1DTxLYsnmc/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318] hover:border-[#E5B05C]/60 active:scale-95"
                          aria-label="Facebook"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        </a>
                        <a
                          href="https://instagram.com/monoc_"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2A090C] hover:bg-[#581318] flex items-center justify-center text-[#F7F2E7] transition-all border border-[#581318] hover:border-[#E5B05C]/60 active:scale-95"
                          aria-label="Instagram"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                        </a>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Centered Newsletter Subscription Box in Lower Portion */}
                <div className="my-8 max-w-xl mx-auto text-center bg-[#2A090C]/90 border border-[#E5B05C]/30 p-5 sm:p-6 rounded-2xl shadow-xl backdrop-blur-md">
                  <h4 className="text-sm sm:text-base font-bold text-[#E5B05C] mb-1.5 font-serif flex items-center justify-center gap-2">
                    <span>❁</span>
                    <span>{isBn ? 'পুজোর আপডেট পেতে সাবস্ক্রাইব করুন' : 'Subscribe for Durga Puja Updates'}</span>
                    <span>❁</span>
                  </h4>
                  <p className="text-xs text-[#F7F2E7]/80 mb-3.5 font-serif">
                    {isBn
                      ? 'কলকাতার সেরা পুজো গাইড, ট্রাফিক ও আরতি পরিক্রমার সব খবর সরাসরি আপনার ইমেইলে'
                      : 'Get the latest pandal guides, traffic updates, and cultural stories directly in your inbox'}
                  </p>
                  <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder={isBn ? 'আপনার ইমেইল ঠিকানা...' : 'Your email address...'}
                      className="bg-[#1A0507] border border-[#581318] text-[#F7F2E7] text-xs sm:text-sm px-3.5 py-2 rounded-lg focus:outline-none focus:border-[#E5B05C] w-full font-serif placeholder:text-[#F7F2E7]/40 shadow-inner"
                    />
                    <button className="bg-[#7A1F26] hover:bg-[#A0353A] border border-[#E5B05C]/50 text-[#F7F2E7] text-xs sm:text-sm px-4 py-2 rounded-lg font-serif font-bold transition-all shrink-0 shadow-md active:scale-95 cursor-pointer">
                      {isBn ? 'যুক্ত হন' : 'Subscribe'}
                    </button>
                  </div>
                </div>

                {/* Popular Pujas Chips Row */}
                <div className="border-t border-[#581318] pt-6 mb-8">
                  <p className="text-xs font-bold text-[#E5B05C] mb-3 font-serif">
                    {isBn ? 'জনপ্রিয় পুজো পরিক্রমা:' : 'Popular Puja Tours:'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-serif text-[#F7F2E7]/80">
                    {[
                      { name: isBn ? 'বাগবাজার সার্বজনীন' : 'Bagbazar Sarbojanin', view: 'north' },
                      { name: isBn ? 'একডালিয়া এভারগ্রীন' : 'Ekdalia Evergreen', view: 'south' },
                      { name: isBn ? 'সুরুচি সংঘ' : 'Suruchi Sangha', view: 'south' },
                      { name: isBn ? 'শ্রীভূমি স্পোর্টিং' : 'Sreebhumi Sporting', view: 'north' },
                      { name: isBn ? 'চেতলা অগ্রণী' : 'Chetla Agrani', view: 'south' },
                      { name: isBn ? 'ছাতুবাবু লাহা বাড়ি' : 'Chhatubabu Laha Bari', view: 'bonedi' },
                      { name: isBn ? 'শোভাবাজার রাজবাড়ি' : 'Shovabazar Rajbari', view: 'bonedi' },
                      { name: isBn ? 'মোহাম্মদ আলী পার্ক' : 'Mohammad Ali Park', view: 'central' },
                      { name: isBn ? 'মুদিয়ালি ক্লাব' : 'Mudiali Club', view: 'south' },
                      { name: isBn ? 'বালিগঞ্জ কালচারাল' : 'Ballygunge Cultural', view: 'south' },
                    ].map((puja, idx) => (
                      <button
                        key={idx}
                        onClick={() => changeView(puja.view as ViewType)}
                        className="bg-[#2A090C]/80 hover:bg-[#581318] hover:text-[#E5B05C] border border-[#581318] px-2.5 py-1 rounded-full text-[11px] transition-colors text-left cursor-pointer"
                      >
                        ❁ {puja.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Copyright & Credits - Positioned below the gold line of footer artwork */}
                <div className="mt-[16vw] sm:mt-[14vw] md:mt-[12vw] lg:mt-[10vw] pt-2 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F2E7]/85 font-serif">
                  <div>
                    {isBn ? '© 2024 শিউলি | সর্বস্বত্ব সংরক্ষিত' : '© 2024 Shiuli | All Rights Reserved'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{isBn ? 'ডিজাইন ও ডেভেলপ করা হয়েছে' : 'Designed & Developed with'}</span>
                    <Heart className="w-3.5 h-3.5 fill-[#C86040] text-[#C86040] inline mx-0.5" />
                    <span>{isBn ? 'কলকাতার জন্য' : 'for Kolkata'}</span>
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
