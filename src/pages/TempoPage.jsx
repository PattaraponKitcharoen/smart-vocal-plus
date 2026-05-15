import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { startMetronome, stopMetronome, setMetronomeVolume, setMetronomeMute } from '../utils/metronomeEngine';

const TempoPage = () => {
  const [bpm, setBpm] = useState(86);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState({ top: 4, bottom: 4 });
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  const tapTimes = useRef([]);
  const tapTimeout = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome(bpm, timeSig.top); 
    } else {
      stopMetronome();
    }
    return () => stopMetronome();
  }, [isPlaying, bpm, timeSig]);

  useEffect(() => {
    // ใช้สมการ Exponential (x^2) เพื่อปรับความดังให้ตรงกับธรรมชาติการได้ยินของหูมนุษย์
    const linearVol = volume / 100;
    const exponentialVol = linearVol * linearVol;
    setMetronomeVolume(exponentialVol);
  }, [volume]);

  useEffect(() => {
    setMetronomeMute(isMuted);
  }, [isMuted]);

  const getTempoMarking = (currentBpm) => {
    if (currentBpm < 40) return 'Grave';
    if (currentBpm < 60) return 'Largo';
    if (currentBpm < 76) return 'Adagio';
    if (currentBpm < 108) return 'Andante';
    if (currentBpm < 120) return 'Moderato';
    if (currentBpm < 156) return 'Allegro';
    if (currentBpm < 176) return 'Vivace';
    return 'Presto';
  };

  const handleTap = () => {
    const now = Date.now();
    clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => { tapTimes.current = []; }, 2000);

    tapTimes.current.push(now);
    if (tapTimes.current.length > 4) tapTimes.current.shift();

    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      let newBpm = Math.round(60000 / avgInterval);
      setBpm(Math.max(30, Math.min(newBpm, 300)));
      setIsPlaying(true); 
    }
  };

  const handleBpmChange = (amount) => {
    setBpm(prev => Math.max(30, Math.min(prev + amount, 300)));
  };

  const timeSignatures = [
    { top: 3, bottom: 4 },
    { top: 4, bottom: 4 },
    { top: 6, bottom: 8 }
  ];

  return (
    <div className="flex flex-col h-full bg-darkBg text-white overflow-hidden px-6 pt-8 pb-20">
      
      {/* 1. Main BPM Display (ขยับขึ้นมาด้านบนสุด) */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
        <h1 className="text-[110px] md:text-[140px] font-black text-neonBlue drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-tighter leading-none mb-2">
          {bpm}
        </h1>
        <p className="text-xl font-bold text-slate-400 tracking-[0.3em] uppercase mb-4">BPM</p>
        <p className="text-neonGreen font-bold text-lg px-6 py-2 rounded-full bg-neonGreen/10 border border-neonGreen/20">
          {getTempoMarking(bpm)}
        </p>
      </div>

      {/* 2. Tap Button */}
      <div className="flex justify-center shrink-0 mb-8 mt-4">
        <button 
          onClick={handleTap}
          className="relative flex items-center justify-center w-36 h-36 md:w-44 md:h-44 rounded-full border-[3px] border-slate-700 bg-darkCard shadow-[0_0_25px_rgba(0,0,0,0.5)] active:scale-95 active:border-neonGreen transition-all duration-100 group"
        >
          <div className="absolute inset-0 rounded-full border border-neonGreen opacity-0 group-active:opacity-100 group-active:animate-ping"></div>
          <div className="absolute inset-2 rounded-full border border-neonBlue/20"></div>
          <span className="text-3xl font-black text-neonGreen tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            TAP
          </span>
        </button>
      </div>

      {/* 3. Volume Control */}
      <div className="flex items-center gap-4 max-w-sm mx-auto w-full mb-4 shrink-0 bg-darkCard px-5 py-3 rounded-2xl border border-slate-800">
        <button 
          onClick={() => setIsMuted(!isMuted)} 
          className={`transition-colors ${isMuted ? 'text-rose-500' : 'text-neonBlue'}`}
        >
          {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
        <input 
          type="range" 
          min="0" max="100" 
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(e.target.value);
            if (isMuted && e.target.value > 0) setIsMuted(false);
          }}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neonBlue"
        />
      </div>

      {/* 4. Time Signature Selector (ย้ายมาอยู่ระหว่าง Volume กับ Play) */}
      <div className="flex bg-slate-800/60 p-1.5 rounded-2xl mb-6 shrink-0 max-w-sm mx-auto w-full">
        {timeSignatures.map((ts, index) => {
          const isActive = timeSig.top === ts.top && timeSig.bottom === ts.bottom;
          return (
            <button
              key={index}
              onClick={() => {
                setTimeSig(ts);
                // ให้เล่นใหม่ทันทีเมื่อเปลี่ยนจังหวะ จะได้ฟังความต่างได้เลย
                if (isPlaying) {
                  stopMetronome();
                  startMetronome(bpm, ts.top);
                }
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-slate-700 text-neonBlue shadow-md' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {ts.top}/{ts.bottom}
            </button>
          );
        })}
      </div>

      {/* 5. Playback Controls */}
      <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-3 shrink-0">
        <button 
          onClick={() => handleBpmChange(-1)}
          className="flex items-center justify-center bg-darkCard border border-slate-700 rounded-2xl py-4 text-neonBlue hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Minus size={28} />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center justify-center rounded-2xl py-4 active:scale-95 transition-all duration-300 shadow-lg ${
            isPlaying 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-rose-500/20' 
              : 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50 shadow-neonGreen/20'
          }`}
        >
          {isPlaying ? <Square fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
        </button>

        <button 
          onClick={() => handleBpmChange(1)}
          className="flex items-center justify-center bg-darkCard border border-slate-700 rounded-2xl py-4 text-neonGreen hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>

    </div>
  );
};

export default TempoPage;