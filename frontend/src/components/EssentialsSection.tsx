import React, { useState } from 'react';
import { Coffee, Utensils, ShieldAlert, Cross, TrainFront } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface EssentialDetail {
  name: string;
  locationOrPhone: string;
  description: string;
  tag?: string;
}

interface EssentialCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  subtitle: string;
  details: EssentialDetail[];
}

const essentialsData: EssentialCategory[] = [
  {
    id: 'cafe',
    label: 'কাছাকাছি ক্যাফে',
    icon: Coffee,
    subtitle: 'পুজোর হাঁটাচলার মাঝে এক কাপ গরম কফি আর একটু স্বস্তির আড্ডা...',
    details: [
      { name: 'ইন্ডিয়ান কফি হাউস (কলেজ স্ট্রিট)', locationOrPhone: 'Central Metro সংলগ্ন', description: 'কলকাতার বৌদ্ধিক আড্ডার ঐতিহাসিক আঁতুড়ঘর। সস্তা ইনফ্লুয়েনশিয়াল কফি ও ঐতিহ্যবাহী পরিবেশ।', tag: 'ঐতিহাসিক' },
      { name: 'মিত্র ক্যাফে (শোভাবাজার)', locationOrPhone: 'Shobhabazar Metro সংলগ্ন', description: 'ক্যাফে হলেও এখানকার কাটলেট আর চপ ভুবনবিখ্যাত। পুজোর আড্ডার সেরা গন্তব্য।', tag: 'খাদ্যরসিক' },
      { name: 'দ্য ডেইলি ক্যাফে (দক্ষিণ কলকাতা)', locationOrPhone: 'Maddox Square সংলগ্ন', description: 'আধুনিক কফি প্রস্তুতকরণ এবং নান্দনিক ইউরোপীয় পরিবেশের সাথে আড্ডার মেলবন্ধন।', tag: 'ট্রেন্ডি' }
    ]
  },
  {
    id: 'food',
    label: 'খাওয়ার জায়গা',
    icon: Utensils,
    subtitle: 'পুজো পরিক্রমার অবিচ্ছেদ্য অংশ—কলকাতার রাজকীয় স্বাদ...',
    details: [
      { name: 'আরসালান বিরিয়ানি (পার্ক স্ট্রিট)', locationOrPhone: 'Park Street Metro সংলগ্ন', description: 'কলকাতার সুগন্ধি জাফরান মটন বিরিয়ানি এবং চাঁপের জন্য বিখ্যাত।', tag: 'বিরিয়ানি' },
      { name: '৬ বালিগঞ্জ প্লেস (উত্তর ও দক্ষিণ)', locationOrPhone: 'বালিগঞ্জ / শোভাবাজার', description: 'খাঁটি কাংস্যপাত্রে পরিবেশিত চিতল মাছের মুইঠ্যা বা ডাব চিংড়ির ঐতিহ্যবাহী স্বাদ।', tag: 'বাঙালি থালি' },
      { name: 'পুঁটিরাম সুইটস (কলেজ স্কোয়ার)', locationOrPhone: 'MG Road Metro সংলগ্ন', description: 'দুপুরের হিংয়ের কচুরি, আলুর দম এবং রাজকীয় ল্যাংচার ঐতিহ্যবাহী মিষ্টান্ন দোকান।', tag: 'মিষ্টি ও প্রাতরাশ' }
    ]
  },
  {
    id: 'police',
    label: 'পুলিশ স্টেশন',
    icon: ShieldAlert,
    subtitle: 'কোনো সহায়তার জন্য নিকটবর্তী পুলিশ কন্ট্রোল এবং ক্যাম্প...',
    details: [
      { name: 'লালবাজার সেন্ট্রাল কন্ট্রোল রুম', locationOrPhone: '০৩৩-২২১৩-০৭৪১ / ১০০', description: 'কলকাতা পুলিশের প্রধান সদর দপ্তর কন্ট্রোল লাইন। ২৪ ঘণ্টা সক্রিয় সাহায্যকারী দল।', tag: 'জরুরি হেল্পলাইন' },
      { name: 'কলকাতা ট্রাফিক কন্ট্রোল', locationOrPhone: '০৩৩-২২৩০-৭৩৭৫', description: 'পুজোর ট্রাফিক আপডেট এবং পার্কিং জোনের বিশদ নির্দেশাবলীর যোগাযোগ নম্বর।', tag: 'যানবাহন তথ্য' },
      { name: 'স্থানীয় মণ্ডপ পুলিশ ক্যাম্প', locationOrPhone: 'প্রতিটি মণ্ডপের প্রবেশদ্বারে', description: 'ভিড়ের মধ্যে হারিয়ে যাওয়া বা অনভিপ্রেত যে কোনো ঘটনার অভিযোগ ও প্রাথমিক সাহায্যের জন্য ক্যাম্প।', tag: 'ঘটনাস্থল সেবা' }
    ]
  },
  {
    id: 'hospital',
    label: 'জরুরি চিকিৎসা',
    icon: Cross,
    subtitle: 'অসুস্থতায় দ্রুত চিকিৎসার জন্য নিকটবর্তী মেডিকেল এবং অ্যাম্বুলেন্স...',
    details: [
      { name: 'কলকাতা মেডিকেল কলেজ', locationOrPhone: '০৩৩-২২৪১-৩৫০১ (সেন্ট্রাল)', description: 'সেন্ট্রাল কলকাতা ও কলেজ স্কোয়ার সংলগ্ন অঞ্চলের বৃহত্তম সরকারি মেডিকেল জরুরি বিভাগ।', tag: 'সরকারি হাসপাতাল' },
      { name: 'আর জি কর মেডিকেল কলেজ', locationOrPhone: '০৩৩-২৫৫৫-৭৬৭৬ (শ্যামবাজার)', description: 'উত্তর কলকাতা ও বাগবাজার অঞ্চলের জরুরি চিকিৎসার প্রধান ঠিকানা।', tag: '২৪ ঘণ্টা ইমার্জেন্সি' },
      { name: 'অ্যাম্বুলেন্স কন্ট্রোল সার্ভিস', locationOrPhone: '১০২ (টোল ফ্রি)', description: 'সরকারি জরুরি অ্যাম্বুলেন্স পরিষেবা যা মণ্ডপ বা রাস্তা থেকে রোগীদের হাসপাতালে স্থানান্তর করে।', tag: 'অ্যাম্বুলেন্স' }
    ]
  },
  {
    id: 'metro',
    label: 'মেট্রো ও ট্রেন',
    icon: TrainFront,
    subtitle: 'ভিড় এড়িয়ে সবচেয়ে দ্রুত যাতায়াতের সময়সূচী ও তথ্য...',
    details: [
      { name: 'পুজোর বিশেষ নৈশ মেট্রো', locationOrPhone: 'সপ্তমী, অষ্টমী ও নবমী', description: 'নৈশ পরিক্রমার সুবিধার জন্য রাতভর ট্রেন চলবে (প্রতি ১০-১৫ মিনিট ব্যবধানে)।', tag: 'সারারাত সচল' },
      { name: 'মেট্রো ট্রাভেল কার্ড', locationOrPhone: 'টিকিট কাউন্টার / অনলাইন', description: 'দীর্ঘ কাউন্টার লাইন এড়াতে স্মার্ট কার্ড অথবা ই-টিকিট ডাউনলোড করে রাখার পরামর্শ।', tag: 'যাত্রী সুবিধা' },
      { name: 'প্রথম ও শেষ ট্রেনের সময়', locationOrPhone: 'সকাল ৮:০০ - পরদিন ভোর ৪:০০', description: 'উত্সব স্পেশাল সময়সূচী অনুযায়ী শেষ রাতের ট্রেন প্রতিটি স্টেশন থেকে ছাড়বে।', tag: 'সময়সূচী' }
    ]
  }
];

const EssentialsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('cafe');
  const { t, language } = useLanguage();

  const currentCategory = essentialsData.find(cat => cat.id === activeTab) || essentialsData[0];

  return (
    <section className="py-24 bg-paper text-ink relative">
      
      {/* Top clean line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[0.5px] bg-ink/10"></div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-ink/40">{t.essentialsTag}</span>
          <h2 className="text-4xl md:text-5xl font-serif text-ink italic font-normal">{t.essentialsTitle}</h2>
          <p className="text-xs font-sans text-ink/50 italic max-w-sm mx-auto">
            {language === 'bn' ? 'পুজো পরিক্রমার অতি প্রয়োজনীয় তথ্য ও জরুরি হেল্পলাইন।' : 'Essential directory & 24x7 emergency contacts for Puja visitors.'}
          </p>
        </div>

        {/* TEXT TABS ROW (Simplified) */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 max-w-3xl mx-auto mb-12">
          {essentialsData.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeTab;
            
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="group flex items-center gap-2 focus:outline-none py-1 relative"
              >
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-bengali-red' : 'text-ink/50 group-hover:text-bengali-red/80'
                }`} strokeWidth={1.5} />
                
                <span className={`text-base font-serif transition-all ${
                  isActive ? 'text-bengali-red font-bold border-b border-bengali-red' : 'text-ink/60 group-hover:text-ink'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* DETAILED POSTCARD DRAWER (Simplified Paper) */}
        <div 
          className="bg-[#FAF6ED] border border-ink/10 p-8 relative transition-all duration-300"
        >
          <div className="space-y-6">
            <div className="border-b border-ink/10 pb-4">
              <h3 className="text-2xl font-serif font-extrabold italic text-bengali-red flex items-center gap-2">
                {currentCategory.label}
              </h3>
              <p className="text-xs font-serif italic text-ink/50 mt-1">
                {currentCategory.subtitle}
              </p>
            </div>

            {/* List entries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {currentCategory.details.map((detail, idx) => (
                <div 
                  key={idx}
                  className="bg-[#FAF6ED] border border-ink/5 p-4 hover:bg-[#F2EAD9]/40 transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-serif font-bold text-base text-ink leading-tight">
                      {detail.name}
                    </h4>
                    {detail.tag && (
                      <span className="text-[8px] font-mono border border-ink/20 text-ink/50 px-1.5 py-0.5 uppercase tracking-wider bg-[#EFE8DC]">
                        {detail.tag}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[11px] font-sans text-ink/75 leading-relaxed mb-3 text-justify">
                    {detail.description}
                  </p>

                  <div className="pt-2.5 border-t border-dashed border-ink/10 flex items-center text-xs font-serif text-bengali-red font-semibold select-all">
                    <span>{detail.locationOrPhone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default EssentialsSection;