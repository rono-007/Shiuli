import React, { useState } from 'react';
import { X, Calendar, Phone, Train, CloudSun, Clock, ShieldAlert, ChevronDown, AlertCircle, Info, ArrowRight, Sun, Moon } from 'lucide-react';

interface EssentialInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EssentialInfoModal: React.FC<EssentialInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'helpline' | 'metro' | 'weather'>('schedule');
  const [expandedDay, setExpandedDay] = useState<string | null>('Maha Shashthi');

  if (!isOpen) return null;

  const scheduleEvents = [
    {
      id: 'Mahalaya',
      day: 'Mahalaya',
      date: '10 October 2026',
      status: 'The Countdown Begins',
      description: 'Mahalaya marks the end of Pitru Paksha and the beginning of Devi Paksha — the fifteen days during which Goddess Durga is believed to journey toward Earth.',
      significance: 'A day of remembrance and anticipation, marking the formal invocation of the Goddess.',
      theme: { bg: 'bg-[#C25953]', text: 'text-[#C25953]', border: 'border-[#C25953]', lightBg: 'bg-[#C25953]/10', ring: 'ring-[#C25953]/20' },
      rituals: [
        'Pre-dawn Mahishasura Mardini radio broadcast',
        'Riverbank Tarpan rituals to honor ancestors',
        'Chokkhu Daan (painting the eyes of idols)'
      ],
      timings: 'Early morning (Pre-dawn)'
    },
    {
      id: 'Maha Shashthi',
      day: 'Maha Shashthi',
      date: '16 October 2026',
      status: 'The Goddess Arrives',
      description: 'Shashthi is the formal start of Durga Puja. The Bodhan ritual ceremonially awakens the Goddess, and she is unveiled to the public.',
      significance: 'The Goddess is welcomed with Bodhan, Amantran, and Adhivas, establishing her presence.',
      theme: { bg: 'bg-[#941F28]', text: 'text-[#941F28]', border: 'border-[#941F28]', lightBg: 'bg-[#941F28]/10', ring: 'ring-[#941F28]/20' },
      rituals: [
        'Bodhan (Awakening of the Goddess)',
        'Amantran & Adhivas (Invocation)',
        'Bilva Nimantran'
      ],
      timings: 'Bilva Nimantran: 3:41 PM – 6:00 PM | Shashthi Tithi starts 3:25 AM'
    },
    {
      id: 'Maha Saptami',
      day: 'Maha Saptami',
      date: '17–18 October 2026',
      status: 'Rituals Begin',
      description: 'Saptami opens with the photogenic Nabapatrika Snan — bathing of nine sacred plants representing nine forms of Goddess Durga.',
      significance: 'The core worship begins after the establishment of the Nabapatrika (Kola Bou).',
      theme: { bg: 'bg-[#C68628]', text: 'text-[#C68628]', border: 'border-[#C68628]', lightBg: 'bg-[#C68628]/10', ring: 'ring-[#C68628]/20' },
      rituals: [
        'Nabapatrika Snan (Kola Bou Snan at dawn)',
        'Pran Pratishtha (Infusing life into the idol)',
        'Saptami Puja'
      ],
      timings: 'Kola Bou Snan: Early Dawn | Saptami Tithi: 5:54 AM (17 Oct) to 8:27 AM (18 Oct)'
    },
    {
      id: 'Maha Ashtami',
      day: 'Maha Ashtami',
      date: '19 October 2026',
      status: 'The Most Powerful Day',
      description: 'The most vital day of the festival, featuring Pushpanjali, Kumari Puja, and the sacred Sandhi Puja at the juncture of Ashtami and Navami.',
      significance: 'A day of intense devotion, celebrating the Goddess in her most powerful forms.',
      theme: { bg: 'bg-[#6B121C]', text: 'text-[#6B121C]', border: 'border-[#6B121C]', lightBg: 'bg-[#6B121C]/10', ring: 'ring-[#6B121C]/20' },
      rituals: [
        'Morning Pushpanjali (Floral offerings)',
        'Kumari Puja (Worshipping young girls)',
        'Sandhi Puja (108 lamps offering)'
      ],
      timings: 'Ashtami Tithi: 8:27 AM (18 Oct) to 10:51 AM (19 Oct) | Check local pandal for Sandhi Puja window'
    },
    {
      id: 'Maha Navami',
      day: 'Maha Navami',
      date: '20 October 2026',
      status: 'The Grand Finale',
      description: 'The last full day of worship, marked by Maha Aarti, elaborate bhog offerings, and the biggest festive feasts of the year.',
      significance: 'The culmination of the Puja, transitioning from solemn rituals to grand cultural celebrations.',
      theme: { bg: 'bg-[#B84358]', text: 'text-[#B84358]', border: 'border-[#B84358]', lightBg: 'bg-[#B84358]/10', ring: 'ring-[#B84358]/20' },
      rituals: [
        'Navami-vihita Puja',
        'Maha Aarti & Dhunuchi Naach',
        'Special Durga Puja Bhog distribution'
      ],
      timings: 'Navami Tithi ends at 9:31 AM (20 Oct)'
    },
    {
      id: 'Vijaya Dashami',
      day: 'Vijaya Dashami',
      date: '21 October 2026',
      status: 'Farewell to Maa',
      description: 'An emotional farewell as Dashami worship and idol immersion (visarjan) are completed, highlighted by the vibrant Sindoor Khela.',
      significance: 'The Goddess returns to her heavenly abode, marking the triumph of good over evil.',
      theme: { bg: 'bg-[#823F46]', text: 'text-[#823F46]', border: 'border-[#823F46]', lightBg: 'bg-[#823F46]/10', ring: 'ring-[#823F46]/20' },
      rituals: [
        'Dashami Puja & Darpan Bisarjan',
        'Sindoor Khela (Vermilion ritual)',
        'Idol Immersion (Visarjan) processions'
      ],
      timings: 'Vijay Muhurat: 2:06 PM – 2:52 PM (21 Oct)'
    }
  ];

  const toggleDay = (id: string) => {
    setExpandedDay(expandedDay === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2B231D]/80 backdrop-blur-sm p-0 sm:p-6 font-serif">
      {/* Modal Dialog Card */}
      <div 
        className="bg-[#FCFBF8] bg-cover bg-center bg-no-repeat rounded-none sm:rounded-[1.5rem] shadow-2xl w-full max-w-[1000px] h-full sm:h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative z-[100]"
        style={{ backgroundImage: "url('/essential-card.webp')" }}
      >
        
        {/* 1. PREMIUM HEADER */}
        <div className="bg-transparent shrink-0 relative">
          <div className="px-4 pt-36 sm:pt-40 pb-2 sm:pb-3 sm:px-8 flex flex-col items-center justify-center text-center relative z-10">
            <div className="hidden sm:flex flex-col items-center gap-1">
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight font-serif text-[#7A1F26] leading-tight">
                Durga Puja 2026
              </h2>
              <p className="text-[11px] sm:text-sm text-[#8C7A6B] font-serif mt-0.5 font-medium">
                Your Complete Festival Guide
              </p>
            </div>

            <button 
              onClick={onClose}
              className="absolute right-4 sm:right-6 top-4 sm:top-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/50 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 z-[110] shadow-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. NAVIGATION TABS */}
        <div className="px-4 sm:px-8 py-2.5 sm:py-3 bg-transparent border-b border-[#EAE3D9]/60 flex items-center justify-start sm:justify-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none shrink-0 shadow-sm z-10">
          {[
            { id: 'schedule', label: 'Puja Schedule', icon: <Calendar className="w-4 h-4" /> },
            { id: 'helpline', label: 'Emergency', icon: <ShieldAlert className="w-4 h-4" /> },
            { id: 'metro', label: 'Metro Guide', icon: <Train className="w-4 h-4" /> },
            { id: 'weather', label: 'Weather', icon: <CloudSun className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full font-serif font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap border shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-[#941F28] text-white border-[#941F28] shadow-md' 
                  : 'bg-white text-[#5C4D43] border-[#EAE3D9] hover:border-[#DFB86C] hover:text-[#941F28]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="overflow-y-auto flex-1 custom-scrollbar bg-transparent relative">
          
          {/* TAB 1: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="max-w-4xl mx-auto px-3 sm:px-8 pt-8 pb-5 sm:py-8">
              
              {/* 3. INTRODUCTION / HERO STRIP */}
              <div className="text-center mt-2 sm:mt-0 mb-8 sm:mb-10">
                <div className="inline-flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-[#941F28]" />
                  <h3 className="text-xl sm:text-2xl font-bold text-[#3A2E28] font-serif">
                    Durga Puja 2026 — Day-by-Day Guide
                  </h3>
                </div>
                <p className="text-[#6E5D52] text-sm sm:text-base max-w-2xl mx-auto font-sans leading-relaxed">
                  Explore the rituals, traditions, important timings and highlights of each day.
                </p>
                
                {/* Decorative divider */}
                <div className="flex items-center justify-center gap-3 mt-6 opacity-70">
                  <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#DFB86C]" />
                  <span className="text-[#941F28] text-sm">❁</span>
                  <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#DFB86C]" />
                </div>
              </div>

              {/* 4. FESTIVAL TIMELINE */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-3.5 sm:left-6 top-4 bottom-4 w-[2px] bg-[#EAE3D9]" />

                <div className="space-y-5 sm:space-y-6">
                  {scheduleEvents.map((evt) => {
                    const isExpanded = expandedDay === evt.id;
                    const isCurrent = evt.id === 'Maha Shashthi'; // Just a demo highlight

                    return (
                      <div key={evt.id} className="relative pl-8 sm:pl-16 pr-0 sm:pr-4">
                        {/* Timeline Node */}
                        <div className={`absolute left-[8px] sm:left-[18px] top-5 sm:top-6 w-3.5 h-3.5 rounded-full border-2 bg-[#FCFBF8] z-10 transition-colors duration-300 ${isExpanded || isCurrent ? `${evt.theme.border} ${evt.theme.bg}` : 'border-[#DFB86C]'}`} />

                        {/* Accordion Card */}
                        <div 
                          className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${isExpanded ? `${evt.theme.border} shadow-md ring-1 ${evt.theme.ring}` : 'border-[#EAE3D9] hover:border-[#DFB86C]/40'}`}
                        >
                          {/* Collapsed Header */}
                          <div 
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-2 sm:gap-3"
                            onClick={() => toggleDay(evt.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-sans tracking-wide transition-colors ${isExpanded || isCurrent ? `${evt.theme.bg} text-white` : 'bg-[#F2EDE4] text-[#5C4D43]'}`}>
                                  {evt.date}
                                </span>
                                {isCurrent && (
                                  <span className="flex h-2 w-2 relative">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${evt.theme.bg} opacity-75`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${evt.theme.bg}`}></span>
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-lg sm:text-xl font-bold font-serif transition-colors leading-tight mb-1 sm:mb-0 ${isExpanded || isCurrent ? evt.theme.text : 'text-[#3A2E28]'}`}>
                                {evt.day}
                              </h4>
                              <p className="text-sm text-[#6E5D52] font-sans mt-1 line-clamp-2 sm:line-clamp-1">
                                {evt.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[#EAE3D9] shrink-0">
                              <span className={`text-xs sm:text-sm italic font-serif font-medium transition-colors ${isExpanded || isCurrent ? evt.theme.text : 'text-[#DFB86C]'}`}>
                                {evt.status}
                              </span>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isExpanded ? `${evt.theme.lightBg} ${evt.theme.text} rotate-180` : 'bg-[#F2EDE4] text-[#8C7A6B]'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* 5. EXPANDABLE DETAILS */}
                          <div 
                            className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 border-t border-[#EAE3D9]/60' : 'max-h-0 opacity-0'}`}
                          >
                            <div className="p-4 sm:p-6 bg-[#FCFBF8]">
                              <p className="text-sm text-[#5C4D43] font-sans leading-relaxed mb-6 italic border-l-2 border-[#DFB86C] pl-4">
                                "{evt.significance}"
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* 6. KEY HIGHLIGHTS DESIGN */}
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] font-sans mb-3">Key Rituals</h5>
                                  {evt.rituals.map((ritual, rIdx) => (
                                    <div key={rIdx} className="bg-white border border-[#EAE3D9] rounded-lg p-3 flex items-start gap-3 shadow-xs">
                                      <span className="text-[#DFB86C] shrink-0 mt-0.5">✦</span>
                                      <span className="text-sm text-[#3A2E28] font-sans">{ritual}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] font-sans mb-3">Important Timings</h5>
                                  <div className="bg-white border border-[#EAE3D9] rounded-lg p-4 flex items-start gap-3 shadow-xs h-full">
                                    <Clock className="w-5 h-5 text-[#941F28] shrink-0 mt-0.5" />
                                    <span className="text-sm text-[#3A2E28] font-sans leading-relaxed font-medium">{evt.timings}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HELPLINES */}
          {activeTab === 'helpline' && (
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-[#3A2E28] font-serif mb-2">
                  Emergency & Support Contacts
                </h3>
                <p className="text-[#6E5D52] text-sm font-sans">
                  Official 24x7 helplines for your safety and convenience during the festival.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { title: 'Kolkata Police Control Room', number: '100 / 033-2214-3024', desc: 'Central Lalbazar Police Control', icon: <ShieldAlert className="w-5 h-5" /> },
                  { title: 'Medical Emergency & Ambulance', number: '102 / 033-2286-0000', desc: 'State Health Department Services', icon: <Phone className="w-5 h-5" /> },
                  { title: 'Women Safety Helpline', number: '1091 / 033-2214-1913', desc: '24x7 Dedicated Women Security Line', icon: <ShieldAlert className="w-5 h-5" /> },
                  { title: 'Child Helpline', number: '1098', desc: 'Emergency Child Support', icon: <Phone className="w-5 h-5" /> },
                  { title: 'Fire Brigade Services', number: '101 / 033-2252-1165', desc: 'Fire Control Room Kolkata', icon: <AlertCircle className="w-5 h-5" /> },
                  { title: 'Disaster Management', number: '1070 / 033-2214-3526', desc: 'Emergency Relief Services', icon: <Info className="w-5 h-5" /> }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#F2EDE4] text-[#941F28] flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-[#3A2E28] text-sm sm:text-base font-serif mb-1">{item.title}</p>
                      <p className="text-lg sm:text-xl font-extrabold text-[#941F28] font-sans tracking-wide mb-1">{item.number}</p>
                      <p className="text-xs text-[#8C7A6B] font-sans">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: METRO TIMINGS */}
          {activeTab === 'metro' && (
             <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-[#3A2E28] font-serif mb-2">
                  Special Puja Transit Guide
                </h3>
                <p className="text-[#6E5D52] text-sm font-sans">
                  Extended night services and special arrangements for seamless pandal hopping.
                </p>
              </div>

              <div className="space-y-6 font-sans">
                <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <Train className="w-6 h-6 text-blue-600" />
                    <h4 className="font-bold text-[#3A2E28] text-lg font-serif">Blue Line (Dakshineswar - Kavi Subhash)</h4>
                  </div>
                  <p className="text-sm text-[#5C4D43] leading-relaxed mb-4">
                    Runs <strong className="text-[#941F28]">All Night</strong> on Saptami, Ashtami, and Nabami (from 1:00 PM in the afternoon until 4:00 AM late night).
                  </p>
                  <div className="bg-[#F2EDE4] p-3 rounded-xl border border-[#EAE3D9] text-sm text-[#5C4D43] flex items-start gap-2">
                    <span className="text-[#DFB86C] shrink-0">✦</span>
                    Trains available every 6 to 12 minutes during peak night hours.
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
                   <div className="flex items-center gap-3 mb-4">
                    <Train className="w-6 h-6 text-green-600" />
                    <h4 className="font-bold text-[#3A2E28] text-lg font-serif">Green Line (Howrah Maidan - Sector V)</h4>
                  </div>
                  <p className="text-sm text-[#5C4D43] leading-relaxed mb-4">
                    Runs from 2:00 PM until 12:00 Midnight on Saptami, Ashtami, and Nabami.
                  </p>
                  <div className="bg-[#F2EDE4] p-3 rounded-xl border border-[#EAE3D9] text-sm text-[#5C4D43] flex items-start gap-2">
                    <span className="text-[#DFB86C] shrink-0">✦</span>
                    Provides direct connection across the Ganges to Howrah Station.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEATHER */}
          {activeTab === 'weather' && (
             <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-[#3A2E28] font-serif mb-2">
                  Festival Weather Forecast
                </h3>
                <p className="text-[#6E5D52] text-sm font-sans">
                  Expected conditions for October 2026 to help you plan your outings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[#FFF9E6] text-[#E5A800] mx-auto flex items-center justify-center mb-4">
                    <Sun className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#8C7A6B] font-bold uppercase tracking-wider font-sans mb-1">Daytime Temp</p>
                  <p className="text-3xl font-black text-[#3A2E28] font-sans my-2">31°<span className="text-xl text-[#8C7A6B] font-medium">C</span></p>
                  <p className="text-sm text-[#DFB86C] font-medium font-serif italic">Warm & Sunny</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 rounded-full bg-[#F0F4F8] text-[#4A6D8C] mx-auto flex items-center justify-center mb-4">
                    <Moon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#8C7A6B] font-bold uppercase tracking-wider font-sans mb-1">Nighttime Temp</p>
                  <p className="text-3xl font-black text-[#3A2E28] font-sans my-2">24°<span className="text-xl text-[#8C7A6B] font-medium">C</span></p>
                  <p className="text-sm text-[#DFB86C] font-medium font-serif italic">Pleasant for Walking</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#EAE3D9] text-center shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 rounded-full bg-[#F2EDE4] text-[#8C7A6B] mx-auto flex items-center justify-center mb-4">
                    <CloudSun className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-[#8C7A6B] font-bold uppercase tracking-wider font-sans mb-1">Rain Probability</p>
                  <p className="text-3xl font-black text-[#3A2E28] font-sans my-2">20<span className="text-xl text-[#8C7A6B] font-medium">%</span></p>
                  <p className="text-sm text-[#DFB86C] font-medium font-serif italic">Light Passing Showers</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 8. BOTTOM SECTION */}
        <div className="bg-transparent border-t border-[#EAE3D9]/60 px-4 sm:px-6 py-3 sm:py-5 flex flex-col sm:flex-row items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 mb-2.5 sm:mb-0">
             <span className="text-[#DFB86C] text-base sm:text-lg">❁</span>
             <p className="text-[#5C4D43] font-serif font-medium text-xs sm:text-base">আরও কিছু জানতে চান?</p>
             <span className="text-[#DFB86C] text-base sm:text-lg">❁</span>
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#941F28] font-serif font-bold text-xs sm:text-sm px-5 py-2 sm:py-2.5 rounded-full border border-[#DFB86C]/40 transition-colors cursor-pointer shadow-xs"
          >
            <span>Explore Puja Guide</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
