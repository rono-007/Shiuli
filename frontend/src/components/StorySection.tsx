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
    <section className="py-24 bg-[#F8F1E7] text-[#3D2C22] relative overflow-hidden" id="stories">
      
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

        <button className="px-5 py-2.5 rounded-md border border-[#A0353A]/40 text-[#7A1F26] font-serif text-sm hover:bg-[#A0353A]/5 transition-colors flex items-center gap-2 group cursor-pointer">
          {t.readStory} 
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
              // Mobile: 2 cards visible (50% - gap)
              // Tablet: 3 cards visible (33.33% - gap)
              // Laptop: 5 cards visible (20% - gap)
              className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.85rem)] lg:w-[calc(20%-1rem)] flex-none h-[320px] md:h-[400px] lg:h-[440px] relative rounded-xl lg:rounded-2xl overflow-hidden snap-center group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Background Image */}
              <img 
                src={story.image} 
                alt={language === 'bn' ? story.titleBn : story.titleEn} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
              />
              
              {/* Dark Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A1616]/95 via-[#3D1E1E]/50 to-transparent pointer-events-none" />

              {/* Card Content */}
              <div className="absolute inset-0 p-4 md:p-6 lg:p-8 flex flex-col justify-end text-[#F8F1E7] z-10">
                
                {/* Tag */}
                <div className="mb-3 lg:mb-5">
                  <span className="inline-block px-2 lg:px-4 py-0.5 lg:py-1 text-[10px] lg:text-xs border border-[#F8F1E7]/30 rounded-full bg-[#7A1F26]/40 backdrop-blur-md font-serif font-medium">
                    {language === 'bn' ? story.tagBn : story.tagEn}
                  </span>
                </div>
                
                <h3 className="text-lg lg:text-2xl font-serif mb-2 lg:mb-3 text-white drop-shadow-lg tracking-wide">
                  {language === 'bn' ? story.titleBn : story.titleEn}
                </h3>
                
                <p className="hidden md:block text-[13px] lg:text-[15px] text-white/80 line-clamp-2 mb-4 lg:mb-6 font-serif leading-relaxed text-shadow-sm">
                  {language === 'bn' ? story.descBn : story.descEn}
                </p>
                
                <div className="flex items-center text-xs lg:text-sm font-serif text-[#F8F1E7] group-hover:text-white transition-colors">
                  <span>{t.readStory}</span>
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
