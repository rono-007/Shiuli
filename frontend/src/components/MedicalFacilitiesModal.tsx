import React, { useState, useEffect } from 'react';
import { X, Hospital, Pill, Phone, MapPin, Search, ExternalLink, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MedicalFacility {
  title: string;
  subTitle?: string;
  categoryName?: string;
  type: string;
  address?: string;
  phone?: string;
  location: { lat: number; lng: number };
  url: string;
}

interface MedicalFacilitiesResponse {
  north: MedicalFacility[];
  south: MedicalFacility[];
}

interface MedicalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MedicalFacilitiesModal: React.FC<MedicalModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [activeZone, setActiveZone] = useState<'north' | 'south'>('north');
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'pharmacy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MedicalFacilitiesResponse>({ north: [], south: [] });

  useEffect(() => {
    if (!isOpen) return;

    const fetchMedicalFacilities = async () => {
      setLoading(true);
      setError(null);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://shiuli-backend.onrender.com';
      try {
        const res = await fetch(`${baseUrl}/api/medical-facilities`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const result = await res.json();
        if (result && Array.isArray(result.north) && Array.isArray(result.south)) {
          setData(result);
        } else {
          throw new Error('Invalid backend data format');
        }
      } catch (err: any) {
        console.warn('Backend fetch failed for medical facilities:', err);
        setError(isBn ? 'ডাটা সার্ভার সংযোগ বিচ্ছিন্ন, ব্যাকএন্ড অনলাইন হলে পুনরায় চেষ্টা করুন।' : 'Failed to connect to backend data server.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalFacilities();
  }, [isOpen, isBn]);

  if (!isOpen) return null;

  const currentList = data[activeZone] || [];

  const filteredItems = currentList.filter(item => {
    const isHospital = item.type.includes('Hospital');
    const isPharmacy = item.type.includes('Pharmacy');

    if (filterType === 'hospital' && !isHospital) return false;
    if (filterType === 'pharmacy' && !isPharmacy) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const addr = (item.address || '').toLowerCase();
    const cat = (item.categoryName || '').toLowerCase();

    return title.includes(q) || addr.includes(q) || cat.includes(q);
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#FAF6ED] border-2 border-[#DFB86C]/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-serif">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1B4D3E] to-[#2C6E59] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Hospital className="w-5 h-5 text-[#DFB86C]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-serif leading-tight">
                {isBn ? 'হাসপাতাল, নার্সিং হোম ও ফার্মেসি ডিরেক্টরি' : 'Hospitals, Nursing Homes & Pharmacies'}
              </h3>
              <p className="text-xs font-sans text-white/70">
                {isBn ? 'সরাসরি ব্যাকএন্ড সার্ভার থেকে লাইভ তথ্য' : 'Live data fetched directly from FastAPI backend'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 sm:p-6 border-b border-[#EAE3D9] bg-[#F4EFE6] flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Zone Selector Tabs */}
          <div className="flex bg-[#E8DFD1] p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveZone('north')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeZone === 'north'
                  ? 'bg-[#1B4D3E] text-white shadow-md'
                  : 'text-[#5C4D43] hover:text-[#1B4D3E]'
              }`}
            >
              🏛️ {isBn ? 'উত্তর কলকাতা (North)' : 'North Kolkata'} ({data.north.length})
            </button>
            <button
              onClick={() => setActiveZone('south')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeZone === 'south'
                  ? 'bg-[#1B4D3E] text-white shadow-md'
                  : 'text-[#5C4D43] hover:text-[#1B4D3E]'
              }`}
            >
              🌳 {isBn ? 'দক্ষিণ কলকাতা (South)' : 'South Kolkata'} ({data.south.length})
            </button>
          </div>

          {/* Sub Type Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#1B4D3E]/10 border-[#1B4D3E] text-[#1B4D3E]'
                  : 'border-[#DFB86C]/40 text-[#5C4D43] hover:border-[#1B4D3E]'
              }`}
            >
              {isBn ? 'সব' : 'All'}
            </button>
            <button
              onClick={() => setFilterType('hospital')}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'hospital'
                  ? 'bg-rose-500/10 border-rose-600 text-rose-800'
                  : 'border-[#DFB86C]/40 text-[#5C4D43] hover:border-rose-600'
              }`}
            >
              <Hospital className="w-3.5 h-3.5 text-rose-600" />
              {isBn ? 'হাসপাতাল/নার্সিং হোম' : 'Hospitals'}
            </button>
            <button
              onClick={() => setFilterType('pharmacy')}
              className={`px-3 py-1.5 rounded-full text-xs font-sans font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'pharmacy'
                  ? 'bg-purple-500/10 border-purple-600 text-purple-800'
                  : 'border-[#DFB86C]/40 text-[#5C4D43] hover:border-purple-600'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-purple-600" />
              {isBn ? 'ফার্মেসি' : 'Pharmacies'}
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? "অনুসন্ধান করুন..." : "Search facilities..."}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF6ED] border border-[#DFB86C]/40 rounded-xl text-xs font-sans focus:outline-none focus:border-[#1B4D3E]"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#FAF6ED]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#1B4D3E] animate-spin" />
              <p className="text-xs font-sans text-[#7A6458]">
                {isBn ? 'ব্যাকএন্ড সার্ভার থেকে ডাটা লোড হচ্ছে...' : 'Fetching data from backend server...'}
              </p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-sans">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-[#7A6458]">
              <p className="text-sm font-serif italic">
                {isBn ? 'কোনো চিকিৎসা কেন্দ্র খুঁজে পাওয়া যায়নি।' : 'No medical facilities found matching criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item, idx) => {
                const isHospital = item.type.includes('Hospital');

                return (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border border-[#EAE3D9] hover:border-[#1B4D3E]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isHospital ? (
                            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                              <Hospital className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                              <Pill className="w-4 h-4" />
                            </span>
                          )}
                          <h4 className="font-bold text-[#3A2E28] text-sm font-serif leading-snug">
                            {item.title}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold flex-shrink-0 ${
                          isHospital ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}>
                          {item.type}
                        </span>
                      </div>

                      {item.address && (
                        <p className="text-xs text-[#6E5D52] font-sans flex items-start gap-1.5 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-[#1B4D3E] flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.address}</span>
                        </p>
                      )}

                      {item.phone && (
                        <p className="text-xs text-[#1B4D3E] font-sans font-semibold flex items-center gap-1.5 mb-3">
                          <Phone className="w-3.5 h-3.5 text-[#1B4D3E]" />
                          <span>{item.phone}</span>
                        </p>
                      )}
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 bg-[#FAF6ED] hover:bg-[#1B4D3E] hover:text-white text-[#1B4D3E] py-2 rounded-xl text-xs font-sans font-bold transition-all border border-[#1B4D3E]/20"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{isBn ? 'গুগল ম্যাপসে জিপিএস নির্দেশিকা' : 'Google Maps GPS Navigation'} ↗</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F4EFE6] px-6 py-3 border-t border-[#EAE3D9] flex items-center justify-between text-xs text-[#7A6458] font-sans">
          <span>
            {isBn ? `মোট ${filteredItems.length} টি চিকিৎসা কেন্দ্র প্রদর্শিত` : `Showing ${filteredItems.length} medical facilities`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1B4D3E] text-white font-bold hover:bg-[#153D31] transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
