import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  X,
  BookOpen,
  Clock,
  Quote,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { storiesData, type Story } from '../data/storyChronicles';

const StorySection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [activeStory, setActiveStory] = React.useState<Story | null>(null);

  const isBn = language === 'bn';

  const showDevToast = (title: string) => {
    const msg = isBn
      ? `"${title}" বিভাগটি বর্তমানে উন্নয়নাধীন`
      : `"${title}" story is currently Under Development`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStoryClick = (story: Story) => {
    if (story.isReady && (story.contentEn || story.contentBn)) {
      setActiveStory(story);
    } else {
      showDevToast(isBn ? story.titleBn : story.titleEn);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!activeStory) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStory(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStory]);

  const renderParagraphContent = (text: string, pIdx: number) => {
    // Check if this is a bulleted list
    if (text.includes('•') || text.startsWith('- ')) {
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      return (
        <div key={pIdx} className="my-4 space-y-2 pl-2 sm:pl-3 border-l-2 border-[#D4A24C]/60">
          {lines.map((line, lIdx) => {
            const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
            return (
              <div key={lIdx} className="flex items-start gap-2.5 text-sm sm:text-[15.5px] text-[#3D2C22] font-serif leading-relaxed">
                <span className="text-[#8C242B] font-bold text-xs mt-1.5 select-none">✦</span>
                <span className="flex-1 font-serif">{cleanLine}</span>
              </div>
            );
          })}
        </div>
      );
    }

    // Check if this is a quote / callout conclusion in English or Bengali
    const isSpecialCallout = 
      text.includes('Guptipara was a crucial birthplace') ||
      text.includes('That makes the history of Barowari Puja more than a story about twelve friends') ||
      text.includes('It is the story of a festival changing its address') ||
      text.includes('During Durga Puja, it can be all of them') ||
      text.includes('They are memories designed in three dimensions') ||
      text.includes('Our daughter is coming home') ||
      text.includes('when an old radio voice begins the story again') ||
      text.includes('Because in Kumartuli, the end of one Goddess is already the beginning of the next') ||
      text.includes('Aaschhe bochhor abar hobe') ||
      text.includes('Come home again') ||
      text.includes('গুপ্তিপাড়া ছিল আঠারো শতকের') ||
      text.includes('বারোয়ারি পুজোর ইতিহাস কেবল বারোজন বন্ধুর') ||
      text.includes('ঠিকানা বদলের ঐতিহাসিক মহাকাব্য') ||
      text.includes('এই সবকটিরই এক অবিশ্বাস্য যুগলবন্দি') ||
      text.includes('তারা ত্রিমাত্রিক স্মৃতি') ||
      text.includes('আমাদের মেয়ে ঘরে ফিরছে') ||
      text.includes('পুরনো রেডিওর কণ্ঠস্বর') ||
      text.includes('একটি প্রতিমার সমাপ্তি আসলে পরবর্তী প্রতিমার সূচনা') ||
      text.includes('আসছে বছর আবার হবে') ||
      text.includes('নিরাপদে যেও, আবার এসো আমাদের ঘরে');

    if (isSpecialCallout) {
      return (
        <div 
          key={pIdx} 
          className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF5F6] via-[#FAF1E4] to-[#FFF8EE] border border-[#E8B8C0]/80 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-[#8C242B]/70 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-serif font-medium text-[#5C1117] leading-relaxed italic whitespace-pre-line">
                {text}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <p 
        key={pIdx} 
        className="text-sm sm:text-[15.5px] md:text-base leading-[1.8] text-[#3D2C22]/90 whitespace-pre-line font-serif"
      >
        {text}
      </p>
    );
  };

  // Active story content for current language
  const activeContent = activeStory 
    ? ((isBn ? activeStory.contentBn : activeStory.contentEn) || activeStory.contentEn)
    : null;

  return (
    <section className="pt-16 md:pt-24 pb-28 md:pb-36 bg-[#F8F1E7] text-[#3D2C22] relative overflow-visible z-10" id="stories">

      {/* Background Ambience Image */}
      <div
        className="absolute inset-0 bg-[url('/kolkatastory.webp')] bg-no-repeat bg-[length:100%_100%] pointer-events-none z-0 opacity-70"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 85%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 85%)',
        }}
      />

      {/* Ornate Shiuli Section Divider */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none select-none px-0 sm:px-4 -translate-y-1/2">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-[#D4A24C]/10 via-[#D4A24C]/60 to-[#D4A24C]/10 w-full sm:hidden" />
        <img
          src="/section-divider.webp"
          alt="Section Divider"
          className="w-full max-w-none sm:max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-[90rem] h-auto object-contain drop-shadow-md opacity-100 scale-105 sm:scale-100 relative z-10"
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-[#3D1418] text-[#FAF5EC] px-5 py-3 rounded-2xl shadow-2xl border border-[#DFB86C]/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 font-serif text-xs sm:text-sm">
          <span className="text-[#DFB86C]">❁</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="max-w-[94vw] xl:max-w-[1700px] mx-auto px-4 md:px-8 relative z-10 flex flex-col items-center justify-center text-center mb-10 md:mb-12">

        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#7A1F26] font-bold tracking-tight text-center">
            {t.storySectionTitle}
          </h2>
          {/* Ornamental Underline */}
          <div className="flex items-center justify-center gap-1.5 opacity-80">
            <div className="h-px w-10 sm:w-12 bg-[#7A1F26]" />
            <span className="text-[#7A1F26] text-[10px]">✦</span>
            <span className="text-[#7A1F26] text-sm leading-none">❂</span>
            <span className="text-[#7A1F26] text-[10px]">✦</span>
            <div className="h-px w-10 sm:w-12 bg-[#7A1F26]" />
          </div>
        </div>

        <div className="mt-4 md:mt-0 md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2">
          <button
            onClick={() => showDevToast(t.storySectionTitle)}
            className="px-4.5 py-2 rounded-full border border-[#A0353A]/40 text-[#7A1F26] font-serif text-xs sm:text-sm hover:bg-[#A0353A]/5 transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
          >
            <span>{isBn ? 'ঐতিহ্য সংকলন' : 'Puja Heritage Archive'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* Carousel Area */}
      <div className="max-w-[94vw] xl:max-w-[1700px] mx-auto relative px-4 md:px-8 group/carousel">

        {/* Navigation Arrows - Only on Mobile/Tablet where horizontal scroll is needed */}
        <button
          onClick={scrollLeft}
          className="lg:hidden absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-xl hover:bg-[#8B1E2D] hover:scale-105 active:scale-95 transition-all z-20 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 cursor-pointer"
          aria-label="Previous story"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={scrollRight}
          className="lg:hidden absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-xl hover:bg-[#8B1E2D] hover:scale-105 active:scale-95 transition-all z-20 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 cursor-pointer"
          aria-label="Next story"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel Row: Horizontal scroll on mobile/tablet, Exactly 5 in a row on Desktop */}
        <div
          ref={scrollContainerRef}
          className="flex lg:grid lg:grid-cols-5 gap-4 md:gap-5 overflow-x-auto lg:overflow-visible pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storiesData.map((story) => (
            <div
              key={story.id}
              onClick={() => handleStoryClick(story)}
              className={`flex-none w-[280px] sm:w-[320px] lg:w-auto snap-center flex flex-col justify-between rounded-2xl md:rounded-3xl p-4 md:p-5 border transition-all duration-500 relative overflow-hidden group shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer ${story.cardBg} ${story.cardBorder} ${story.cardBorderHover}`}
            >
              {/* Inner Inset Hairline Border for Premium Aesthetic */}
              <div className={`absolute inset-1.5 rounded-[18px] md:rounded-[22px] border ${story.innerBorder} pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100`} />

              {/* Watermark Heritage Icon in Corner */}
              <div 
                className={`absolute -bottom-6 -right-6 w-32 h-32 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 ${story.watermarkColor} opacity-40`}
              >
                <div className="w-full h-full flex items-center justify-center scale-[2.2]">
                  {story.icon}
                </div>
              </div>

              {/* Card Main Body */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                
                <div>
                  {/* Top Bar: Chapter Number & Status */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span 
                      className="font-serif text-xs md:text-sm font-bold tracking-[0.2em] uppercase"
                      style={{ color: story.accent }}
                    >
                      № {story.num}
                    </span>

                    {story.isReady ? (
                      <div 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-serif font-semibold border"
                        style={{ 
                          color: story.accent,
                          backgroundColor: `${story.accent}12`,
                          borderColor: `${story.accent}30`
                        }}
                      >
                        <BookOpen className="w-2.5 h-2.5" />
                        <span>{isBn ? 'উপলব্ধ' : 'Available'}</span>
                      </div>
                    ) : (
                      <div 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-serif font-semibold border"
                        style={{ 
                          color: story.accent,
                          backgroundColor: `${story.accent}0D`,
                          borderColor: `${story.accent}25`
                        }}
                      >
                        <span className="text-[8px]">✦</span>
                        <span>{isBn ? 'উন্নয়নাধীন' : 'Under Dev'}</span>
                      </div>
                    )}
                  </div>

                  {/* Icon Medallion & Category Badge */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div 
                      className="w-9 h-9 rounded-lg flex items-center justify-center shadow-2xs transition-transform duration-500 group-hover:scale-105 border"
                      style={{ 
                        backgroundColor: `${story.accent}12`,
                        borderColor: `${story.accent}30`
                      }}
                    >
                      {story.icon}
                    </div>
                    <span 
                      className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-serif font-semibold border ${story.badgeBg} ${story.badgeBorder}`}
                      style={{ color: story.accent }}
                    >
                      {isBn ? story.tagBn : story.tagEn}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`text-base md:text-lg font-serif font-bold ${story.titleColor} tracking-tight leading-snug transition-colors mb-2 line-clamp-2`}>
                    {isBn ? story.titleBn : story.titleEn}
                  </h3>

                  {/* Ornamental Hairline Flourish */}
                  <div className="flex items-center gap-2 mb-2.5 opacity-60">
                    <div 
                      className="h-[0.75px] w-5" 
                      style={{ backgroundColor: story.flourishColor }}
                    />
                    <span 
                      className="text-[8px]"
                      style={{ color: story.flourishColor }}
                    >
                      ✦
                    </span>
                    <div 
                      className="h-[0.75px] flex-1 bg-gradient-to-r"
                      style={{ 
                        backgroundImage: `linear-gradient(to right, ${story.flourishColor}, transparent)` 
                      }}
                    />
                  </div>

                  {/* Story Excerpt */}
                  <p className="text-[12px] md:text-[12.5px] text-[#4A3B32] font-serif leading-relaxed line-clamp-3">
                    {isBn ? story.descBn : story.descEn}
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div 
                  className="pt-2.5 border-t mt-3"
                  style={{ borderColor: `${story.accent}20` }}
                >
                  <div className={`w-full py-2 px-3 rounded-lg flex items-center justify-between text-[11.5px] md:text-xs font-serif font-bold ${story.btnText} ${story.btnBg} ${story.btnHoverBg} transition-all duration-300 shadow-2xs cursor-pointer`}>
                    <span>{t.readStory || (isBn ? 'গল্প পড়ুন' : 'Read Story')}</span>
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Render Story Reading Modal via React Portal directly into document.body to ensure top-level stacking & no scroll-bleed */}
      {activeStory && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-250 select-none"
          onClick={() => setActiveStory(null)}
        >
          <div 
            className="bg-[#FAF5EC] border-2 border-[#DFB86C] w-full max-w-3xl h-[88vh] sm:h-[85vh] rounded-2xl md:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Ornamental Sticky Header Bar */}
            <div 
              className="px-5 sm:px-7 py-3.5 sm:py-4 border-b flex items-center justify-between relative shadow-xs shrink-0 z-20"
              style={{ 
                backgroundColor: `${activeStory.accent}0D`,
                borderColor: `${activeStory.accent}25` 
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span 
                  className="font-serif text-xs sm:text-sm font-bold tracking-[0.25em] uppercase"
                  style={{ color: activeStory.accent }}
                >
                  № {activeStory.num}
                </span>
                <span className="text-[#8C7A6B] text-xs">•</span>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-serif font-semibold border shadow-2xs"
                  style={{ 
                    color: activeStory.accent,
                    backgroundColor: `${activeStory.accent}15`,
                    borderColor: `${activeStory.accent}35`
                  }}
                >
                  {isBn ? activeStory.tagBn : activeStory.tagEn}
                </span>
              </div>

              {/* Action Buttons: Language Switcher + Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage(isBn ? 'en' : 'bn')}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-serif font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 bg-white/80"
                  style={{
                    color: activeStory.accent,
                    borderColor: `${activeStory.accent}40`,
                  }}
                  title={isBn ? "Switch language to English" : "বাংলায় পড়ুন"}
                  aria-label="Toggle language"
                >
                  <Globe className="w-3 h-3 text-[#D4A24C]" />
                  <span className="tracking-wide">{isBn ? 'English' : 'বাংলা'}</span>
                </button>

                <button
                  onClick={() => setActiveStory(null)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#5C1117] hover:bg-[#7A1F26]/12 active:scale-95 transition-all cursor-pointer border border-[#7A1F26]/20 bg-white/80 shadow-2xs"
                  aria-label="Close story"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Story Content Container (Isolated Scroll) */}
            <div 
              className="flex-1 p-5 sm:p-8 md:p-10 overflow-y-auto space-y-7 font-serif text-[#3D2C22] overscroll-contain"
              style={{ scrollbarWidth: 'thin', scrollbarColor: `${activeStory.accent}60 #FAF1E4` }}
            >
              {/* Header inside modal */}
              <div className="space-y-3 pb-6 border-b border-[#DFB86C]/40 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 text-xs text-[#8C7A6B] uppercase tracking-wider font-semibold">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeStory.accent }} />
                  <span>{t.storyChronicleHeader || (isBn ? 'কলকাতা পুজো ঐতিহ্য ইতিবৃত্ত' : 'Kolkata Puja Heritage Chronicle')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-[#7A1F26] leading-tight tracking-tight">
                  {isBn ? activeStory.titleBn : activeStory.titleEn}
                </h1>
                {activeContent?.subtitle && (
                  <p className="text-sm sm:text-base md:text-lg italic text-[#6E5545] font-serif leading-snug">
                    {activeContent.subtitle}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-[#8C7A6B] pt-2 justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4A24C]" /> {t.storyReadTime || (isBn ? '৪ মিনিট পাঠ' : '4 min read')}
                  </span>
                  <span>•</span>
                  <span>{t.storyArchivalBadge || (isBn ? 'প্রামাণ্য ঐতিহাসিক মহাফেজখানা' : 'Authentic Archival Records')}</span>
                </div>
              </div>

              {/* Story Sections with Custom Formatting */}
              {activeContent?.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4 pt-1">
                  {section.heading && (
                    <div className="pt-3 pb-1 border-b border-[#DFB86C]/20">
                      <h2 className="text-lg sm:text-xl font-bold font-serif text-[#8C242B] flex items-center gap-2.5">
                        <span className="text-sm text-[#D4A24C] select-none">❂</span>
                        <span>{section.heading}</span>
                      </h2>
                    </div>
                  )}
                  {section.text.map((paragraph, pIdx) => renderParagraphContent(paragraph, pIdx))}
                </div>
              ))}

              {/* End Flourish */}
              <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center space-y-2 text-[#7A1F26]/75">
                <div className="flex items-center gap-3">
                  <div className="h-px w-16 bg-[#7A1F26]/30" />
                  <span className="text-sm text-[#D4A24C]">❂ ❁ ❂</span>
                  <div className="h-px w-16 bg-[#7A1F26]/30" />
                </div>
                <p className="text-xs tracking-wider uppercase font-serif text-[#8C7A6B] font-semibold">
                  {t.storySeriesFooter || (isBn ? 'শিউলি • পুজো ঐতিহ্য আখ্যানমালা' : 'Shiuli • PujoPoth Heritage Story Series')}
                </p>
              </div>
            </div>

            {/* Modal Footer with Scroll Hint & Close Button */}
            <div className="px-5 sm:px-7 py-3 border-t border-[#DFB86C]/40 bg-[#FAF1E4] flex items-center justify-between shrink-0 z-20">
              <span className="text-xs text-[#7C6352] italic font-serif hidden sm:inline">
                {t.storyScrollHint || (isBn ? 'সম্পূর্ণ অধ্যায় পড়তে নিচে স্ক্রোল করুন' : 'Scroll inside to read complete chapter')}
              </span>
              <span className="text-xs text-[#7C6352] italic font-serif sm:hidden">
                {t.storyScrollHintMobile || (isBn ? 'আরও পড়তে উপরে সোয়াইপ করুন' : 'Swipe up to read more')}
              </span>
              <button
                onClick={() => setActiveStory(null)}
                className="px-5 py-2 rounded-xl bg-[#7A1F26] text-white text-xs sm:text-sm font-serif font-bold hover:bg-[#5C1117] active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {t.storyCloseBtn || (isBn ? 'বন্ধ করুন' : 'Close Article')}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </section>
  );
};

export default StorySection;
