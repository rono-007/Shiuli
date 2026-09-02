import React, { useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Landmark, 
  Sparkles, 
  Flame, 
  Palette, 
  Hourglass 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Story {
  id: string;
  num: string;
  tagBn: string;
  tagEn: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  accent: string;
  titleColor: string;
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  innerBorder: string;
  badgeBg: string;
  badgeBorder: string;
  watermarkColor: string;
  flourishColor: string;
  btnBg: string;
  btnHoverBg: string;
  btnText: string;
  icon: React.ReactNode;
}

const storiesData: Story[] = [
  {
    id: 's1',
    num: '01',
    tagBn: 'ঐতিহ্য',
    tagEn: 'Heritage',
    titleBn: 'বারোয়ারি সার্বজনীন',
    titleEn: 'Barowari Public Pujas',
    descBn: 'কীভাবে শুরু হল কলকাতার বারোয়ারি পুজোর ইতিহাস? জানুন সেই সমৃদ্ধ রূপান্তরের অধ্যায়।',
    descEn: 'How community Pujas originated in historic Kolkata and transformed our cultural identity.',
    accent: '#7A1F26',
    titleColor: 'text-[#5C1117]',
    cardBg: 'bg-gradient-to-b from-[#FFF5F6] via-[#FDF0F2] to-[#FAE2E6]',
    cardBorder: 'border-[#E8B8C0]',
    cardBorderHover: 'hover:border-[#7A1F26]',
    innerBorder: 'border-[#7A1F26]/20',
    badgeBg: 'bg-[#FBE4E8]',
    badgeBorder: 'border-[#E8AAB4]',
    watermarkColor: 'text-[#7A1F26]/10',
    flourishColor: '#7A1F26',
    btnBg: 'bg-[#7A1F26]',
    btnHoverBg: 'hover:bg-[#5C1117]',
    btnText: 'text-white',
    icon: <Landmark className="w-4 h-4 text-[#7A1F26]" />
  },
  {
    id: 's2',
    num: '02',
    tagBn: 'সংস্কৃতি',
    tagEn: 'Culture',
    titleBn: 'প্যান্ডেল ডিজাইনের বিবর্তন',
    titleEn: 'Evolution of Pandal Design',
    descBn: 'সময়ের সাথে সাথে বদলে যাওয়া থিম পুজো ও শৈল্পিক স্থাপত্য তৈরির এক কালজয়ী পর্যালোচনা।',
    descEn: 'A retrospective on how pandal artistry and immersive installations evolved over decades.',
    accent: '#B86B12',
    titleColor: 'text-[#613603]',
    cardBg: 'bg-gradient-to-b from-[#FFFDF5] via-[#FFF8E6] to-[#FDF0D2]',
    cardBorder: 'border-[#EAD096]',
    cardBorderHover: 'hover:border-[#B86B12]',
    innerBorder: 'border-[#B86B12]/20',
    badgeBg: 'bg-[#FDF0D0]',
    badgeBorder: 'border-[#EAC678]',
    watermarkColor: 'text-[#B86B12]/10',
    flourishColor: '#B86B12',
    btnBg: 'bg-[#B86B12]',
    btnHoverBg: 'hover:bg-[#945209]',
    btnText: 'text-white',
    icon: <Sparkles className="w-4 h-4 text-[#B86B12]" />
  },
  {
    id: 's3',
    num: '03',
    tagBn: 'ভক্তি',
    tagEn: 'Devotion',
    titleBn: 'মায়ের আগমন ও বোধন',
    titleEn: 'Arrival of the Goddess',
    descBn: 'মহালয়ার ভোর থেকে শুরু করে ষষ্ঠীর বোধন — শহরের অলিতে গলিতে আবেগঘন ভক্তির স্মৃতি।',
    descEn: 'Sacred emotional glimpses from the dawn of Mahalaya to the solemn Bodhon rites.',
    accent: '#A62838',
    titleColor: 'text-[#5C0E1A]',
    cardBg: 'bg-gradient-to-b from-[#FFF6F7] via-[#FDF0F2] to-[#FCE2E5]',
    cardBorder: 'border-[#EAB8BE]',
    cardBorderHover: 'hover:border-[#A62838]',
    innerBorder: 'border-[#A62838]/20',
    badgeBg: 'bg-[#FDE4E8]',
    badgeBorder: 'border-[#EBA9B2]',
    watermarkColor: 'text-[#A62838]/10',
    flourishColor: '#A62838',
    btnBg: 'bg-[#A62838]',
    btnHoverBg: 'hover:bg-[#821826]',
    btnText: 'text-white',
    icon: <Flame className="w-4 h-4 text-[#A62838]" />
  },
  {
    id: 's4',
    num: '04',
    tagBn: 'শিল্পকলা',
    tagEn: 'Artistry',
    titleBn: 'কুমোরটুলির রূপকার',
    titleEn: 'Artisans of Kumartuli',
    descBn: 'গঙ্গার পলিমাটি থেকে চিন্ময়ী রূপ ফুটিয়ে তোলার নেপথ্যে নিভৃত শিল্পীদের অনন্য জীবনগাথা।',
    descEn: 'Stories of master clay sculptors breathing life and divinity into idols along the Hooghly.',
    accent: '#6E472D',
    titleColor: 'text-[#422716]',
    cardBg: 'bg-gradient-to-b from-[#FDF9F5] via-[#F8F1EA] to-[#EFE2D6]',
    cardBorder: 'border-[#D9C0AD]',
    cardBorderHover: 'hover:border-[#6E472D]',
    innerBorder: 'border-[#6E472D]/20',
    badgeBg: 'bg-[#F4E6DC]',
    badgeBorder: 'border-[#D1B5A3]',
    watermarkColor: 'text-[#6E472D]/10',
    flourishColor: '#6E472D',
    btnBg: 'bg-[#6E472D]',
    btnHoverBg: 'hover:bg-[#52321E]',
    btnText: 'text-white',
    icon: <Palette className="w-4 h-4 text-[#6E472D]" />
  },
  {
    id: 's5',
    num: '05',
    tagBn: 'উৎসব',
    tagEn: 'Festival',
    titleBn: 'বিজয়ার বিষাদ ও স্মৃতি',
    titleEn: 'Nostalgia of Bijoya',
    descBn: 'পুজো শেষের মিষ্টি বিষাদ, সিঁদুর খেলা আর হৃদয়ের গভীরে আগামী বছরের সুমধুর প্রতীক্ষা।',
    descEn: 'Poignant farewell sentiments, joyful Sindoor Khela, and eager anticipation for next autumn.',
    accent: '#8C2344',
    titleColor: 'text-[#540D23]',
    cardBg: 'bg-gradient-to-b from-[#FDF5F8] via-[#FBF0F4] to-[#F7DEEB]',
    cardBorder: 'border-[#E4B8D0]',
    cardBorderHover: 'hover:border-[#8C2344]',
    innerBorder: 'border-[#8C2344]/20',
    badgeBg: 'bg-[#F8DEEC]',
    badgeBorder: 'border-[#E1A5C4]',
    watermarkColor: 'text-[#8C2344]/10',
    flourishColor: '#8C2344',
    btnBg: 'bg-[#8C2344]',
    btnHoverBg: 'hover:bg-[#6B1430]',
    btnText: 'text-white',
    icon: <Hourglass className="w-4 h-4 text-[#8C2344]" />
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
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

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
            <span>{isBn ? 'উন্নয়নাধীন' : 'Under Development'}</span>
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

        {/* Cards Container: Horizontal Scroll on Mobile/Tablet, Clean 5-Column Grid on Laptop/PC */}
        <div
          ref={scrollContainerRef}
          className="flex lg:grid lg:grid-cols-5 gap-4 sm:gap-4.5 md:gap-5 lg:gap-4 xl:gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none pb-6 pt-3 hide-scrollbar justify-start lg:justify-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {storiesData.map((story) => (
            <div
              key={story.id}
              onClick={() => showDevToast(isBn ? story.titleBn : story.titleEn)}
              className={`w-[260px] sm:w-[280px] md:w-[300px] lg:w-full flex-none lg:flex-1 h-[375px] md:h-[395px] lg:h-[405px] relative rounded-2xl overflow-hidden snap-center lg:snap-align-none group cursor-pointer p-1.5 ${story.cardBg} border ${story.cardBorder} ${story.cardBorderHover} shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col`}
            >
              {/* Inner Framed Canvas */}
              <div className={`w-full h-full rounded-xl border ${story.innerBorder} bg-white/60 backdrop-blur-xs p-4 sm:p-4.5 md:p-5 flex flex-col justify-between relative overflow-hidden`}>

                {/* Themed Watermark */}
                <div className={`absolute -bottom-6 -right-6 ${story.watermarkColor} text-8xl font-serif select-none pointer-events-none group-hover:scale-110 transition-all duration-700`}>
                  ❂
                </div>

                {/* Top Section */}
                <div>
                  {/* Serial & Under Development Chip */}
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="font-serif text-[11px] font-bold tracking-[0.25em] uppercase"
                      style={{ color: story.accent }}
                    >
                      № {story.num}
                    </span>
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
                    <span>{isBn ? 'গল্প পড়ুন' : 'Read Story'}</span>
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

    </section>
  );
};

export default StorySection;
