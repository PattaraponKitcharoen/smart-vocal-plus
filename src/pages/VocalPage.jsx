import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { startAudio, stopAudio, getAudioData, autoCorrelate, noteFromPitch, getNoteString, getSampleRate } from '../utils/audioEngine';

const VocalPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null); // เก็บค่า Hz
  const [note, setNote] = useState('--');    // เก็บชื่อโน้ต
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const toggleMic = async () => {
    if (isListening) {
      stopAudio();
      setIsListening(false);
      setNote('--');
      setPitch(null);
      cancelAnimationFrame(animationRef.current);
    } else {
      const success = await startAudio();
      if (success) {
        setIsListening(true);
        processAudio(); // เปลี่ยนชื่อจาก drawWaveform ให้ครอบคลุมขึ้น
      } else {
        alert("กรุณาอนุญาตการเข้าถึงไมโครโฟนครับ");
      }
    }
  };

  const processAudio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = getAudioData();

    // วาดพื้นหลัง
    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataArray) {
      // 1. วาดกราฟ
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

      // 2. คำนวณหาตัวโน้ต
      const sampleRate = getSampleRate();
      const detectedPitch = autoCorrelate(dataArray, sampleRate);
      
      if (detectedPitch !== -1) {
        // ถ้ามีเสียงดังพอ ให้แปลงเป็นโน้ต
        const noteNumber = noteFromPitch(detectedPitch);
        const noteName = getNoteString(noteNumber);
        
        setPitch(detectedPitch.toFixed(1));
        setNote(noteName);
      } else {
        // ถ้าเงียบ ให้โชว์ขีด
        // setNote('--'); // คอมเมนต์ไว้เพื่อค้างโน้ตล่าสุดเวลาหยุดหายใจ
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

  return (
    <div className="flex flex-col items-center justify-start pt-10 h-full px-6">
      <h1 className="text-3xl font-bold text-neonBlue drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-4">
        Vocal Monitor
      </h1>

      {/* โซนแสดงผลตัวโน้ตยักษ์ */}
      <div className="flex flex-col items-center justify-center h-40 mb-2">
        <span className={`text-8xl font-black tracking-tighter transition-colors duration-200 ${note !== '--' ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-slate-700'}`}>
          {note}
        </span>
        <span className="text-neonBlue font-mono text-xl mt-2 tracking-widest h-8">
          {pitch ? `${pitch} Hz` : ''}
        </span>
      </div>
      
      {/* กล่องกราฟ */}
      <div className="w-full max-w-md bg-darkCard rounded-2xl overflow-hidden border border-slate-700 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-10 relative">
        {/* แกนเล็งเป้า (Crosshair) สีเขียวบางๆ ตรงกลางกราฟ */}
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