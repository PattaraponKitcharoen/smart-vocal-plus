import { useState, useRef, useEffect } from 'react';
import { Minus, Plus, Volume2, BellOff, Play, Square } from 'lucide-react';

const TempoPage = () => {
  const [bpm, setBpm] = useState(86);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState(4);
  
  // บัฟเฟอร์เก็บเวลาที่เคาะ (Tap) เพื่อเอามาหาค่าเฉลี่ย
  const tapTimes = useRef([]);
  // ตัวตั้งเวลาล้างบัฟเฟอร์ ถ้าหยุดเคาะนานเกิน 2 วินาที
  const tapTimeout = useRef(null);

  // ฟังก์ชันคำนวณคำศัพท์ดนตรี (Tempo Marking) ตามความเร็ว
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

  // ลอจิกการเคาะหาจังหวะ (Tap Tempo)
  const handleTap = () => {
    const now = Date.now();
    
    // ล้างเวลาเก่าทิ้งถ้าหยุดเคาะนานเกิน 2 วินาที (เริ่มเพลงใหม่)
    clearTimeout(tapTimeout.current);
    tapTimeout.current = setTimeout(() => {
      tapTimes.current = [];
    }, 2000);

    tapTimes.current.push(now);

    // เก็บแค่ 4 เคาะล่าสุดเพื่อความแม่นยำ
    if (tapTimes.current.length > 4) {
      tapTimes.current.shift();
    }

    // ต้องเคาะอย่างน้อย 2 ครั้งถึงจะหาความห่างได้
    if (tapTimes.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        intervals.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      // หาค่าเฉลี่ยของระยะห่างแต่ละเคาะ
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      
      // แปลงมิลลิวินาทีเป็น BPM (60,000 ms = 1 นาที)
      let newBpm = Math.round(60000 / avgInterval);
      
      // จำกัดขอบเขตไม่ให้ต่ำหรือสูงเวอร์เกินไป (30 - 300)
      newBpm = Math.max(30, Math.min(newBpm, 300));
      setBpm(newBpm);
    }
  };

  const handleBpmChange = (amount) => {
    setBpm(prev => Math.max(30, Math.min(prev + amount, 300)));
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8 h-full px-6">
      
      {/* ส่วนแสดงตัวเลข BPM ใหญ่ๆ */}
      <div className="text-center mb-6">
        <h1 className="text-8xl font-black text-neonBlue drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] tracking-tighter">
          {bpm}
        </h1>
        <p className="text-xl font-bold text-slate-300 tracking-widest uppercase">BPM</p>
      </div>

      {/* ข้อมูล Tempo Marking และ Time Signature */}
      <div className="flex justify-between w-full max-w-xs mb-10 px-4">
        <div className="text-left">
          <p className="text-neonGreen font-bold text-xl">{getTempoMarking(bpm)}</p>
          <p className="text-slate-400 text-xs">Tempo Marking</p>
        </div>
        <div className="text-right border-l border-slate-700 pl-4">
          <p className="text-neonGreen font-bold text-xl">{timeSig}/4</p>
          <p className="text-slate-400 text-xs">Time Signature</p>
        </div>
      </div>

      {/* ปุ่ม TAP วงกลมใหญ่ */}
      <button 
        onClick={handleTap}
        className="relative flex items-center justify-center w-48 h-48 rounded-full border-4 border-slate-700 bg-darkCard shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-10 active:scale-95 active:border-neonGreen transition-all duration-100 group"
      >
        {/* วงแหวนเรืองแสงตอนกด */}
        <div className="absolute inset-0 rounded-full border border-neonGreen opacity-0 group-active:opacity-100 group-active:animate-ping"></div>
        <div className="absolute inset-2 rounded-full border border-neonBlue/30"></div>
        <span className="text-4xl font-black text-neonGreen tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
          TAP
        </span>
        <span className="absolute bottom-8 text-xs text-slate-500 font-medium">
          TAP TO SET TEMPO
        </span>
      </button>

      {/* แผงควบคุมด้านล่าง (+/- และ Play) */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-4 mb-4">
        <button 
          onClick={() => handleBpmChange(-1)}
          className="flex items-center justify-center bg-darkCard border border-slate-700 rounded-xl py-4 text-neonBlue hover:bg-slate-800 active:bg-slate-700 transition-colors"
        >
          <Minus size={32} />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center justify-center rounded-xl py-4 transition-all duration-300 shadow-lg ${
            isPlaying 
              ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-red-500/20' 
              : 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50 shadow-neonGreen/20'
          }`}
        >
          {isPlaying ? <Square fill="currentColor" size={28} /> : <Play fill="currentColor" size={28} />}
        </button>

        <button 
          onClick={() => handleBpmChange(1)}
          className="flex items-center justify-center bg-darkCard border border-slate-700 rounded-xl py-4 text-neonGreen hover:bg-slate-800 active:bg-slate-700 transition-colors"
        >
          <Plus size={32} />
        </button>
      </div>

    </div>
  );
};

export default TempoPage;