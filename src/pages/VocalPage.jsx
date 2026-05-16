import { useState, useEffect, useRef, useContext } from 'react';
import { Mic, MicOff, Flame, Target, Activity, ChevronLeft, ChevronRight, X, Settings2, Play } from 'lucide-react';
import { 
  startAudio, stopAudio, getAudioData, autoCorrelate, 
  noteFromPitch, getNoteString, getSampleRate, getCentsOffPitch,
  playGuideNote, startWarmUpPattern, stopWarmUpPattern 
} from '../utils/audioEngine';
import { AppContext } from '../contexts/AppContext';

const VocalPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [pitch, setPitch] = useState(null);
  const [note, setNote] = useState('--');
  const [cents, setCents] = useState(0);
  const [activeNoteNum, setActiveNoteNum] = useState(null);
  const [isFindingRange, setIsFindingRange] = useState(false);
  
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [guideNoteNum, setGuideNoteNum] = useState(null);
  const isWarmingUpRef = useRef(false);
  const warmupBaseNoteRef = useRef(48);
  const [baseOctave, setBaseOctave] = useState(3);

  const [isWarmUpModalOpen, setIsWarmUpModalOpen] = useState(false);
  const [rangeMode, setRangeMode] = useState('custom'); 
  const [customStartNote, setCustomStartNote] = useState(48); 
  const [customEndNote, setCustomEndNote] = useState(72); 
  const [patternMode, setPatternMode] = useState('scale'); 

  const warmupEndNoteRef = useRef(72);
  const warmupPatternRef = useRef('scale');

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const pitchBufferRef = useRef([]); 

  const { updateVocalRange, lowestNoteNum, highestNoteNum } = useContext(AppContext);
  const hasSavedRange = lowestNoteNum !== null && highestNoteNum !== null;

  const startNoteNum = (baseOctave + 1) * 12;

  const whiteKeys = [
    { num: startNoteNum, label: `C${baseOctave}` }, { num: startNoteNum + 2, label: "D" }, 
    { num: startNoteNum + 4, label: "E" }, { num: startNoteNum + 5, label: "F" }, 
    { num: startNoteNum + 7, label: "G" }, { num: startNoteNum + 9, label: "A" }, 
    { num: startNoteNum + 11, label: "B" }, { num: startNoteNum + 12, label: `C${baseOctave + 1}` }
  ];
  
  const blackKeys = [
    { num: startNoteNum + 1, left: 12.5, label: "C#" }, { num: startNoteNum + 3, left: 25, label: "D#" }, 
    { num: startNoteNum + 6, left: 50, label: "F#" }, { num: startNoteNum + 8, left: 62.5, label: "G#" }, 
    { num: startNoteNum + 10, left: 75, label: "A#" }, { num: startNoteNum + 13, left: 100, label: "C#" }
  ];

  useEffect(() => {
    if (isWarmingUp && guideNoteNum !== null) {
      const currentStart = (baseOctave + 1) * 12;
      const currentEnd = currentStart + 12;
      if (guideNoteNum < currentStart || guideNoteNum > currentEnd) {
        const newOctave = Math.floor(guideNoteNum / 12) - 1;
        setBaseOctave(newOctave);
      }
    }
  }, [guideNoteNum, isWarmingUp, baseOctave]);

  useEffect(() => {
    if (isFindingRange && activeNoteNum !== null) {
      updateVocalRange(activeNoteNum);
    }
  }, [activeNoteNum, isFindingRange, updateVocalRange]);

  useEffect(() => {
    return () => { stopWarmUpPattern(); }
  }, []);

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
    if (isFindingRange) {
      // ถ้ากำลังหา Range อยู่ แล้วผู้ใช้กดปุ่มซ้ำ -> สั่งปิดไมค์และปิดระบบทั้งหมดทันที
      stopAudio();
      setIsListening(false);
      setIsFindingRange(false);
      resetStats();
      cancelAnimationFrame(animationRef.current);
    } else {
      // ถ้ายังไม่ได้เปิดระบบ -> สั่งเปิดไมค์และเริ่มหา Range
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
      setIsFindingRange(true);
    }
  };

  const handleWarmUpClick = () => {
    if (isWarmingUpRef.current) {
      stopWarmUpPattern();
      isWarmingUpRef.current = false;
      setIsWarmingUp(false);
      setGuideNoteNum(null);
    } else {
      setIsWarmUpModalOpen(true);
    }
  };

  const startConfiguredWarmUp = () => {
    setIsWarmUpModalOpen(false);

    let startN = 48;
    let endN = 72;

    if (rangeMode === 'saved' && hasSavedRange) {
      startN = lowestNoteNum;
      endN = highestNoteNum;
    } else {
      startN = parseInt(customStartNote);
      endN = parseInt(customEndNote);
    }

    if (startN > endN) {
      const temp = startN;
      startN = endN;
      endN = temp;
    }

    warmupBaseNoteRef.current = startN;
    warmupEndNoteRef.current = endN;
    warmupPatternRef.current = patternMode;

    isWarmingUpRef.current = true;
    setIsWarmingUp(true);
    
    setBaseOctave(Math.floor(startN / 12) - 1);
    
    runWarmUpCycle();
  };

  const runWarmUpCycle = () => {
    if (!isWarmingUpRef.current) return;
    
    if (warmupBaseNoteRef.current > warmupEndNoteRef.current) { 
      stopWarmUpPattern();
      isWarmingUpRef.current = false;
      setIsWarmingUp(false);
      setGuideNoteNum(null);
      alert("วอร์มเสียงเสร็จสิ้นครับ เยี่ยมมาก!");
      return;
    }

    startWarmUpPattern(
      warmupBaseNoteRef.current,
      warmupPatternRef.current,
      (playingNote) => {
        setGuideNoteNum(playingNote);
      },
      () => {
        setGuideNoteNum(null);

        if (warmupBaseNoteRef.current >= warmupEndNoteRef.current) {
          setTimeout(() => {
            if (!isWarmingUpRef.current) return;
            warmupBaseNoteRef.current += 1;
            runWarmUpCycle();
          }, 800); // ปรับลดเวลาตอนจบคีย์สุดท้าย
          return;
        }

        // --- จุดที่ต้องปรับเวลา (รอยต่อเปลี่ยนคีย์) ---
        
        // 1. ปรับจาก 1500 -> 800 (พัก 0.8 วิ หลังร้องสเกลจบ)
        setTimeout(() => {
          if (!isWarmingUpRef.current) return;
          
          const currentKeyRoot = warmupBaseNoteRef.current;
          const nextKeyRoot = currentKeyRoot + 1;

          playGuideNote(currentKeyRoot, 0.4); // ลดหางเสียงไกด์ลงเหลือ 0.4 วิ
          setGuideNoteNum(currentKeyRoot);

          // 2. ปรับจาก 500 -> 400 (ระยะห่างระหว่างเสียงไกด์ C และ C#)
          setTimeout(() => {
            if (!isWarmingUpRef.current) return;
            
            playGuideNote(nextKeyRoot, 0.4); // ลดหางเสียงไกด์ลงเหลือ 0.4 วิ
            setGuideNoteNum(nextKeyRoot);

            // 3. ปรับจาก 1500 -> 800 (พัก 0.8 วิ ก่อนเริ่มร้องสเกลใหม่)
            setTimeout(() => {
              if (!isWarmingUpRef.current) return;
              setGuideNoteNum(null);
              warmupBaseNoteRef.current = nextKeyRoot; 
              runWarmUpCycle(); 
            }, 1200);

          }, 400);

        }, 800);
      }
    );
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
    if (guideNoteNum !== null) return guideNoteNum === keyNum;
    if (activeNoteNum === null) return false;
    return activeNoteNum === keyNum;
  };

  const getTuningColor = () => {
    if (note === '--') return 'bg-slate-700';
    if (Math.abs(cents) <= 10) return 'bg-neonGreen shadow-[0_0_15px_#10b981]';
    return cents > 0 ? 'bg-yellow-400' : 'bg-red-400';
  };

  const shiftOctave = (direction) => {
    setBaseOctave(prev => {
      const newOctave = prev + direction;
      return Math.max(1, Math.min(6, newOctave)); 
    });
  };

  const renderNoteOptions = () => {
    const opts = [];
    for(let i=36; i<=84; i++) { 
      opts.push(<option key={i} value={i} className="bg-slate-800">{getNoteString(i)}</option>);
    }
    return opts;
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

        <button 
          onClick={handleWarmUpClick}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-300 group ${
            isWarmingUp 
              ? 'bg-neonGreen/10 border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-darkCard border-slate-800 hover:border-neonGreen'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isWarmingUp ? 'bg-neonGreen text-darkBg' : 'bg-neonGreen/10 text-neonGreen group-hover:bg-neonGreen group-hover:text-darkBg'
          }`}>
            {isWarmingUp ? <span className="w-3 h-3 bg-darkBg rounded-sm"></span> : <Flame size={16} />}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarmingUp ? 'text-neonGreen' : 'text-slate-400'}`}>
            {isWarmingUp ? 'Stop Warm' : 'Warm Up'}
          </span>
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

      <div className="px-6 pb-2 shrink-0 flex flex-col">
        <div className="flex justify-between items-center px-4 mb-2">
          <button 
            onClick={() => shiftOctave(-1)} disabled={baseOctave <= 1}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          ><ChevronLeft size={16} /></button>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Octave {baseOctave} <span className="lowercase text-slate-600">(C{baseOctave} - C{baseOctave + 1})</span>
          </span>
          <button 
            onClick={() => shiftOctave(1)} disabled={baseOctave >= 6}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          ><ChevronRight size={16} /></button>
        </div>

        <div className="relative w-full h-20 bg-slate-900 border-x-2 border-t-2 border-b-4 border-slate-800 rounded-t-lg rounded-b-xl flex overflow-hidden select-none">
          {whiteKeys.map((key, i) => {
            const active = isKeyActive(key.num);
            return (
              <div 
                key={i} onPointerDown={() => playGuideNote(key.num)}
                className={`flex-1 relative border-r border-slate-300 rounded-b flex items-end justify-center pb-1 transition-colors duration-150 cursor-pointer active:bg-neonBlue/30 ${
                  active ? 'bg-neonBlue shadow-[inset_0_-5px_15px_rgba(34,211,238,0.6)]' : 'bg-slate-200'
                }`}
              ><span className={`text-[9px] font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{key.label}</span></div>
            );
          })}

          {blackKeys.map((key, i) => {
            const active = isKeyActive(key.num);
            return (
              <div 
                key={i} onPointerDown={() => playGuideNote(key.num)}
                className={`absolute top-0 w-[8%] h-[60%] rounded-b shadow-md transition-colors duration-150 z-10 flex items-end justify-center pb-1 cursor-pointer active:bg-neonBlue/60 ${
                  active ? 'bg-neonBlue shadow-[0_5px_15px_rgba(34,211,238,0.5)]' : 'bg-slate-900 border-x border-b border-black'
                }`}
                style={{ left: `${key.left}%`, transform: 'translateX(-50%)' }}
              ><span className={`text-[7px] font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{key.label}</span></div>
            );
          })}
        </div>
      </div>

      {isWarmUpModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in duration-200">
          <div className="bg-darkBg border border-slate-700 rounded-3xl p-6 shadow-2xl mb-24 relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-neonGreen/5 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-neonGreen/10 text-neonGreen rounded-lg"><Settings2 size={20}/></div>
                <h2 className="text-lg font-bold text-white">Warm Up Setup</h2>
              </div>
              <button onClick={() => setIsWarmUpModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-6 relative z-10">
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">1. Target Range</label>
                <div className="flex flex-col gap-3">
                  
                  <label className={`flex flex-col p-3 rounded-xl border transition-colors cursor-pointer ${rangeMode === 'custom' ? 'bg-neonBlue/10 border-neonBlue' : 'bg-darkCard border-slate-800'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="radio" name="rangeMode" value="custom" checked={rangeMode === 'custom'} onChange={() => setRangeMode('custom')} className="accent-neonBlue" />
                      <span className="text-sm font-bold text-white">Custom Range</span>
                    </div>
                    {rangeMode === 'custom' && (
                      <div className="flex items-center gap-2 pl-7 mt-1">
                        <select value={customStartNote} onChange={(e) => setCustomStartNote(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-neonBlue">
                          {renderNoteOptions()}
                        </select>
                        <span className="text-slate-500 text-xs">to</span>
                        <select value={customEndNote} onChange={(e) => setCustomEndNote(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none focus:border-neonBlue">
                          {renderNoteOptions()}
                        </select>
                      </div>
                    )}
                  </label>

                  <label className={`flex flex-col p-3 rounded-xl border transition-colors ${!hasSavedRange ? 'opacity-50 cursor-not-allowed bg-darkCard border-slate-800' : rangeMode === 'saved' ? 'bg-neonGreen/10 border-neonGreen cursor-pointer' : 'bg-darkCard border-slate-800 cursor-pointer'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="rangeMode" value="saved" checked={rangeMode === 'saved'} disabled={!hasSavedRange} onChange={() => setRangeMode('saved')} className="accent-neonGreen" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">My Vocal Profile</span>
                        {hasSavedRange ? (
                           <span className="text-xs text-neonGreen font-medium">{getNoteString(lowestNoteNum)} — {getNoteString(highestNoteNum)}</span>
                        ) : (
                           <span className="text-[10px] text-rose-400 font-medium mt-0.5">Please measure Vocal Range first</span>
                        )}
                      </div>
                    </div>
                  </label>

                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">2. Exercise Pattern</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPatternMode('scale')} className={`flex flex-col items-start p-3 rounded-xl border transition-colors text-left ${patternMode === 'scale' ? 'bg-purple-500/10 border-purple-500' : 'bg-darkCard border-slate-800'}`}>
                    <span className={`text-sm font-bold mb-1 ${patternMode === 'scale' ? 'text-purple-400' : 'text-white'}`}>5-Tone Scale</span>
                    <span className="text-[9px] text-slate-500 tracking-wider">1 - 2 - 3 - 4 - 5</span>
                  </button>
                  <button onClick={() => setPatternMode('arpeggio')} className={`flex flex-col items-start p-3 rounded-xl border transition-colors text-left ${patternMode === 'arpeggio' ? 'bg-purple-500/10 border-purple-500' : 'bg-darkCard border-slate-800'}`}>
                    <span className={`text-sm font-bold mb-1 ${patternMode === 'arpeggio' ? 'text-purple-400' : 'text-white'}`}>Arpeggio</span>
                    <span className="text-[9px] text-slate-500 tracking-wider">1 - 3 - 5 - 8</span>
                  </button>
                </div>
              </div>

            </div>

            <button onClick={startConfiguredWarmUp} className="w-full mt-8 py-4 bg-neonGreen text-darkBg font-black tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Play fill="currentColor" size={16}/> START WARM UP
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VocalPage;