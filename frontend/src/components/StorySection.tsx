import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Story {
  id: string;
  tagBn: string;
  tagEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  image: string;
}

const storiesData: Story[] = [
  {
    id: 's1',
    tagBn: 'ঐতিহ্য',
    tagEn: 'Heritage',
    titleBn: 'বারোয়ারি সার্বজনীন',
    titleEn: 'Barowari Public Pujas',
    descBn: 'কীভাবে শুরু হল কলকাতার বারোয়ারি পুজোর ইতিহাস? জানুন সেই গল্প...',
    descEn: 'How community Pujas originated in historic Kolkata...',
    image: '/bagbazar-vintage.png',
  },
  {
    id: 's2',
    tagBn: 'সংস্কৃতি',
    tagEn: 'Culture',
    titleBn: 'প্যান্ডেল ডিজাইনের বিবর্তন',
    titleEn: 'Evolution of Pandal Design',
    descBn: 'সময়ের সাথে সাথে বদলে যাওয়া প্যান্ডেল তৈরির এক পর্যালোচনা।',
    descEn: 'A retrospective on how pandal artistry transformed over decades.',
    image: '/maddox-square-adda.png',
  },
  {
    id: 's3',
    tagBn: 'ভক্তি',
    tagEn: 'Devotion',
    titleBn: 'মায়ের আগমন',
    titleEn: 'Arrival of the Goddess',
    descBn: 'দেবীর বোধন থেকে বিসর্জন, আবেগ ভেজা কিছু মুহূর্ত।',
    descEn: 'Emotional glimpses from Bodhon to Dashami immersion.',
    image: '/kolkata-puja-night.png',
  },
  {
    id: 's4',
    tagBn: 'শিল্পকলা',
    tagEn: 'Artistry',
    titleBn: 'কুমোরটুলির কারিগর',
    titleEn: 'Artisans of Kumartuli',
    descBn: 'মাটির তাল থেকে অপরূপ প্রতিমা হয়ে ওঠার নেপথ্যের রূপকারদের কথা।',
    descEn: 'Stories of master sculptors shaping clay into divine idols.',
    image: '/bg_autumn.png',
  },
  {
    id: 's5',
    tagBn: 'উৎসব',
    tagEn: 'Festival',
    titleBn: 'বিজয়ার বিষাদ',
    titleEn: 'Nostalgia of Bijoya',
    descBn: 'পুজো শেষের মন খারাপ আর আগামী বছরের অপেক্ষায় থাকার গল্প।',
    descEn: 'Farewell feelings and waiting eagerly for next year.',
    image: '/kolkata-twilight.png',
  }
];

const StorySection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const isBn = language === 'bn';

  const showDevToast = (title: string) => {
    const msg = isBn
      ? `"${title}" বিভাগটি বর্তমানে উন্নয়নাধীন`
      : `"${title}" story is currently Under Development`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-16 md:pt-24 pb-28 md:pb-36 bg-[#F8F1E7] text-[#3D2C22] relative overflow-visible z-10" id="stories">

      {/* Background Image - 70% Opacity with Untouched Top Fade & Increased Bottom Fade */}
      <div
        className="absolute inset-0 bg-[url('/kolkatastory.png')] bg-no-repeat bg-[length:100%_100%] pointer-events-none z-0 opacity-70"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 85%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 85%)',
        }}
      />

      {/* Ornate Shiuli Section Divider - Full width edge-to-edge border on mobile */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pointer-events-none select-none px-0 sm:px-4 -translate-y-1/2">
        {/* Edge-to-Edge Gold Border Line - ONLY on mobile screens */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-[#D4A24C]/10 via-[#D4A24C]/60 to-[#D4A24C]/10 w-full sm:hidden" />

        <img
          src="/section-divider.png"
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
      <div className="max-w-[94vw] xl:max-w-[1700px] mx-auto px-4 md:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-12">

        <div className="text-left space-y-3 mb-6 md:mb-0">
          <h2 className="text-4xl md:text-5xl font-serif text-[#7A1F26] font-bold tracking-tight">
            {t.storySectionTitle}
          </h2>
          {/* Ornamental Underline */}
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="h-px w-10 bg-[#7A1F26]" />
            <span className="text-[#7A1F26] text-[10px]">✦</span>
            <span className="text-[#7A1F26] text-sm leading-none">❂</span>
            <span className="text-[#7A1F26] text-[10px]">✦</span>
            <div className="h-px w-10 bg-[#7A1F26]" />
          </div>
        </div>

        <button
          onClick={() => showDevToast(t.storySectionTitle)}
          className="px-5 py-2.5 rounded-md border border-[#A0353A]/40 text-[#7A1F26] font-serif text-sm hover:bg-[#A0353A]/5 transition-colors flex items-center gap-2 group cursor-pointer"
        >
          <span>{isBn ? 'উন্নয়নাধীন' : 'Under Development'}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

      </div>

      {/* Carousel Area */}
      <div className="max-w-[94vw] xl:max-w-[1700px] mx-auto relative px-4 md:px-8 group/carousel">

        {/* Navigation Arrows */}
        <button
          onClick={scrollLeft}
          className="absolute -left-3 md:-left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-lg hover:bg-[#8B1E2D] transition-all z-20 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
          aria-label="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#7A1F26] text-white flex items-center justify-center shadow-lg hover:bg-[#8B1E2D] transition-all z-20 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
          aria-label="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storiesData.map((story) => (
            <div
              key={story.id}
              onClick={() => showDevToast(isBn ? story.titleBn : story.titleEn)}
              className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.85rem)] lg:w-[calc(20%-1rem)] flex-none h-[320px] md:h-[400px] lg:h-[440px] relative rounded-xl lg:rounded-2xl overflow-hidden snap-center group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Top Right Under Development Badge */}
              <div className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-full text-[9px] font-serif font-medium text-white/90">
                {isBn ? 'উন্নয়নাধীন' : 'Under Development'}
              </div>

              {/* Background Image */}
              <img
                src={story.image}
                alt={isBn ? story.titleBn : story.titleEn}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
              />

              {/* Dark Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1616]/95 via-[#3D1E1E]/50 to-transparent pointer-events-none" />

              {/* Card Content */}
              <div className="absolute inset-0 p-4 md:p-6 lg:p-8 flex flex-col justify-end text-[#F8F1E7] z-10">

                {/* Tag */}
                <div className="mb-3 lg:mb-5">
                  <span className="inline-block px-2 lg:px-4 py-0.5 lg:py-1 text-[10px] lg:text-xs border border-[#F8F1E7]/30 rounded-full bg-[#7A1F26]/40 backdrop-blur-md font-serif font-medium">
                    {isBn ? story.tagBn : story.tagEn}
                  </span>
                </div>

                <h3 className="text-lg lg:text-2xl font-serif mb-2 lg:mb-3 text-white drop-shadow-lg tracking-wide">
                  {isBn ? story.titleBn : story.titleEn}
                </h3>

                <p className="hidden md:block text-[13px] lg:text-[15px] text-white/80 line-clamp-2 mb-4 lg:mb-6 font-serif leading-relaxed text-shadow-sm">
                  {isBn ? story.descBn : story.descEn}
                </p>

                <div className="flex items-center text-xs lg:text-sm font-serif text-[#F8F1E7]/80 group-hover:text-white transition-colors">
                  <span>{isBn ? 'উন্নয়নাধীন' : 'Under Development'}</span>
                  <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 ml-1.5 lg:ml-2 transition-transform group-hover:translate-x-1.5" />
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default StorySection;
