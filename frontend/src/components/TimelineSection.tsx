import React from 'react';
import { Train, Compass, Utensils } from 'lucide-react';

interface StationInfo {
  id: string;
  name: string;
  englishName: string;
  lineNo: string;
  pandals: string[];
  eateries: string[];
  details: string;
  anchorId: string; // ID of right-canvas element to scroll to
}

const stationsData: StationInfo[] = [
  {
    id: 'dumdum',
    name: 'দমদম',
    englishName: 'Dum Dum',
    lineNo: '০১',
    pandals: ['শ্রীভূমি স্পোর্টিং', 'দমদম পার্ক তরুণ দল'],
    eateries: ['স্টেশন মোড়ের ডিমের চপ'],
    details: 'উত্তর কলকাতার প্রধান প্রবেশদ্বার। সিঁথি মোড় থেকে লেক টাউন পর্যন্ত বিস্তৃত থিমপুজো দেখার সংযোগস্থল।',
    anchorId: 'today-journey' // Scrolls to tickets section
  },
  {
    id: 'kumartuli',
    name: 'কুমোরটুলি',
    englishName: 'Shobhabazar (Exit 2)',
    lineNo: '০২',
    pandals: ['কুমোরটুলি সর্বজনীন', 'কুমোরটুলি পার্ক'],
    eateries: ['লক্ষ্মী নারায়ণ সাউয়ের তেলেভাজা'],
    details: 'যেখানে প্রতিমা নিজের অবয়ব আর শিল্পীর তুলির ছোঁয়ায় প্রাণ পায়। সংকীর্ণ অলিগলিতে খড়ের কাঠামো ও মাটির সুবাস।',
    anchorId: 'today-journey'
  },
  {
    id: 'bagbazar',
    name: 'বাগবাজার',
    englishName: 'Shobhabazar (Exit 1)',
    lineNo: '০৩',
    pandals: ['বাগবাজার সর্বজনীন'],
    eateries: ['বাগবাজার রসগোল্লা', 'মিত্র ক্যাফে'],
    details: 'শত বছরের ঐতিহ্যবাহী বনেদি ও বিশুদ্ধ সাবেকি পুজোর প্রাণকেন্দ্র। গঙ্গার ধারে সিঁদুর খেলার জন্য বিখ্যাত।',
    anchorId: 'editorial-bagbazar' // Scrolls to Bagbazar editorial story
  },
  {
    id: 'college-square',
    name: 'কলেজ স্কোয়ার',
    englishName: 'Central / MG Road',
    lineNo: '০৪',
    pandals: ['কলেজ স্কোয়ার সর্বজনীন', 'সন্তোষ মিত্র স্কোয়ার'],
    eateries: ['প্যারামাউন্টের শরবত', 'পুঁটিরামের কচুরি'],
    details: 'বইপাড়ার চিরন্তন আবেগ ও লেকের জলের উপর ভাসমান আলোকসজ্জার মায়া। বিশালাকার মণ্ডপ ও আলোকসজ্জা।',
    anchorId: 'today-journey'
  },
  {
    id: 'md-ali-park',
    name: 'মোহাম্মদ আলি পার্ক',
    englishName: 'Central (Exit 3)',
    lineNo: '০৫',
    pandals: ['মোহাম্মদ আলি পার্ক পুজো'],
    eateries: ['এম জি রোডের লস্যি', 'চাট'],
    details: 'প্রাচীন কেল্লা বা রাজপ্রাসাদের আদলে তৈরি বিশালাকার থিমভিত্তিক মণ্ডপ এবং সূক্ষ্ম কারুকার্য।',
    anchorId: 'today-journey'
  }
];

interface TimelineSectionProps {
  activeStationIndex: number;
  onStationSelect: (index: number, anchorId: string) => void;
}

const TimelineSection: React.FC<TimelineSectionProps> = ({ activeStationIndex, onStationSelect }) => {
  const currentStation = stationsData[activeStationIndex];

  return (
    <div className="space-y-8 py-2">
      
      {/* Small Vertical Timeline Track */}
      <div className="relative pl-6 space-y-6">
        
        {/* Track Line */}
        <div className="absolute top-2 bottom-2 left-[31px] w-[1px] bg-lamp/20 z-0"></div>

        {stationsData.map((station, index) => {
          const isActive = index === activeStationIndex;
          return (
            <button
              key={station.id}
              onClick={() => onStationSelect(index, station.anchorId)}
              className="w-full flex items-center gap-4 text-left focus:outline-none group relative z-10"
            >
              {/* Line Node Dot */}
              <div className={`w-4 h-4 rounded-full bg-night flex items-center justify-center border transition-all ${
                isActive ? 'border-lamp' : 'border-paper/20 group-hover:border-lamp/40'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isActive ? 'bg-bengali-red' : 'bg-paper/10 group-hover:bg-paper/30'
                }`}></div>
              </div>

              {/* Station Label */}
              <div className="flex flex-col">
                <span className={`text-[10px] font-mono leading-none tracking-widest ${
                  isActive ? 'text-lamp/80 font-bold' : 'text-paper/30'
                }`}>
                  STA-{station.lineNo}
                </span>
                <span className={`font-serif text-base tracking-wide transition-colors ${
                  isActive ? 'text-lamp font-bold' : 'text-paper/60 group-hover:text-paper'
                }`}>
                  {station.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Station Detail panel - nested directly inside the sidebar column */}
      <div className="bg-paper/5 border border-lamp/15 p-5 text-paper space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-lamp/15 pb-3">
          <Train className="w-4 h-4 text-lamp/80" strokeWidth={1.5} />
          <div>
            <h4 className="font-serif font-bold text-sm text-lamp">{currentStation.name}</h4>
            <p className="text-[9px] font-mono tracking-wider text-paper/40 uppercase">{currentStation.englishName}</p>
          </div>
        </div>

        <p className="font-sans text-[11px] text-paper/70 leading-relaxed text-justify">
          {currentStation.details}
        </p>

        {/* Small grids for eateries and pandals */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-lamp/10 text-[10px] text-paper/80 font-sans">
          <div className="space-y-1.5">
            <span className="font-serif italic text-lamp/90 font-bold flex items-center gap-1">
              <Compass className="w-3 h-3" /> মণ্ডপ
            </span>
            <ul className="space-y-1 list-none pl-0">
              {currentStation.pandals.slice(0, 2).map((pandal, idx) => (
                <li key={idx} className="truncate">• {pandal}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-1.5">
            <span className="font-serif italic text-lamp/90 font-bold flex items-center gap-1">
              <Utensils className="w-3 h-3" /> স্বাদ
            </span>
            <ul className="space-y-1 list-none pl-0">
              {currentStation.eateries.slice(0, 2).map((eat, idx) => (
                <li key={idx} className="truncate">• {eat}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TimelineSection;
export { stationsData };