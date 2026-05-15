import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { 
  startAudio, stopAudio, getAudioData, autoCorrelate, 
  noteFromPitch, getNoteString, getSampleRate, getCentsOffPitch 
} from '../utils/audioEngine';

const VocalPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState('--');
  const [cents, setCents] = useState(0);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  // เพิ่ม: บัฟเฟอร์สำหรับเก็บค่าความถี่ 5 ค่าล่าสุดเพื่อทำ Smoothing
  const pitchBufferRef = useRef([]); 

  const toggleMic = async () => {
    if (isListening) {
      stopAudio();
      setIsListening(false);
      setNote('--');
      setPitch(null);
      setCents(0);
      pitchBufferRef.current = []; // ล้างบัฟเฟอร์เมื่อปิดไมค์
      cancelAnimationFrame(animationRef.current);
    } else {
      const success = await startAudio();
      if (success) {
        setIsListening(true);
        animationRef.current = requestAnimationFrame(processAudio); 
      } else {
        alert("กรุณาอนุญาตการเข้าถึงไมโครโฟนครับ");
      }
    }
  };

  const processAudio = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = getAudioData();

    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataArray) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] * 150.0;
        const y = (canvas.height / 2) + v;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      if (timestamp - lastUpdateRef.current > 50) {
        const sampleRate = getSampleRate();
        const detectedPitch = autoCorrelate(dataArray, sampleRate);
        
        if (detectedPitch !== -1) {
          // --- ลอจิก Smoothing ---
          pitchBufferRef.current.push(detectedPitch);
          // เก็บแค่ 5 ค่าล่าสุด (ยิ่งเยอะยิ่งหนืด ยิ่งน้อยยิ่งไว)
          if (pitchBufferRef.current.length > 5) {
            pitchBufferRef.current.shift(); 
          }
          
          // หาค่าเฉลี่ย
          const avgPitch = pitchBufferRef.current.reduce((sum, val) => sum + val, 0) / pitchBufferRef.current.length;
          // ------------------------

          const noteNumber = noteFromPitch(avgPitch);
          const noteName = getNoteString(noteNumber);
          const centsOff = getCentsOffPitch(avgPitch, noteNumber);
          
          setPitch(avgPitch.toFixed(1));
          setNote(noteName);
          setCents(centsOff);
        } else {
          // ถ้าเสียงเงียบไป ล้างบัฟเฟอร์ทิ้ง จะได้ไม่เอาค่าเก่ามาปนเวลาร้องใหม่
          pitchBufferRef.current = [];
        }
        lastUpdateRef.current = timestamp;
      }
    }

    animationRef.current = requestAnimationFrame(processAudio);
  };

  useEffect(() => {
    return () => {
      if (isListening) {
        stopAudio();
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  const getTuningColor = () => {
    if (note === '--') return 'bg-slate-600';
    if (Math.abs(cents) <= 10) return 'bg-neonGreen shadow-[0_0_10px_rgba(16,185,129,0.8)]';
    if (cents > 10) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]';
    return 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]';
  };

  return (
    <div className="flex flex-col items-center justify-start pt-10 h-full px-6">
      <h1 className="text-3xl font-bold text-neonBlue drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-4">
        Vocal Monitor
      </h1>

      <div className="flex flex-col items-center justify-center h-32 mb-2">
        <span className={`text-8xl font-black tracking-tighter transition-colors duration-200 ${note !== '--' ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-slate-700'}`}>
          {note}
        </span>
        <span className="text-slate-400 font-mono text-lg mt-1 tracking-widest h-6">
          {pitch ? `${pitch} Hz` : ''}
        </span>
      </div>

      <div className="w-full max-w-xs mb-8 flex flex-col items-center">
        <div className="flex justify-between w-full text-xs text-slate-500 font-bold px-2 mb-1">
          <span>FLAT</span>
          <span className={Math.abs(cents) <= 10 && note !== '--' ? 'text-neonGreen' : ''}>PERFECT</span>
          <span>SHARP</span>
        </div>
        
        <div className="w-full h-3 bg-slate-800 rounded-full relative overflow-hidden">
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-500 z-0 -translate-x-1/2"></div>
          
          <div 
            // ปรับระยะเวลา Animation ของจุดไข่ปลาให้นานขึ้นนิดนึง (duration-200) ให้ดูสมูท
            className={`absolute top-0 bottom-0 w-4 rounded-full z-10 transition-all duration-200 ease-out ${getTuningColor()}`}
            style={{ 
              left: `${Math.max(0, Math.min(100, cents + 50))}%`,
              transform: 'translateX(-50%)'
            }}
          ></div>
        </div>
        
        <span className="text-xs text-slate-500 mt-2 h-4 font-mono">
          {note !== '--' ? `${cents > 0 ? '+' : ''}${cents} cents` : ''}
        </span>
      </div>
      
      <div className="w-full max-w-md bg-darkCard rounded-2xl overflow-hidden border border-slate-700 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-neonGreen/30 z-10"></div>
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="120" 
          className="w-full block relative z-0"
        ></canvas>
      </div>

      <button
        onClick={toggleMic}
        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
          isListening 
            ? 'bg-red-500/10 text-red-400 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            : 'bg-neonGreen/10 text-neonGreen border border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-neonGreen/20'
        }`}
      >
        {isListening ? (
          <><Square fill="currentColor" size={24} /> Stop Listening</>
        ) : (
          <><Mic size={24} /> Start Mic</>
        )}
      </button>
    </div>
  );
};

export default VocalPage;