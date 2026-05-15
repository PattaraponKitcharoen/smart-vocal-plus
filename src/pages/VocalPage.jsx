import { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { startAudio, stopAudio, getAudioData } from '../utils/audioEngine';

const VocalPage = () => {
  const [isListening, setIsListening] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const toggleMic = async () => {
    if (isListening) {
      // ถ้าเปิดอยู่ ให้ปิดไมค์
      stopAudio();
      setIsListening(false);
      cancelAnimationFrame(animationRef.current);
    } else {
      // ถ้าปิดอยู่ ให้ขออนุญาตและเปิดไมค์
      const success = await startAudio();
      if (success) {
        setIsListening(true);
        drawWaveform(); // เริ่มวาดกราฟทันที
      } else {
        alert("กรุณาอนุญาตการเข้าถึงไมโครโฟนเพื่อใช้งานฟีเจอร์นี้ครับ");
      }
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = getAudioData();

    // 1. ระบายสีพื้นหลังทับของเก่า (สีเดียวกับกล่อง)
    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataArray) {
      // 2. ตั้งค่าปากกาสำหรับวาดเส้น
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#10b981'; // สี neonGreen
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      // 3. ลูปวาดเส้นตามความดังของเสียง (Amplitude)
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] * 150.0; // คูณขยายสัญญาณให้กราฟเด้งชัดๆ
        const y = (canvas.height / 2) + v;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    // 4. สั่งให้วาดเฟรมต่อไปซ้ำๆ แบบ 60fps
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  // Cleanup: ถอดปลั๊กไมค์อัตโนมัติเวลาผู้ใช้กดหนีไปหน้าอื่น
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
      <h1 className="text-3xl font-bold text-neonBlue drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-8">
        Vocal Monitor
      </h1>
      
      {/* กล่องแสดงกราฟคลื่นเสียง */}
      <div className="w-full max-w-md bg-darkCard rounded-2xl overflow-hidden border border-slate-700 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-10">
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="160" 
          className="w-full block"
        ></canvas>
      </div>

      {/* ปุ่ม Toggle */}
      <button
        onClick={toggleMic}
        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 ${
          isListening 
            ? 'bg-red-500/10 text-red-400 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
            : 'bg-neonGreen/10 text-neonGreen border border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-neonGreen/20'
        }`}
      >
        {isListening ? (
          <>
            <Square fill="currentColor" size={24} />
            Stop Listening
          </>
        ) : (
          <>
            <Mic size={24} />
            Start Mic
          </>
        )}
      </button>

      <p className="text-slate-400 mt-6 text-sm text-center h-10">
        {isListening 
          ? "🎤 กำลังรับเสียง... ลองพูดหรือร้องเพลงดูสิ!" 
          : "กดปุ่มด้านบนเพื่อทดสอบไมโครโฟน"}
      </p>
    </div>
  );
};

export default VocalPage;