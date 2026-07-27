import React, { useState } from 'react';
import { X } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  onSelectZone: (zone: 'north' | 'central' | 'south') => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSelectZone }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const zones = [
    { id: 'north', serial: 'NO-1433-A', name: 'উত্তর কলকাতা', subtitle: 'North Calcutta Tour', desc: 'বাগবাজার সর্বজনীন, কলেজ স্কোয়ার, শোভাবাজার রাজবাড়ি', active: true, stampColor: 'bg-[#8B1E2D]' },
    { id: 'central', serial: 'CE-1433-B', name: 'মধ্য কলকাতা', subtitle: 'Central Calcutta Tour', desc: 'সন্তোষ মিত্র স্কোয়ার, লেবুতলা পার্ক', active: true, stampColor: 'bg-[#8B1E2D]' },
    { id: 'south', serial: 'SO-1433-C', name: 'দক্ষিণ কলকাতা', subtitle: 'South Calcutta Tour', desc: 'ম্যাডক্স স্কোয়ার, সুরুচি সঙ্ঘ, ত্রিধারা', active: true, stampColor: 'bg-[#8B1E2D]' }
  ];


  return (
    <div className="relative w-full h-[100svh] bg-night overflow-hidden font-serif">

      {/* Full Bleed Background Image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center animate-fade-in-slow"
          style={{
            backgroundImage: `url('/kolkata-twilight.png')`,
            animationDelay: '0.2s'
          }}
        />
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-night/50 mix-blend-multiply pointer-events-none"></div>
      </div>

      {/* 3-Column Editorial Layout */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 w-full px-8 md:px-16 lg:px-24 z-20 flex flex-col lg:flex-row items-center justify-between gap-12 max-w-[1600px] mx-auto pointer-events-none">
        
        {/* LEFT COLUMN: Title & CTA */}
        <div className="w-full lg:max-w-xl pointer-events-auto flex flex-col items-start text-left animate-fade-in-slow" style={{ animationDelay: '0.4s' }}>
          {/* Small top label */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] font-mono tracking-widest text-paper/70">সংখ্যা ০৬</span>
            <div className="w-16 h-px bg-[#E5B05C]/50"></div>
            <span className="text-[10px] font-mono tracking-widest text-paper/70">শহরের পুজোর ডায়েরি</span>
          </div>

          {/* Massive Title */}
          <h1 className="text-7xl md:text-[8rem] lg:text-[10rem] leading-none font-normal text-paper tracking-tighter mb-12 drop-shadow-2xl">
            শিউ<span className="text-[#E5B05C]">লি</span>
          </h1>

          {/* Poetic Subtitle */}
          <div className="mb-12 border-l border-[#E5B05C]/30 pl-6">
            <p className="text-xl md:text-2xl text-paper/90 leading-relaxed font-light drop-shadow-md">
              শহর যখন আলোয় সেজে ওঠে,<br />
              প্রতিটি গলিই হয়ে ওঠে<br />
              এক একটি নতুন গল্প।
            </p>
          </div>

          {/* CTA Area */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#E5B05C] hover:bg-[#d4a050] text-night px-8 py-4 text-sm font-sans tracking-widest uppercase transition-colors shadow-lg pointer-events-auto"
            >
              পথচলা শুরু করুন &rarr;
            </button>
            <span className="text-[10px] font-mono tracking-widest text-paper/50">
              ০৮ মিনিটের পাঠ
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: Decorative Spacer */}
        <div className="hidden lg:flex flex-col items-center animate-fade-in-slow" style={{ animationDelay: '0.6s' }}>
          <div className="w-[1px] h-24 bg-gradient-to-b from-[#E5B05C]/30 to-transparent"></div>
        </div>

        {/* RIGHT COLUMN: Description */}
        <div className="w-full lg:max-w-md pointer-events-auto flex flex-col items-end animate-fade-in-slow hidden lg:block" style={{ animationDelay: '0.8s' }}>
          <div className="bg-night/40 backdrop-blur-md border border-paper/10 p-8 rounded-3xl space-y-6 shadow-2xl w-full">
            <div className="flex items-center gap-3">
              <span className="text-[#E5B05C] text-[10px] font-mono tracking-widest uppercase">সহযাত্রী</span>
              <div className="h-px flex-grow bg-paper/20"></div>
            </div>
            
            <div className="space-y-4">
              <p className="text-paper/90 text-sm leading-relaxed font-light text-justify">
                <strong className="text-[#E5B05C] font-normal">শিউলি</strong> একটি আধুনিক ওয়েব মাধ্যম, যা কলকাতার দুর্গাপূজা ভ্রমণের অভিজ্ঞতাকে আরও সহজ ও আনন্দময় করে তোলে। দর্শনার্থীরা সহজেই বিখ্যাত সব প্যান্ডেল ও সেখানে পৌঁছানোর সেরা পথ খুঁজে নেওয়ার পাশাপাশি কাছাকাছি মেট্রো স্টেশন, রেস্তোরাঁ, ক্যাফে, হাসপাতাল, ফার্মেসি এবং পুলিশ স্টেশনের অবস্থান এক ছাদের তলায় পেয়ে যাবেন।
              </p>
              <p className="text-paper/80 text-sm leading-relaxed font-light text-justify">
                হরেক রকমের অ্যাপে খোঁজাখুঁজির ঝক্কি এড়িয়ে, শিউলি হয়ে উঠবে প্যান্ডেল হপিংয়ের একমাত্র বিশ্বস্ত সহযাত্রী। এটি উৎসবের দিনগুলিতে আপনার পথ চলাকে আরও সুরক্ষিত, সুপরিকল্পিত ও স্বাচ্ছন্দ্যময় করতে সাহায্য করবে।
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Popup for Zone Selection */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-night/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in-fast pointer-events-auto">
          <div className="bg-[#FAF6ED] text-ink w-full max-w-md p-8 border-4 border-double border-[#8B1E2D]/40 shadow-2xl relative rounded-3xl overflow-hidden">
            {/* Vintage Paper texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none"></div>

            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-ink/40 hover:text-bengali-red hover:border-[#8B1E2D]/30 transition-all duration-300 z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6 relative z-10">
              <div className="text-center pb-4 border-b border-ink/10 space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#8B1E2D]/80 font-bold block">শারদীয়া ভ্রমণপত্র (Zone Selector)</span>
                <h3 className="text-3xl font-serif font-bold text-ink tracking-wide">পথচলা শুরু করুন</h3>
                <div className="flex justify-center items-center gap-1.5 mt-2 opacity-40 select-none">
                  <div className="w-10 h-[1px] bg-[#D4A24C]"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#D4A24C]"></div>
                  <div className="w-10 h-[1px] bg-[#D4A24C]"></div>
                </div>
              </div>

              <div className="space-y-5">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    disabled={!zone.active}
                    onClick={() => {
                      if (zone.active) {
                        onSelectZone(zone.id as 'north' | 'central' | 'south');
                        setIsModalOpen(false);
                      }
                    }}
                    className={`w-full text-left relative overflow-hidden flex items-stretch border rounded-2xl transition-all duration-500 group/ticket ${
                      zone.active
                        ? 'border-ink/10 bg-white hover:border-[#D4A24C] hover:shadow-xl hover:-rotate-1 hover:scale-[1.02] cursor-pointer'
                        : 'border-ink/5 bg-ink/5 opacity-55 cursor-not-allowed'
                    }`}
                  >
                    {/* Ticket Punch Circles */}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 rounded-full bg-[#FAF6ED] border-r border-ink/15 z-10"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 -right-2.5 w-5 h-5 rounded-full bg-[#FAF6ED] border-l border-ink/15 z-10"></div>

                    {/* Stamp Indicator Column */}
                    <div className={`w-3.5 ${zone.stampColor} transition-colors duration-500 relative flex-shrink-0`}>
                      <div className="absolute inset-y-0 right-0 w-[0.5px] bg-white/25"></div>
                    </div>

                    {/* Ticket Main Area */}
                    <div className="flex-1 p-5 pl-7 pr-7 flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif text-lg font-bold text-ink group-hover/ticket:text-[#8B1E2D] transition-colors">{zone.name}</span>
                          </div>
                          <span className="text-[9px] font-mono text-ink/30 tracking-widest uppercase block mt-0.5">{zone.subtitle}</span>
                        </div>
                        
                        {zone.active ? (
                          <span className="text-[9px] font-mono text-[#8B1E2D] bg-[#8B1E2D]/10 border border-[#8B1E2D]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">ACTIVE</span>
                        ) : (
                          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-200/50 border border-zinc-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">SOON</span>
                        )}
                      </div>

                      <div className="border-t border-dashed border-ink/10 pt-2 flex justify-between items-end gap-4">
                        <p className="text-[11px] font-sans text-ink/60 leading-normal line-clamp-2">{zone.desc}</p>
                        <span className="text-[8px] font-mono text-[#D4A24C] font-semibold tracking-wider flex-shrink-0 bg-gold-glow/10 px-1.5 py-0.5 border border-[#D4A24C]/10 select-none">
                          {zone.serial}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Decorative bottom element */}
              <div className="text-center pt-2">
                <span className="text-[8px] font-mono text-ink/30 tracking-[0.4em] uppercase select-none">শিউলি দুর্গাপূজা ভ্রমণ সহায়িকা</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSection;