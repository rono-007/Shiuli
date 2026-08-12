import React, { useState } from 'react';
import { BookOpen, X, Heart } from 'lucide-react';

interface Story {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  description: string;
  diaryContent: string;
  image: string;
  align: 'left' | 'right';
}

const storiesData: Story[] = [
  {
    id: 'bagbazar',
    chapter: '০১',
    title: 'বাগবাজার',
    subtitle: 'শত বছরেরও বেশি সময় ধরে উত্তর কলকাতার অন্যতম প্রিয় সাবেকি পুজো।',
    description: 'বাগবাজারের পুজো মানেই এক চিরন্তন আভিজাত্য। এখানে থিমের সমারোহ নেই, আছে ইতিহাসের স্পন্দন। গঙ্গার ধার ঘেঁষে চলা এই পুজো আজও বাংলার ঐতিহ্যবাহী একচালা প্রতিমা এবং সাবেকিয়ানা বজায় রেখেছে।',
    diaryContent: 'বাগবাজারের পুজো মানেই ফিরে যাওয়া সেই ধ্রুপদী আভিজাত্যে। একচালা প্রতিমার সামনে দাঁড়িয়ে চোখের পাতা যেন পলক ফেলতে ভুলে যায়। শরৎকালের শিউলি ভেজা সকালবেলা যখন গঙ্গার হিমেল হাওয়া এসে গায়ে লাগে, আর মাইকে দূর থেকে বেজে ওঠে বীরেন্দ্রকৃষ্ণ ভদ্রের চণ্ডীপাঠ, তখনই বুক ভরে ওঠে এক আদিম শান্তিতে। বাগবাজার সর্বজনীনের ঐতিহ্য কোনো আধুনিক থিমের রঙে মাপা যায় না, তা জড়িয়ে আছে উত্তর কলকাতার প্রতিটি পুরনো ইটের দেওয়ালে, প্রতিটি গঙ্গার ঘাটে আর মানুষের খাঁটি বাঙালিয়ানায়।',
    image: '/bagbazar-vintage.png',
    align: 'left'
  },
  {
    id: 'maddox-square',
    chapter: '০২',
    title: 'ম্যাডক্স স্কোয়ার',
    subtitle: 'আড্ডার আরেক নাম। দুর্গাপুজোর দিনগুলোতে কলকাতার অন্যতম প্রধান মিলনক্ষেত্র।',
    description: 'দক্ষিণ কলকাতার এই মাঠে ঠাকুর দেখা গৌণ, বন্ধুদের আড্ডাই মুখ্য। বিশাল মাঠ, গাছে গাছে ঝুলন্ত আলোকমালা আর ঢাকের দূরবর্তী গুঞ্জন মিলেমিশে এখানে তৈরি হয় এক মন মাতানো উৎসবের চালচিত্র।',
    diaryContent: 'ম্যাডক্স স্কোয়ারের পুজো মানে কোনো প্রথাগত লাইনে দাঁড়িয়ে চটজলদি ঠাকুর দেখা নয়, তা হলো বন্ধুত্বের খোলা মাঠ। গাছ থেকে ঝুলছে ঝাড়বাতি আর মণ্ডপের লাল আলো, পাশেই ধুনুচির ধোঁয়া আর ঢাকের আওয়াজ আর সেই শব্দের ভেতর দিয়ে তৈরি হচ্ছে হাজারো গল্পের কোলাজ। ঘাসের ওপর পা ছড়িয়ে বসা, কাগজের প্লেটে ঘুগনি আর এগরোলের স্বাদ, আর রাতভরের হাসি-ঠাট্টায় কখন যে উৎসবের শুভ অষ্টমী বা নবমীর রাতগুলো কেটে যায় তা এই আড্ডার চেনা মুখগুলো ছাড়া আর কেউ বুঝবে না। এটি দক্ষিণ কলকাতার এক জীবন্ত উৎসবের খেরোখাতা।',
    image: '/maddox-square-adda.png',
    align: 'right'
  }
];

const EditorialSection: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedStories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="py-32 bg-paper text-ink relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-20">
        {/* Editorial Title Block */}
        <div className="text-center mb-40 space-y-4">
          <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-ink/40">III • স্মৃতিকথা</span>
          <h2 className="text-5xl md:text-7xl font-serif text-ink font-light tracking-wide italic">
            কলকাতার গল্প
          </h2>
          <p className="text-sm font-serif text-ink/60 italic max-w-md mx-auto leading-relaxed">
            "বাঁশ ও কাপড়ের মণ্ডপের আড়ালে লুকিয়ে থাকা কিছু চিরন্তন আখ্যান..."
          </p>
        </div>
      </div>

      {/* Edge-to-Edge Coffee-Table Layout */}
      <div className="space-y-32 md:space-y-48 pb-32">
        {storiesData.map((story, index) => {
          const isRight = story.align === 'right';
          return (
            <div 
              key={story.id} 
              id={`editorial-${story.id}`}
              className="relative w-full min-h-[70vh] flex items-center"
            >
              {/* Full Bleed Image Background */}
              <div className={`absolute top-0 bottom-0 w-[90%] md:w-[75%] ${isRight ? 'right-0' : 'left-0'} z-0 overflow-hidden`}>
                <img 
                  src={story.image} 
                  alt={story.title} 
                  className="w-full h-full object-cover grayscale-[20%] opacity-90 transition-transform duration-[2s] hover:scale-105 hover:grayscale-0"
                />
                {/* Vintage overlay */}
                <div className="absolute inset-0 bg-ink/10 mix-blend-color-burn pointer-events-none"></div>
                
                {/* Plate Label */}
                <div className={`absolute bottom-6 ${isRight ? 'right-8' : 'left-8'} bg-paper/90 backdrop-blur-md px-4 py-2 text-[9px] font-mono text-ink/60 tracking-widest uppercase`}>
                  Plate 0{index + 1}
                </div>
              </div>

              {/* Floating Editorial Text Block */}
              <div className={`relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 flex ${isRight ? 'justify-start' : 'justify-end'}`}>
                <div className={`bg-paper p-10 md:p-16 shadow-2xl max-w-lg border border-ink/5 mt-48 md:mt-0 ${isRight ? '-ml-4 md:ml-0' : '-mr-4 md:mr-0'}`}>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-bengali-red/80 font-bold tracking-widest">
                          অধ্যায় {story.chapter}
                        </span>
                        <button 
                          onClick={(e) => toggleLike(story.id, e)}
                          className="text-ink/30 hover:text-bengali-red transition-colors focus:outline-none"
                        >
                          <Heart className={`w-4 h-4 ${likedStories[story.id] ? 'fill-bengali-red text-bengali-red' : ''}`} />
                        </button>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-serif text-ink leading-tight font-normal">
                        {story.title}
                      </h3>
                      <div className="h-px w-12 bg-ink/20"></div>
                      <h4 className="text-sm font-serif text-ink/60 italic leading-relaxed">
                        {story.subtitle}
                      </h4>
                    </div>

                    <p className="text-base font-serif text-ink/85 leading-[1.8] drop-cap text-justify">
                      {story.description}
                    </p>

                    <div className="pt-8">
                      <button 
                        onClick={() => setSelectedStory(story)}
                        className="group flex items-center gap-3 text-ink/60 hover:text-bengali-red transition-colors font-serif italic text-sm tracking-wide"
                      >
                        <span className="border-b border-ink/20 group-hover:border-bengali-red pb-0.5 transition-colors">
                          ডায়েরির পাতা খুলুন
                        </span>
                        <BookOpen className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diary Reader Modal Overlay */}
      {selectedStory && (
        <div className="fixed inset-0 bg-night/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div 
            className="bg-paper text-ink w-full max-w-2xl p-10 md:p-16 border border-ink/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-8 right-8 text-ink/40 hover:text-bengali-red transition-colors focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Diary Page Layout */}
            <div className="space-y-10">
              <div className="text-center space-y-4 pb-8 border-b border-ink/10">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-bengali-red/60">অধ্যায় {selectedStory.chapter} • দিনপঞ্জি</span>
                <h3 className="text-4xl md:text-5xl font-serif font-light text-ink tracking-wide">{selectedStory.title}</h3>
              </div>

              {/* Text Body */}
              <div className="space-y-6 text-lg font-serif leading-[2] text-ink/80 text-justify italic font-light px-2 md:px-8">
                {selectedStory.diaryContent.split('\n\n').map((para, i) => (
                  <p key={i}>
                    {para}
                  </p>
                ))}
              </div>

              <div className="pt-10 border-t border-ink/10 flex justify-end items-center text-[10px] font-mono text-ink/40 select-none tracking-widest uppercase">
                <span>পথিক ডায়েরি</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default EditorialSection;