import React, { useState } from 'react';
import { Train, Footprints, Info, X, MapPin } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  metro: string;
  walking: string;
  routeDetails: string;
  attraction: string;
  category: 'north' | 'south' | 'bonedi';
  nearMetro: boolean;
  serial: string;
  price: string;
}

const ticketData: Ticket[] = [
  {
    id: 'college-square',
    title: 'কলেজ স্কোয়ার',
    metro: 'সেন্ট্রাল মেট্রো',
    walking: '৬ মিনিট হাঁটা',
    routeDetails: 'সেন্ট্রাল মেট্রোর ৪ নম্বর গেট দিয়ে বেরিয়ে চিত্তরঞ্জন অ্যাভিনিউ ধরে সোজা হেঁটে মহাত্মা গান্ধী রোড ক্রসিং পার হলেই সামনে কলেজ স্কোয়ারের তোরণ দৃশ্যমান হবে।',
    attraction: 'বিশাল লেকের জলের উপর প্রতিফলিত চোখ ধাঁধানো আলোকসজ্জা এবং সাবেকি ডাকের সাজের প্রতিমা।',
    category: 'north',
    nearMetro: true,
    serial: 'CAL-0982-A',
    price: '৬ পাই'
  },
  {
    id: 'bagbazar',
    title: 'বাগবাজার সর্বজনীন',
    metro: 'শ্যামবাজার মেট্রো',
    walking: '১০ মিনিট হাঁটা',
    routeDetails: 'শ্যামবাজার মেট্রোর ৪ নম্বর গেট দিয়ে বেরিয়ে গিরীশ অ্যাভিনিউ ধরে সোজা এগিয়ে বাগবাজার ঘাটের দিকে ২ মিনিট হাঁটলেই পুজো প্রাঙ্গণ।',
    attraction: 'শত বছরের ঐতিহ্যবাহী একচালা সাবেকি প্রতিমা ও বাংলার বনেদি পূজা সংস্কৃতির বিশুদ্ধ রূপ।',
    category: 'north',
    nearMetro: true,
    serial: 'CAL-1104-B',
    price: '৮ পাই'
  },
  {
    id: 'maddox-square',
    title: 'ম্যাডক্স স্কোয়ার',
    metro: 'নেতাজি ভবন মেট্রো',
    walking: '১২ মিনিট হাঁটা',
    routeDetails: 'নেতাজি ভবন মেট্রো থেকে বেরিয়ে শরৎ বোস রোড ধরে সোজা আশুতোষ মুখার্জি রোডের দিকে এগিয়ে ল্যান্সডাউন রোডের ক্রসিং অতিক্রম করে ডানদিকের মাঠে।',
    attraction: 'কলকাতার দুর্গাপুজোর সেরা ঐতিহাসিক আড্ডার কেন্দ্রস্থল। ঘাসের ওপর বসে বন্ধুদের সাথে গভীর আড্ডা।',
    category: 'south',
    nearMetro: true,
    serial: 'CAL-4530-C',
    price: '১০ পাই'
  },
  {
    id: 'sreebhumi',
    title: 'শ্রীভূমি স্পোর্টিং',
    metro: 'উল্টোডাঙা স্টেশন',
    walking: '১৫ মিনিট হাঁটা',
    routeDetails: 'উল্টোডাঙা স্টেশন থেকে ভিআইপি রোড ধরে সল্টলেকের দিকে যাওয়ার অটো বা রিকশা ধরে সরাসরি শ্রীভূমি ক্রসিং।',
    attraction: 'বিশ্ববিখ্যাত স্মৃতিস্তম্ভের আদলে নির্মিত আকাশছোঁয়া থিম প্যান্ডেল এবং চমৎকার আলোর কারুকাজ।',
    category: 'north',
    nearMetro: false,
    serial: 'CAL-7702-D',
    price: '১২ পাই'
  },
  {
    id: 'shobhabazar-rajbari',
    title: 'শোভাবাজার রাজবাড়ি',
    metro: 'শোভাবাজার মেট্রো',
    walking: '৫ মিনিট হাঁটা',
    routeDetails: 'শোভাবাজার মেট্রো স্টেশন থেকে বেরিয়ে রাজা নবকৃষ্ণ স্ট্রিট ধরে হেঁটে সরাসরি শোভাবাজার রাজবাড়ির নাটমন্দিরে প্রবেশ।',
    attraction: '১৭৫৭ সাল থেকে চলে আসা ঐতিহাসিক বনেদি রাজপরিবারের একচালা ঠাকুর এবং ঐতিহ্যমণ্ডিত আরতি দর্পণ পুজো।',
    category: 'bonedi',
    nearMetro: true,
    serial: 'CAL-1757-E',
    price: '৪ পাই'
  },
  {
    id: 'sabarna-roy-choudhury',
    title: 'সাবর্ণ রায়চৌধুরী পুজো',
    metro: 'বেহালা চৌরাস্তা (অটো)',
    walking: '৮ মিনিট হাঁটা',
    routeDetails: 'বেহালা চৌরাস্তা ট্রাম ডিপো সংলগ্ন রাস্তা ধরে হেঁটে বরিশা জোড়াসাঁকো আটচালার ঐতিহাসিক সাবর্ণ রায়চৌধুরী বসতবাড়ি।',
    attraction: '১৬১০ সালের কলকাতার সবচেয়ে প্রাচীন ঐতিহাসিক আটচালা দুর্গাপুজো এবং প্রাচীন পুঁথিপত্র ও রীতিনীতি।',
    category: 'bonedi',
    nearMetro: false,
    serial: 'CAL-1610-F',
    price: '৫ পাই'
  }
];

interface JourneySectionProps {
  searchQuery: string;
  activeFilter: string;
  onSearch: (query: string) => void;
}

