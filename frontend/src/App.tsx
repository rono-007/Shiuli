import { useState, useEffect, useRef } from 'react';
import HeroSection from './components/HeroSection';
import JourneySection from './components/JourneySection';
import EditorialSection from './components/EditorialSection';
import EssentialsSection from './components/EssentialsSection';
import NorthCalcuttaSection from './components/NorthCalcuttaSection';
import SouthCalcuttaSection from './components/SouthCalcuttaSection';
import CentralCalcuttaSection from './components/CentralCalcuttaSection';
import BonediCalcuttaSection from './components/BonediCalcuttaSection';
import FacilitiesSection from './components/FacilitiesSection';
import AdminPanel from './components/AdminPanel';
import { Heart } from 'lucide-react';


function App() {
  const [view, setView] = useState<'home' | 'north' | 'south' | 'central' | 'bonedi' | 'facilities' | 'admin'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('admin') ? 'admin' : 'home';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMuted, setIsMuted] = useState(true);

  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<number | null>(null);

  // Web Audio Synth for Dhak drum beat
  const playDhakBeat = (ctx: AudioContext, time: number, volume = 0.12) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(20, time + 0.25);
    
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.26);
  };

  // Web Audio Synth for stick clicks (kash hit)
  const playKashHit = (ctx: AudioContext, time: number, volume = 0.05) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750, time);
    osc.frequency.exponentialRampToValueAtTime(300, time + 0.06);
    
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.07);
  };

  // Web Audio Synth for Conch Shell Blow (শঙ্খধ্বনি)
  const playConchShell = (ctx: AudioContext, time: number) => {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, time);
    osc1.frequency.linearRampToValueAtTime(310, time + 1.2);
    osc1.frequency.exponentialRampToValueAtTime(205, time + 3.2);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(330, time);
    osc2.frequency.linearRampToValueAtTime(465, time + 1.2);
    osc2.frequency.exponentialRampToValueAtTime(307, time + 3.2);
    
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(440, time);
    osc3.frequency.linearRampToValueAtTime(620, time + 1.2);
    osc3.frequency.exponentialRampToValueAtTime(410, time + 3.2);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.07, time + 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start(time);
    osc2.start(time);
    osc3.start(time);
    
    osc1.stop(time + 3.3);
    osc2.stop(time + 3.3);
    osc3.stop(time + 3.3);
  };

  const startSoundLoop = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    playConchShell(ctx, ctx.currentTime);

    let tick = 0;
    const tempo = 0.35; // ~170 BPM

    soundIntervalRef.current = window.setInterval(() => {
      const time = ctx.currentTime;
      const step = tick % 8;
      
      if (step === 0) {
        playKashHit(ctx, time, 0.06);
      } else if (step === 1) {
        playDhakBeat(ctx, time, 0.12);
      } else if (step === 2) {
        playKashHit(ctx, time, 0.04);
      } else if (step === 3) {
        playDhakBeat(ctx, time, 0.08);
      } else if (step === 4) {
        playDhakBeat(ctx, time, 0.10);
        playDhakBeat(ctx, time + 0.15, 0.08);
      } else if (step === 5) {
        playKashHit(ctx, time, 0.05);
      } else if (step === 6) {
        playDhakBeat(ctx, time, 0.14);
      } else if (step === 7) {
        playKashHit(ctx, time, 0.06);
      }

      if (tick > 0 && tick % 32 === 0) {
        playConchShell(ctx, time + 0.1);
      }

      tick++;
    }, tempo * 1000);
  };

  const stopSoundLoop = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
  };

  const handleAudioToggle = () => {
    if (isMuted) {
      startSoundLoop();
      setIsMuted(false);
    } else {
      stopSoundLoop();
      setIsMuted(true);
    }
  };

  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
      }
    };
  }, []);


  return (
    <div className="min-h-screen bg-paper relative font-sans text-ink flex flex-col selection:bg-bengali-red/20 selection:text-ink">
      {view !== 'admin' && (
        <>
          {/* Heavy Noise Overlay for Vintage Print Feel */}
          <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
          
          {/* Global Subtle Navigation Overlay */}
          <nav className="fixed top-0 left-0 right-0 p-8 md:p-10 z-50 flex justify-between items-start pointer-events-none text-paper mix-blend-difference">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E5B05C]"></div>
              <span className="text-[9px] font-mono tracking-[0.3em] uppercase opacity-80">Shiuli</span>
            </div>

            {/* Center: Year & City */}
            <div className="hidden md:block pointer-events-auto">
              <span className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-60">শারদীয়া ১৪৩৩ - কলকাতা</span>
            </div>

            {/* Right: Menu & Audio controls */}
            <div className="flex flex-col items-end gap-6 pointer-events-auto">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleAudioToggle}
                  className="text-[10px] font-mono uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
                >
                  {isMuted ? 'ধ্বনি সচল' : 'ধ্বনি বন্ধ'}
                </button>
                {view !== 'home' && (
                  <button 
                    onClick={() => setView('home')}
                    className="text-[10px] font-mono uppercase tracking-widest hover:opacity-100 transition-opacity focus:outline-none font-bold text-[#E5B05C]"
                  >
                    হোম (Home) &rarr;
                  </button>
                )}
              </div>
              
              <div className="text-right space-y-1 opacity-50 hidden md:block">
                <div className="text-[9px] font-mono tracking-widest uppercase">কলকাতা</div>
                <div className="text-[9px] font-mono tracking-widest uppercase">শারদীয়া ১৪৩৩</div>
              </div>
            </div>
          </nav>
        </>
      )}

      {view === 'admin' ? (
        <AdminPanel onBack={() => { setView('home'); window.history.replaceState({}, '', window.location.pathname); }} />
      ) : (
      <main className="w-full relative z-20">
        {view === 'north' ? (
          <NorthCalcuttaSection onBack={() => setView('home')} />
        ) : view === 'south' ? (
          <SouthCalcuttaSection onBack={() => setView('home')} />
        ) : view === 'central' ? (
          <CentralCalcuttaSection onBack={() => setView('home')} />
        ) : view === 'bonedi' ? (
          <BonediCalcuttaSection onBack={() => setView('home')} />
        ) : view === 'facilities' ? (
          <FacilitiesSection onBack={() => setView('home')} />
        ) : (
          <>
            <HeroSection 
              onSearch={setSearchQuery} 
              onFilterChange={setActiveFilter} 
              activeFilter={activeFilter} 
              onSelectZone={(zone) => {
                if (zone === 'north') {
                  setView('north');
                } else if (zone === 'south') {
                  setView('south');
                } else if (zone === 'central') {
                  setView('central');
                } else if (zone === 'bonedi') {
                  setView('bonedi');
                }
              }}
              onSelectFacilities={() => setView('facilities')}
            />
            
            {/* CONTENT SECTION */}
            <div className="w-full">
              <JourneySection 
                searchQuery={searchQuery} 
                activeFilter={activeFilter} 
                onSearch={setSearchQuery}
              />

              <EditorialSection />
              
              <EssentialsSection />
            </div>
          </>
        )}

        {/* Footer Design */}
        <footer className="bg-night border-t border-smoke py-32 text-center text-paper relative z-10 flex flex-col items-center justify-center space-y-10">
          <h2 className="text-4xl font-serif tracking-[0.2em] text-lamp/80 select-none">শিউলি</h2>
          <div className="space-y-4">
            <p className="text-lamp/60 text-[9px] font-mono tracking-[0.4em] uppercase select-none">
              কলকাতার পুজোর ডায়েরি • শারদীয়া ১৪৩৩
            </p>
            <div className="flex justify-center items-center gap-2 text-paper/20 text-[9px] font-mono select-none tracking-widest">
              <span>কলকাতা</span>
              <Heart className="w-2 h-2 fill-bengali-red/40 text-transparent" />
              <span>শিউলি</span>
            </div>
          </div>
        </footer>

      </main>
      )}
    </div>
  );
}

export default App;
