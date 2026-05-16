import { useState, useEffect, useRef, useContext } from 'react';
import { Mic, MicOff, Flame, Target, Activity } from 'lucide-react';
import { 
  startAudio, stopAudio, getAudioData, autoCorrelate, 
  noteFromPitch, getNoteString, getSampleRate, getCentsOffPitch,
  playGuideNote // นำเข้าฟังก์ชันเล่นเสียง
} from '../utils/audioEngine';
import { AppContext } from '../contexts/AppContext';

const VocalPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState('--');
  const [cents, setCents] = useState(0);
  const [activeNoteNum, setActiveNoteNum] = useState(null);
  
  const [isFindingRange, setIsFindingRange] = useState(false);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const pitchBufferRef = useRef([]); 

  const { updateVocalRange } = useContext(AppContext);

  const whiteKeys = [
    { n: "C", num: 48, label: "C3" }, { n: "D", num: 50, label: "D" }, { n: "E", num: 52, label: "E" }, 
    { n: "F", num: 53, label: "F" }, { n: "G", num: 55, label: "G" }, { n: "A", num: 57, label: "A" }, 
    { n: "B", num: 59, label: "B" }, { n: "C", num: 60, label: "C4" }
  ];
  
  const blackKeys = [
    { n: "C#", num: 49, left: 12.5, label: "C#" }, { n: "D#", num: 51, left: 25, label: "D#" }, 
    { n: "F#", num: 54, left: 50, label: "F#" }, { n: "G#", num: 56, left: 62.5, label: "G#" }, 
    { n: "A#", num: 58, left: 75, label: "A#" }, { n: "C#", num: 61, left: 100, label: "C#" }
  ];

  useEffect(() => {
    if (isFindingRange && activeNoteNum !== null) {
      updateVocalRange(activeNoteNum);
    }
  }, [activeNoteNum, isFindingRange, updateVocalRange]);

  const toggleMic = async () => {
    if (isListening) {
      stopAudio();
      setIsListening(false);
      setIsFindingRange(false);
      resetStats();
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

  const toggleFindRange = async () => {
    if (!isListening) {
      const success = await startAudio();
      if (success) {
        setIsListening(true);
        animationRef.current = requestAnimationFrame(processAudio);
      } else {
        alert("กรุณาอนุญาตการเข้าถึงไมโครโฟนครับ");
        return;
      }
    }
    setIsFindingRange(!isFindingRange);
  };

  const resetStats = () => {
    setNote('--');
    setPitch(null);
    setCents(0);
    setActiveNoteNum(null);
    pitchBufferRef.current = [];
  };

  const processAudio = (timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = getAudioData();

    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataArray) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = isFindingRange ? '#f43f5e' : '#22d3ee'; 
      ctx.beginPath();
      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] * (canvas.height / 2.5); 
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
          pitchBufferRef.current.push(detectedPitch);
          if (pitchBufferRef.current.length > 5) pitchBufferRef.current.shift(); 
          const avgPitch = pitchBufferRef.current.reduce((sum, val) => sum + val, 0) / pitchBufferRef.current.length;

          const noteNumber = noteFromPitch(avgPitch);
          const noteName = getNoteString(noteNumber);
          const centsOff = getCentsOffPitch(avgPitch, noteNumber);
          
          setPitch(avgPitch.toFixed(1));
          setNote(noteName);
          setCents(centsOff);
          setActiveNoteNum(noteNumber);
        }
        lastUpdateRef.current = timestamp;
      }
    }
    animationRef.current = requestAnimationFrame(processAudio);
  };

  const isKeyActive = (keyNum) => {
    if (activeNoteNum === null) return false;
    return activeNoteNum % 12 === keyNum % 12;
  };

  const getTuningColor = () => {
    if (note === '--') return 'bg-slate-700';
    if (Math.abs(cents) <= 10) return 'bg-neonGreen shadow-[0_0_15px_#10b981]';
    return cents > 0 ? 'bg-yellow-400' : 'bg-red-400';
  };

  return (
    <div className="flex flex-col h-full bg-darkBg text-white overflow-hidden relative">
      
      <div className="px-6 pt-4 pb-1 flex justify-between items-center shrink-0">
        <h1 className="text-xl font-black tracking-tight">VOCAL <span className="text-neonBlue">MONITOR</span></h1>
        <button 
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            isListening 
              ? 'bg-neonBlue/20 text-neonBlue border border-neonBlue shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
              : 'bg-darkCard text-slate-500 border border-slate-700 hover:text-white'
          }`}
        >
          {isListening ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
      </div>

      <div className="h-6 px-6 flex items-center justify-center shrink-0">
        {isFindingRange && (
          <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 animate-pulse">
            <Activity size={12} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Measuring Vocal Range</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className={`w-40 h-40 md:w-64 md:h-64 rounded-full blur-[60px] transition-colors duration-500 ${isFindingRange ? 'bg-rose-500' : 'bg-neonBlue'}`}></div>
        </div>
        <span className={`text-[100px] md:text-[120px] font-black leading-none transition-all duration-300 ${note !== '--' ? 'text-white scale-110' : 'text-slate-800'}`}>
          {note}
        </span>
        <div className="h-6 mt-1 flex items-center gap-2">
           {pitch && <span className="text-slate-400 font-mono text-base tracking-[0.2em]">{pitch} Hz</span>}
        </div>
      </div>

      <div className="px-10 pb-4 shrink-0">
        <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1.5 tracking-widest">
          <span>FLAT</span>
          <span className={Math.abs(cents) <= 10 && note !== '--' ? 'text-neonGreen' : ''}>PERFECT</span>
          <span>SHARP</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-700 -translate-x-1/2"></div>
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-200 ease-out ${getTuningColor()}`}
            style={{ left: `${Math.max(5, Math.min(95, cents + 50))}%`, transform: 'translate(-50%, -50%)' }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-6 pb-4 shrink-0">
        <button 
          onClick={toggleFindRange}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 group ${
            isFindingRange 
              ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
              : 'bg-darkCard border-slate-800 hover:border-neonBlue'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isFindingRange ? 'bg-rose-500 text-white' : 'bg-neonBlue/10 text-neonBlue group-hover:bg-neonBlue group-hover:text-darkBg'
          }`}>
            <Target size={16} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isFindingRange ? 'text-rose-500' : 'text-slate-400'}`}>
            Find Range
          </span>
        </button>

        <button className="flex flex-col items-center gap-1.5 p-3 bg-darkCard border border-slate-800 rounded-2xl hover:border-neonGreen transition-colors group">
          <div className="w-8 h-8 rounded-full bg-neonGreen/10 flex items-center justify-center text-neonGreen group-hover:bg-neonGreen group-hover:text-darkBg transition-all">
            <Flame size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Warm Up</span>
        </button>
      </div>

      <div className="px-6 pb-4 shrink-0">
        <div className="bg-darkCard border border-slate-800 rounded-xl p-3 overflow-hidden relative">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Spectrum</span>
            {isListening && <div className="flex gap-1"><div className={`w-1.5 h-1.5 rounded-full animate-ping ${isFindingRange ? 'bg-rose-500' : 'bg-neonGreen'}`}></div></div>}
          </div>
          <canvas ref={canvasRef} width="400" height="40" className="w-full h-[40px]"></canvas>
        </div>
      </div>

      <div className="px-6 pb-2 shrink-0">
        <div className="relative w-full h-20 bg-slate-900 border-x-2 border-t-2 border-b-4 border-slate-800 rounded-t-lg rounded-b-xl flex overflow-hidden select-none">
          
          {/* White Keys */}
          {whiteKeys.map((key, i) => {
            const active = isKeyActive(key.num);
            return (
              <div 
                key={i} 
                onPointerDown={() => playGuideNote(key.num)}
                className={`flex-1 relative border-r border-slate-300 rounded-b flex items-end justify-center pb-1 transition-colors duration-150 cursor-pointer active:bg-neonBlue/30 ${
                  active ? 'bg-neonBlue shadow-[inset_0_-5px_15px_rgba(34,211,238,0.6)]' : 'bg-slate-200'
                }`}
              >
                <span className={`text-[9px] font-bold ${active ? 'text-white' : 'text-slate-500'}`}>
                  {key.label}
                </span>
              </div>
            );
          })}

          {/* Black Keys */}
          {blackKeys.map((key, i) => {
            const active = isKeyActive(key.num);
            return (
              <div 
                key={i} 
                onPointerDown={() => playGuideNote(key.num)}
                className={`absolute top-0 w-[8%] h-[60%] rounded-b shadow-md transition-colors duration-150 z-10 flex items-end justify-center pb-1 cursor-pointer active:bg-neonBlue/60 ${
                  active ? 'bg-neonBlue shadow-[0_5px_15px_rgba(34,211,238,0.5)]' : 'bg-slate-900 border-x border-b border-black'
                }`}
                style={{ 
                  left: `${key.left}%`, 
                  transform: 'translateX(-50%)'
                }}
              >
                <span className={`text-[7px] font-bold ${active ? 'text-white' : 'text-slate-400'}`}>
                  {key.label}
                </span>
              </div>
            );
          })}
          
        </div>
      </div>

    </div>
  );
};

export default VocalPage;