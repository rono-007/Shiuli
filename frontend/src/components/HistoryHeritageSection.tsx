import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// --- Custom Intersection Observer Hook ---
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// --- Reveal Wrapper Component ---
const Reveal = ({ children, className = '', delay = 0, type = 'fade-up' }: { children: React.ReactNode, className?: string, delay?: number, type?: 'fade-up' | 'fade-in' }) => {
  const { ref, isVisible } = useScrollReveal();
  
  const baseClass = "transition-all duration-1000 ease-out";
  const hiddenClass = type === 'fade-up' ? "opacity-0 translate-y-12" : "opacity-0";
  const visibleClass = type === 'fade-up' ? "opacity-100 translate-y-0" : "opacity-100";
  
  return (
    <div 
      ref={ref} 
      className={`${baseClass} ${isVisible ? visibleClass : hiddenClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Fallback Archival Image Component ---
const ArchiveImageWithFallback = ({
  src,
  alt,
  className = '',
  loading = 'lazy'
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}) => {
  const [hasError, setHasError] = useState(false);
  const { language } = useLanguage();

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[160px] bg-[#2A0C12] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden border border-[#C9A45C]/30">
        <div className="absolute inset-0 bg-[#A64B32]/10 mix-blend-multiply pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-2 border border-[#C9A45C]/40 px-5 py-4 rounded bg-[#1e070b]/80 backdrop-blur-xs">
          <span className="text-xl text-[#C9A45C]">❁</span>
          <span className="font-sans text-[10px] tracking-[0.25em] text-[#C9A45C] uppercase font-bold">
            {language === 'bn' ? 'শীঘ্রই আসছে' : 'COMING SOON'}
          </span>
          <span className="font-serif text-[11px] text-[#E9D8BC]/70 italic max-w-xs">
            {language === 'bn' ? 'ঐতিহাসিক ছবি সংগ্রহ চলছে' : 'Archival image under digitization'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  );
};

export default function HistoryHeritageSection({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const t = {
    history: language === 'bn' ? 'ইতিহাস' : 'HISTORY',
    evolution: language === 'bn' ? 'বিবর্তন' : 'EVOLUTION',
    subtitle: language === 'bn' ? 'পারিবারিক উঠোন থেকে সমগ্র শহরের উৎসব' : 'From household worship\nto a city-wide celebration',
    scroll: language === 'bn' ? 'আরও জানুন' : 'SCROLL TO EXPLORE',
    comingSoon: language === 'bn' ? 'শীঘ্রই আসছে' : 'COMING SOON',
    archiveComingSoon: language === 'bn' ? 'সংরক্ষণাগার ছবি শীঘ্রই আসছে' : 'ARCHIVE PHOTO COMING SOON',
    
    beginningTitle: language === 'bn' ? 'সূচনাপর্ব' : 'THE BEGINNING',
    beginningQuote: language === 'bn' ? '"পারিবারিক ঠাকুরদালান থেকে সমগ্র শহরের রাজপথে।"' : '"From the household courtyard\nto the streets of an entire city."',
    beginningDesc: language === 'bn' 
      ? 'কলকাতার দুর্গাপূজা কোনো একক নির্দিষ্ট উৎসব থেকে শুরু হয়নি। শতাব্দীপ্রাচীন পারিবারিক রীতি থেকে কালক্রমে তা পাড়ার বারোয়ারি উৎসব এবং অবশেষে শহরের প্রধান সাংস্কৃতিক পরিচয়ে রূপান্তরিত হয়েছে।'
      : 'Kolkata\'s Puja evolved gradually from household traditions into community celebrations and eventually into one of the city\'s defining cultural experiences.',
    
    householdEra: language === 'bn' ? 'বনেদি বাড়ির যুগ' : 'THE HOUSEHOLD ERA',
    householdSub: language === 'bn' ? '"একসময় ঠাকুরদালানই ছিল উৎসবের মূল কেন্দ্র।"' : '"The courtyard was once the centre of the celebration."',
    
    handsTitle: language === 'bn' ? 'উৎসবের কারিগর' : 'THE HANDS BEHIND THE FESTIVAL',
    handsSub: language === 'bn' ? '"হাজারো হাতের পরিশ্রমে গড়ে ওঠে কয়েকদিনের এই মহোৎসব।"' : '"Thousands of hands create a celebration that lasts only a few days."',
    
    modernEra: language === 'bn' ? 'আধুনিক যুগ' : 'THE MODERN ERA',
    modernQuote: language === 'bn' ? 'যখন মণ্ডপ হয়ে উঠল আস্ত একটি শিল্পকর্ম' : 'WHEN THE PANDAL\nBECAME AN ARTWORK',
    modernDesc: language === 'bn' 
      ? 'থিম পূজা অস্থায়ী মণ্ডপকে এমন এক পরিবেশে রূপান্তরিত করেছে যেখানে স্থাপত্য, ভাস্কর্য, আলো, শব্দ এবং গল্প বলা একটি কেন্দ্রীয় ধারণাকে ঘিরে একসাথে কাজ করে।'
      : 'Theme Puja transformed the temporary pandal into an environment where architecture, sculpture, lighting, sound and storytelling could work together around a central idea.',
      
    fromFamily: language === 'bn' ? 'পরিবার থেকে সর্বজনীন' : 'FROM FAMILY\nTO COMMUNITY',
    
    unesco: language === 'bn' ? 'ইউনেস্কো স্বীকৃতি' : 'UNESCO',
    unescoQuote: language === 'bn' ? '"মানবতার বিমূর্ত সাংস্কৃতিক ঐতিহ্যের প্রতিনিধি তালিকা"' : '"Representative List of the\nIntangible Cultural Heritage\nof Humanity"',
    unescoDesc: language === 'bn'
      ? 'ইউনেস্কোর এই স্বীকৃতি কেবল ভৌত মণ্ডপগুলোর জন্য নয়, বরং উৎসব ঘিরে থাকা জীবন্ত সাংস্কৃতিক চর্চা, জ্ঞান, দক্ষতা এবং মানুষের স্বতঃস্ফূর্ত অংশগ্রহণের জন্য।'
      : 'UNESCO\'s recognition concerns the living cultural practices, knowledge, skills and community participation surrounding the festival—not merely the physical pandals.',
      
    whyMatters: language === 'bn' ? 'এই বিবর্তনের তাৎপর্য' : 'WHY THIS EVOLUTION MATTERS',
    cityChanged: language === 'bn' ? 'শহর বদলেছে' : 'THE CITY CHANGED',
    festivalAdapted: language === 'bn' ? 'উৎসব মানিয়ে নিয়েছে' : 'THE FESTIVAL ADAPTED',
    traditionCont: language === 'bn' ? 'ঐতিহ্য বহমান' : 'THE TRADITION CONTINUED',
    
    closingQuote: language === 'bn' ? '"শহর তার উৎসবের মাধ্যমেই স্মৃতি ধরে রাখে।"' : '"THE CITY REMEMBERS\nTHROUGH CELEBRATION."',
    closingDesc: language === 'bn' ? 'প্রতিটি পুজো কলকাতার জীবন্ত সাংস্কৃতিক আর্কাইভে আরও একটি নতুন অধ্যায় যোগ করে।' : 'Every Puja season adds another\nchapter to Kolkata\'s living cultural archive.',
    exploreBonedi: language === 'bn' ? 'বনেদি বাড়িগুলি দেখুন' : 'EXPLORE BONEDI PUJAS',
    exploreWalks: language === 'bn' ? 'হেরিটেজ ওয়াক' : 'EXPLORE HERITAGE WALKS'
  };

  return (
    <div className="bg-[#E9D8BC] min-h-screen font-sans text-[#211B19] selection:bg-[#A64B32]/20 relative overflow-hidden">
      
      {/* Mobile Back Button - Retained from previous for navigation consistency */}
      <div className="md:hidden flex justify-between items-center p-4 bg-[#E9D8BC]/90 backdrop-blur-md border-b border-[#C9A45C]/30 sticky top-0 z-50">
        <button onClick={onBack} className="p-2 cursor-pointer text-[#4A1118]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-playfair font-bold text-[#4A1118] text-sm tracking-widest uppercase">Archive</span>
        <div className="w-9" />
      </div>

      {/* Subtle Archival Texture Global Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ==================================================
          1. HERO (Asymmetric Editorial)
      ================================================== */}
      <section className="relative w-full min-h-[90svh] flex flex-col md:flex-row items-center pt-20 pb-12 px-6 md:px-12 max-w-[1400px] mx-auto gap-8">
        
        <div className="w-full md:w-5/12 flex flex-col justify-center relative z-10 order-2 md:order-1 mt-8 md:mt-0">
          <p className="font-sans text-[10px] md:text-xs font-bold tracking-[0.3em] text-[#A64B32] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-px bg-[#A64B32]" />
            KOLKATA DURGA PUJA ARCHIVE
          </p>
          
          <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl text-[#4A1118] leading-[0.9] tracking-tight mb-8">
            {t.history} &<br />
            <span className="italic text-[#C4773C]">{t.evolution}</span>
          </h1>
          
          <p className="font-serif text-lg md:text-xl text-[#211B19]/80 max-w-sm leading-relaxed whitespace-pre-line">
            {t.subtitle}
          </p>

          <div className="mt-16 flex flex-col items-start gap-4">
            <span className="text-2xl text-[#C9A45C]">❁</span>
            <p className="font-sans text-[9px] font-bold tracking-[0.2em] text-[#2A0C12] uppercase opacity-60">
              {t.scroll}
            </p>
            <div className="w-px h-16 bg-gradient-to-b from-[#2A0C12]/40 to-transparent" />
          </div>
        </div>

        <div className="w-full md:w-7/12 h-[50vh] md:h-[75vh] relative order-1 md:order-2 flex items-end justify-end">
          {/* Vertical Indicator */}
          <div className="absolute top-0 right-full mr-4 md:mr-8 h-full flex flex-col items-center opacity-40 hidden md:flex">
            <div className="w-px flex-grow bg-[#4A1118]" />
            <span className="font-sans text-[10px] tracking-[0.2em] text-[#4A1118] uppercase my-4" style={{ writingMode: 'vertical-rl' }}>
              01 / HISTORY
            </span>
            <div className="w-px h-24 bg-[#4A1118]" />
          </div>

          <div className="w-[90%] md:w-full h-full relative border border-[#C9A45C]/40 p-2">
            <div className="w-full h-full relative overflow-hidden bg-[#2A0C12]">
              <ArchiveImageWithFallback 
                src="/images/history/vintage_thakur_dalan.jpg" 
                alt="Vintage Thakur Dalan archival photograph depicting 18th century Durga Puja courtyard in Kolkata" 
                className="w-full h-full object-cover grayscale-[30%] sepia-[50%] opacity-80 mix-blend-luminosity scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-[#4A1118]/20 mix-blend-multiply pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. EDITORIAL INTRODUCTION
      ================================================== */}
      <section className="py-24 md:py-40 px-6 max-w-4xl mx-auto text-center relative">
        <Reveal>
          <p className="font-sans text-xs font-bold tracking-[0.2em] text-[#A64B32] uppercase mb-12">
            {t.beginningTitle}
          </p>
          <h2 className="font-playfair text-3xl md:text-5xl text-[#2A0C12] leading-tight mb-12 whitespace-pre-line">
            {t.beginningQuote}
          </h2>
          <div className="w-px h-16 bg-[#C9A45C] mx-auto mb-12" />
          <p className="font-serif text-lg md:text-xl text-[#211B19]/80 leading-relaxed max-w-2xl mx-auto">
            {t.beginningDesc}
          </p>
        </Reveal>
      </section>

      {/* ==================================================
          3. THE HISTORICAL JOURNEY (Vertical Timeline)
      ================================================== */}
      <section className="py-20 px-6 max-w-[1200px] mx-auto relative">
        
        {/* Continuous Center Line */}
        <div className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-px bg-[#C9A45C]/40 transform md:-translate-x-1/2" />

        {/* Timeline Events */}
        <div className="space-y-32">
          
          {/* 1757 - Shobhabazar */}
          <Reveal className="relative flex flex-col md:flex-row items-start md:items-center justify-between group">
            <div className="w-full md:w-[45%] text-left md:text-right pr-0 md:pr-12 mb-8 md:mb-0 pl-16 md:pl-0">
              <span className="font-playfair text-6xl md:text-8xl text-[#4A1118] opacity-20 absolute -top-4 md:-top-8 left-12 md:left-auto md:right-0 pointer-events-none">1757</span>
              <p className="font-sans text-[10px] tracking-[0.2em] text-[#A64B32] mb-2 uppercase">Kolkata</p>
              <h3 className="font-playfair text-2xl md:text-3xl text-[#2A0C12] mb-4">Shobhabazar Rajbari</h3>
              <p className="font-serif text-sm md:text-base text-[#211B19]/70 italic mb-6">
                "One of the city's most significant historic household Puja traditions."
              </p>
              <button className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#C4773C] hover:text-[#4A1118] transition-colors uppercase border-b border-transparent hover:border-[#4A1118] pb-1 cursor-pointer inline-flex items-center gap-2">
                Read Story <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {/* Center Node */}
            <div className="absolute left-[24px] md:left-1/2 top-0 md:top-1/2 w-3 h-3 bg-[#E9D8BC] border-2 border-[#A64B32] rounded-full transform -translate-x-[5.5px] md:-translate-x-1/2 md:-translate-y-1/2 z-10" />

            <div className="w-full md:w-[45%] pl-16 md:pl-12">
              <div className="border border-[#C9A45C]/30 p-2 bg-[#F4EBDD] rotate-1 group-hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[4/3] bg-[#2A0C12] overflow-hidden">
                   <ArchiveImageWithFallback 
                     src="/images/history/vintage_thakur_dalan.jpg" 
                     alt="Historic Shobhabazar Rajbari Durga Puja courtyard, celebrated since 1757" 
                     className="w-full h-full object-cover grayscale-[60%] sepia-[20%] opacity-90 scale-105" 
                     loading="lazy"
                   />
                </div>
              </div>
            </div>
          </Reveal>

          {/* 1759 - Barowari */}
          <Reveal delay={200} className="relative flex flex-col md:flex-row items-start md:items-center justify-between group">
            <div className="w-full md:w-[45%] order-2 md:order-1 pl-16 md:pl-0 pr-0 md:pr-12">
              <div className="border border-[#C9A45C]/30 p-2 bg-[#F4EBDD] -rotate-1 group-hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[4/3] bg-[#2A0C12] overflow-hidden flex flex-col items-center justify-center relative p-6 text-center">
                  <div className="absolute inset-0 bg-[#A64B32]/10 mix-blend-multiply pointer-events-none" />
                  <div className="relative z-10 flex flex-col items-center gap-2.5 border border-[#C9A45C]/40 px-6 py-5 rounded-sm bg-[#1e070b]/60 backdrop-blur-xs">
                    <span className="text-xl text-[#C9A45C]">❁</span>
                    <span className="font-sans text-[10px] tracking-[0.25em] text-[#C9A45C] uppercase font-bold">
                      {t.comingSoon}
                    </span>
                    <span className="font-playfair text-[#E9D8BC]/80 text-xs italic tracking-wide">
                      {language === 'bn' ? 'ঐতিহাসিক ছবি সংগ্রহ চলছে' : 'Archival image under digitization'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center Node */}
            <div className="absolute left-[24px] md:left-1/2 top-0 md:top-1/2 w-3 h-3 bg-[#E9D8BC] border-2 border-[#A64B32] rounded-full transform -translate-x-[5.5px] md:-translate-x-1/2 md:-translate-y-1/2 z-10" />

            <div className="w-full md:w-[45%] order-1 md:order-2 text-left pl-16 md:pl-12 mb-8 md:mb-0 relative">
              <span className="font-playfair text-6xl md:text-8xl text-[#4A1118] opacity-20 absolute -top-4 md:-top-8 left-12 md:left-8 pointer-events-none">1759</span>
              <p className="font-sans text-[10px] tracking-[0.2em] text-[#A64B32] mb-2 uppercase">Guptipara, Hooghly</p>
              <h3 className="font-playfair text-2xl md:text-3xl text-[#2A0C12] mb-4">The Barowari Tradition</h3>
              <p className="font-serif text-sm md:text-base text-[#211B19]/70 italic mb-6">
                "Twelve friends initiated a community celebration, bringing Puja into a shared public space."
              </p>
            </div>
          </Reveal>

          {/* 1910 - Community */}
          <Reveal delay={200} className="relative flex flex-col md:flex-row items-start md:items-center justify-between group">
            <div className="w-full md:w-[45%] text-left md:text-right pr-0 md:pr-12 mb-8 md:mb-0 pl-16 md:pl-0 relative">
              <span className="font-playfair text-6xl md:text-8xl text-[#4A1118] opacity-20 absolute -top-4 md:-top-8 left-12 md:left-auto md:right-0 pointer-events-none">1910</span>
              <p className="font-sans text-[10px] tracking-[0.2em] text-[#A64B32] mb-2 uppercase">Bagbazar</p>
              <h3 className="font-playfair text-2xl md:text-3xl text-[#2A0C12] mb-4">Sarbojanin Puja</h3>
              <p className="font-serif text-sm md:text-base text-[#211B19]/70 italic mb-6">
                "The first truly public, 'for all' (Sarbojanin) Puja emerged, tying the festival to nationalism."
              </p>
            </div>
            
            <div className="absolute left-[24px] md:left-1/2 top-0 md:top-1/2 w-3 h-3 bg-[#E9D8BC] border-2 border-[#A64B32] rounded-full transform -translate-x-[5.5px] md:-translate-x-1/2 md:-translate-y-1/2 z-10" />

            <div className="w-full md:w-[45%] pl-16 md:pl-12">
              <div className="border border-[#C9A45C]/30 p-2 bg-[#F4EBDD] rotate-2 group-hover:rotate-0 transition-transform duration-500">
                <div className="aspect-square bg-[#2A0C12] overflow-hidden">
                  <ArchiveImageWithFallback 
                    src="/images/history/para_puja_1950s.jpg" 
                    alt="Historical 1950s community para Durga Puja celebration in Bagbazar Kolkata" 
                    className="w-full h-full object-cover grayscale-[100%] contrast-125" 
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ==================================================
          4. THE HOUSEHOLD ERA (Bonedi Bari immersive)
      ================================================== */}
      <section className="mt-24 w-full bg-[#2A0C12] text-[#F4EBDD] py-24 md:py-32 relative border-y border-[#C9A45C]/20">
        <div className="absolute inset-0 bg-[url('/images/history/vintage_thakur_dalan.jpg')] bg-cover bg-center opacity-10 mix-blend-luminosity grayscale pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-playfair text-4xl md:text-6xl text-[#E9D8BC] mb-6">{t.householdEra}</h2>
            <p className="font-serif text-lg md:text-2xl text-[#C9A45C] italic font-light mb-20">{t.householdSub}</p>
          </Reveal>

          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 font-sans text-[10px] tracking-[0.2em] uppercase text-[#E9D8BC]/80">
            <Reveal delay={100} className="flex flex-col items-center gap-4">
              <span className="w-px h-8 bg-[#C9A45C]/50" />
              THAKUR DALAN
            </Reveal>
            <Reveal delay={300} className="flex flex-col items-center gap-4">
              <span className="w-px h-8 bg-[#C9A45C]/50" />
              FAMILY RITUALS
            </Reveal>
            <Reveal delay={500} className="flex flex-col items-center gap-4">
              <span className="w-px h-8 bg-[#C9A45C]/50" />
              TRADITIONAL IDOL FORMS
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. THE HANDS BEHIND THE FESTIVAL (Artisan Gallery)
      ================================================== */}
      <section className="py-24 md:py-32 px-6 overflow-hidden">
        <Reveal className="max-w-7xl mx-auto mb-16">
          <h2 className="font-playfair text-3xl md:text-5xl text-[#4A1118] mb-4">{t.handsTitle}</h2>
          <p className="font-serif text-lg text-[#A64B32] italic">{t.handsSub}</p>
        </Reveal>

        {/* Horizontal Editorial Strip */}
        <div className="w-full flex overflow-x-auto hide-scrollbar gap-2 md:gap-4 snap-x px-6 md:px-[calc((100vw-1280px)/2)]" style={{ scrollbarWidth: 'none' }}>
          {[
            { phase: "BAMBOO & STRAW", desc: "The skeletal structure (kathamo) is bound.", phaseBn: "কাঠামো নির্মাণ", descBn: "বাঁশ ও খড় দিয়ে মূর্তির প্রাথমিক কাঠামো বাঁধা হয়।" },
            { phase: "GANGA MAATI", desc: "Sacred river clay forms the initial flesh.", phaseBn: "মাটি লেপন", descBn: "পবিত্র গঙ্গার পলিমাটি দিয়ে মৃন্ময়ী রূপ দেওয়া হয়।" },
            { phase: "SCULPTING", desc: "The artisan refines the expression and posture.", phaseBn: "অঙ্গসৌষ্ঠব ও রূপায়ণ", descBn: "শিল্পী পরম যত্নে দেবীর মুখাবয়ব ও ভাব ফুটিয়ে তোলেন।" },
            { phase: "CHAKKHU DAAN", desc: "The painting of the eyes breathes life.", phaseBn: "চক্ষুদান", descBn: "মহালয়ার পুণ্যলগ্নে দেবীর চক্ষুদান সম্পন্ন হয়।" },
            { phase: "CHALCHITRA", desc: "The ornate background arch is detailed.", phaseBn: "চালচিত্র ও সাজসজ্জা", descBn: "ডাকের সাজ বা পটচিত্রের অলঙ্করণে প্রতিমা সজ্জা পূর্ণ হয়।" }
          ].map((item, idx) => (
            <Reveal key={idx} delay={idx * 120} type="fade-in" className="min-w-[280px] md:min-w-[340px] aspect-[3/4] flex-shrink-0 snap-center relative group cursor-pointer bg-[#F4EBDD] p-2 border border-[#C9A45C]/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full h-full bg-[#2A0C12] overflow-hidden relative flex flex-col justify-between p-6">
                <div className="absolute inset-0 bg-[#A64B32]/15 mix-blend-multiply z-0 pointer-events-none" />
                
                {/* Top Badge: Phase Index & Coming Soon */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-[#C9A45C] bg-[#1e070b]/80 border border-[#C9A45C]/30 px-2 py-0.5 rounded">
                    0{idx + 1} / 05
                  </span>
                  <span className="font-sans text-[9px] tracking-[0.2em] uppercase font-bold text-[#E9D8BC] bg-[#8B1E2D]/80 px-2.5 py-0.5 rounded-full border border-[#C9A45C]/40 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A45C] animate-pulse" />
                    {t.comingSoon}
                  </span>
                </div>

                {/* Center Visual Art & Coming Soon Badge */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6 text-center">
                  <div className="w-14 h-14 rounded-full border border-[#C9A45C]/30 flex items-center justify-center bg-[#1e070b]/60 mb-3 group-hover:scale-105 transition-transform duration-300">
                    <Palette className="w-6 h-6 text-[#C9A45C]" />
                  </div>
                  <h4 className="font-playfair text-[#E9D8BC] text-lg font-bold tracking-wide">
                    {language === 'bn' ? item.phaseBn : item.phase}
                  </h4>
                  <p className="font-sans text-[9.5px] tracking-[0.2em] text-[#C9A45C]/80 uppercase mt-1">
                    {language === 'bn' ? 'ফটোগ্রাফ শীঘ্রই আসছে' : 'Photo Coming Soon'}
                  </p>
                </div>
                
                {/* Bottom Permanent / Hover Context */}
                <div className="relative z-10 border-t border-[#C9A45C]/20 pt-3">
                  <p className="font-serif text-[#E9D8BC]/85 text-xs leading-relaxed">
                    {language === 'bn' ? item.descBn : item.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ==================================================
          6. COMMUNITY TRANSFORMATION FLOW
      ================================================== */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center border-t border-[#C9A45C]/30">
        <Reveal>
          <h2 className="font-sans text-[10px] tracking-[0.3em] text-[#A64B32] uppercase mb-16">{t.fromFamily}</h2>
          
          <div className="flex flex-col items-center gap-6 font-playfair text-2xl md:text-4xl text-[#4A1118]">
            <span>HOUSEHOLD</span>
            <span className="text-[#C9A45C] font-sans text-xl">↓</span>
            <span>BAROWARI</span>
            <span className="text-[#C9A45C] font-sans text-xl">↓</span>
            <span>SARBOJANIN</span>
            <span className="text-[#C9A45C] font-sans text-xl">↓</span>
            <span>PARA PUJA</span>
            <span className="text-[#C9A45C] font-sans text-xl">↓</span>
            <span className="text-[#2A0C12] font-bold">CITY-WIDE CELEBRATION</span>
          </div>
        </Reveal>
      </section>

      {/* ==================================================
          7. THE MODERN ERA (Dark Theme Puja Transition)
      ================================================== */}
      <section className="relative w-full min-h-[90svh] bg-[#1a0507] text-[#E9D8BC] flex flex-col justify-center px-6 md:px-12 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <ArchiveImageWithFallback 
            src="/images/history/modern_theme_puja.jpg" 
            alt="Contemporary artistic theme pandal installation at Kolkata Durga Puja" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-[1.02] transform transition-transform duration-[20s] hover:scale-110" 
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0507] via-[#1a0507]/60 to-transparent pointer-events-none" />
        </div>
        
        <Reveal className="relative z-10 max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-end gap-12">
            <div className="w-full md:w-2/3">
              <span className="font-sans text-[10px] tracking-[0.3em] text-[#C9A45C] uppercase block mb-6">{t.modernEra}</span>
              <h2 className="font-playfair text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-8 whitespace-pre-line text-[#F4EBDD]">
                {t.modernQuote}
              </h2>
            </div>
            
            <div className="w-full md:w-1/3 pb-2 border-l border-[#C9A45C]/30 pl-6">
              <p className="font-serif text-sm md:text-base text-[#E9D8BC]/70 leading-relaxed">
                {t.modernDesc}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ==================================================
          8. UNESCO RECOGNITION
      ================================================== */}
      <section className="bg-[#211B19] text-[#F4EBDD] py-32 px-6 text-center relative border-t border-[#3a302d]">
        {/* Subtle geometry */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] pointer-events-none" />
        
        <Reveal className="max-w-3xl mx-auto relative z-10">
          <span className="font-playfair text-6xl md:text-8xl text-[#C9A45C]/20 block mb-2">2021</span>
          <h2 className="font-sans text-sm md:text-base tracking-[0.4em] text-[#C9A45C] uppercase mb-12">{t.unesco}</h2>
          
          <h3 className="font-playfair text-2xl md:text-4xl text-[#E9D8BC] leading-relaxed italic mb-12 whitespace-pre-line">
            {t.unescoQuote}
          </h3>
          
          <div className="w-12 h-px bg-[#A64B32] mx-auto mb-12" />
          
          <p className="font-serif text-base md:text-lg text-[#E9D8BC]/70 leading-relaxed">
            {t.unescoDesc}
          </p>
        </Reveal>
      </section>

      {/* ==================================================
          9. WHY IT MATTERS (Minimalist Typography)
      ================================================== */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <Reveal>
          <h2 className="font-sans text-[10px] tracking-[0.3em] text-[#A64B32] uppercase mb-24 text-center">
            {t.whyMatters}
          </h2>
        </Reveal>

        <div className="space-y-24">
          <Reveal delay={100} className="flex flex-col md:flex-row items-baseline gap-4 md:gap-12 border-b border-[#C9A45C]/20 pb-8">
            <span className="font-sans text-sm tracking-widest text-[#C4773C]">01</span>
            <h3 className="font-playfair text-3xl md:text-5xl text-[#4A1118]">{t.cityChanged}</h3>
          </Reveal>
          
          <Reveal delay={200} className="flex flex-col md:flex-row items-baseline gap-4 md:gap-12 border-b border-[#C9A45C]/20 pb-8 pl-0 md:pl-24">
            <span className="font-sans text-sm tracking-widest text-[#C4773C]">02</span>
            <h3 className="font-playfair text-3xl md:text-5xl text-[#4A1118]">{t.festivalAdapted}</h3>
          </Reveal>
          
          <Reveal delay={300} className="flex flex-col md:flex-row items-baseline gap-4 md:gap-12 border-b border-[#C9A45C]/20 pb-8 pl-0 md:pl-48">
            <span className="font-sans text-sm tracking-widest text-[#C4773C]">03</span>
            <h3 className="font-playfair text-3xl md:text-5xl text-[#4A1118]">{t.traditionCont}</h3>
          </Reveal>
        </div>
      </section>

      {/* ==================================================
          10. FINAL CLOSING
      ================================================== */}
      <section className="w-full bg-[#2A0C12] text-[#F4EBDD] py-32 px-6 text-center relative overflow-hidden">
        {/* Subtle motif */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <span className="text-[40rem] font-serif leading-none">❁</span>
        </div>
        
        <Reveal className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="font-playfair text-4xl md:text-6xl text-[#E9D8BC] mb-12 leading-tight whitespace-pre-line">
            {t.closingQuote}
          </h2>
          
          <p className="font-serif text-lg md:text-xl text-[#C9A45C]/80 italic mb-16 whitespace-pre-line">
            {t.closingDesc}
          </p>
          
          <span className="text-2xl text-[#A64B32] mb-16">❁</span>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
            <button 
              onClick={onBack}
              className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#E9D8BC] hover:text-[#C9A45C] transition-colors border-b border-transparent hover:border-[#C9A45C] pb-1 flex items-center gap-2 cursor-pointer"
            >
              {t.exploreBonedi} <ArrowRight className="w-3 h-3" />
            </button>
            <button 
              onClick={onBack}
              className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#E9D8BC] hover:text-[#C9A45C] transition-colors border-b border-transparent hover:border-[#C9A45C] pb-1 flex items-center gap-2 cursor-pointer"
            >
              {t.exploreWalks} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