const JourneySection: React.FC<JourneySectionProps> = ({ searchQuery, activeFilter, onSearch }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const filteredTickets = ticketData.filter(ticket => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'north' && ticket.category !== 'north') return false;
      if (activeFilter === 'south' && ticket.category !== 'south') return false;
      if (activeFilter === 'bonedi' && ticket.category !== 'bonedi') return false;
      if (activeFilter === 'metro' && !ticket.nearMetro) return false;
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(q) ||
        ticket.metro.toLowerCase().includes(q) ||
        ticket.attraction.toLowerCase().includes(q)
      );
    }
    
    return true;
  });

  return (
    <section id="today-journey" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-10 relative">
      
      {/* Top clean line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[0.5px] bg-ink/10"></div>

      <div className="text-center mb-20 space-y-3">
        <span className="text-[10px] font-mono tracking-widest text-ink/40 uppercase block">II • পথচলা ডায়েরি</span>
        <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-widest font-normal">আজকের পথচলা</h2>
        <p className="text-xs font-sans text-ink/50 italic max-w-md mx-auto">
          মেট্রো ও পায়ে হাঁটা পথের সংক্ষিপ্ত হদিশ...
        </p>
      </div>

      {filteredTickets.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-12 md:gap-y-20 relative z-10">
          {filteredTickets.map((ticket, i) => (
            <div 
              key={ticket.id} 
              className={`w-full md:w-[45%] lg:w-[30%] bg-paper text-ink p-8 border border-ink/5 flex flex-col justify-between min-h-[22rem] relative hover:bg-[#FAF6ED] transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl group ${
                i % 3 === 1 ? 'lg:mt-24 md:mt-16' : ''
              } ${
                i % 3 === 2 ? 'lg:mt-48' : ''
              }`}
            >
              {/* Ticket Contents */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-3xl font-serif font-normal text-ink tracking-wide pb-2 border-b border-bengali-red/20 w-full pr-12 group-hover:border-bengali-red transition-colors">
                    {ticket.title}
                  </h3>
                  
                  {/* Subtle Red Number in Corner */}
                  <span className="absolute top-8 right-8 text-[9px] font-mono text-bengali-red/40 font-semibold tracking-widest select-none">
                    {ticket.serial}
                  </span>
                </div>
                
                <div className="space-y-4 font-sans text-ink/60 text-xs tracking-wide">
                  <div className="flex items-center gap-3">
                    <Train className="w-4 h-4 text-bengali-red/40" strokeWidth={1} />
                    <span>মেট্রো: <span className="font-serif text-ink italic">{ticket.metro}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Footprints className="w-4 h-4 text-bengali-red/40" strokeWidth={1} />
                    <span>দূরত্ব: <span className="font-serif text-ink italic">{ticket.walking}</span></span>
                  </div>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="pt-6 border-t border-ink/5 flex justify-between items-end">
                <span className="font-serif italic text-[11px] text-ink/40 tracking-wider">মূল্য: {ticket.price}</span>
                
                <button 
                  onClick={() => setSelectedTicket(ticket)}
                  className="text-bengali-red/80 hover:text-bengali-red font-serif italic text-sm transition-colors border-b border-transparent hover:border-bengali-red pb-0.5 tracking-wide"
                >
                  পথ দেখুন →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#FAF6ED] border border-ink/10 max-w-lg mx-auto">
          <p className="text-sm font-serif italic text-ink/50">
            কোনো প্যান্ডেল খুঁজে পাওয়া যায়নি।
          </p>
          <button 
            onClick={() => onSearch('')} 
            className="mt-3 text-xs font-sans text-bengali-red underline hover:text-ink transition-colors"
          >
            অনুসন্ধান মুছুন
          </button>
        </div>
      )}

      {/* Simplified Ledger Modal Detail */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-night/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div 
            className="bg-[#FAF6ED] text-ink w-full max-w-md p-8 border border-ink/20 shadow-xl relative"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 text-ink/40 hover:text-bengali-red transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Simple Ledger Layout */}
            <div className="space-y-6">
              <div className="text-center pb-4 border-b border-ink/10 space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-bengali-red/60 font-semibold">{selectedTicket.serial}</span>
                <h3 className="text-3xl font-serif font-bold text-ink">{selectedTicket.title}</h3>
              </div>

              {/* Transit Map / Guide info */}
              <div className="space-y-4 text-xs font-sans text-ink/80">
                <div className="flex items-start gap-3">
                  <Train className="w-4 h-4 text-bengali-red/75 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40">মেট্রো স্টেশন</span>
                    <p className="font-serif text-sm text-ink font-semibold">{selectedTicket.metro}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Footprints className="w-4 h-4 text-bengali-red/75 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40">হাঁটার দূরত্ব</span>
                    <p className="font-serif text-sm text-ink font-semibold">{selectedTicket.walking}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/5 pt-3">
                  <MapPin className="w-4 h-4 text-bengali-red/75 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40">যাতায়াত পথ</span>
                    <p className="text-xs text-ink/75 leading-relaxed text-justify">{selectedTicket.routeDetails}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/5 pt-3">
                  <Info className="w-4 h-4 text-bengali-red/75 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink/40">আকর্ষণ</span>
                    <p className="font-serif text-xs text-ink/75 leading-relaxed text-justify italic">{selectedTicket.attraction}</p>
                  </div>
                </div>
              </div>

              {/* Bottom ledger markings */}
              <div className="flex justify-between items-center border-t border-ink/10 pt-4 text-[9px] font-mono text-ink/40 select-none">
                <span>FARES: {selectedTicket.price}</span>
                <span>PUNCH NO. 1433</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default JourneySection;