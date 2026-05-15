import { useContext } from 'react';
import { User, Award, HardDrive, FileText, RefreshCw, Trash2, Music } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { getNoteString } from '../utils/audioEngine'; 

const ProfilePage = () => {
  const { 
    lowestNoteNum, highestNoteNum, resetVocalRange, 
    sheetCount, storageUsed, clearAllData 
  } = useContext(AppContext);

  const user = { name: "Phattharaphon K.", rank: "Advanced Singer" };

  const minPianoNote = 24; 
  const totalNotes = 84;
  
  let rangeStart = 0;
  let rangeWidth = 0;
  
  if (lowestNoteNum !== null && highestNoteNum !== null) {
    rangeStart = ((lowestNoteNum - minPianoNote) / totalNotes) * 100;
    rangeWidth = ((highestNoteNum - lowestNoteNum) / totalNotes) * 100;
    if (rangeWidth < 2) rangeWidth = 2; 
  }

  const lowestStr = lowestNoteNum !== null ? getNoteString(lowestNoteNum) : "--";
  const highestStr = highestNoteNum !== null ? getNoteString(highestNoteNum) : "--";

  // ลอจิกคำนวณประเภทเนื้อเสียง (Voice Type) จากจุดกึ่งกลางของ Range
  const getVoiceType = (lowest, highest) => {
    if (lowest === null || highest === null) return "Not Measured";
    
    // หาจุดกึ่งกลาง (Midpoint) ของเสียง
    const mid = (lowest + highest) / 2;
    
    // เทียบเคียงกับค่ามาตรฐาน (MIDI Note Numbers)
    if (mid < 53.5) return "Bass";
    if (mid < 57.5) return "Baritone";
    if (mid < 62.5) return "Tenor";
    if (mid < 67.5) return "Alto";
    if (mid < 71.5) return "Mezzo-Soprano";
    return "Soprano";
  };

  const voiceType = getVoiceType(lowestNoteNum, highestNoteNum);

  return (
    <div className="flex flex-col h-full bg-darkBg px-6 pt-8 pb-24 overflow-y-auto no-scrollbar">
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neonBlue to-neonGreen p-1 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <div className="w-full h-full rounded-full bg-darkBg flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">{user.name}</h2>
        <p className="text-neonBlue font-medium flex items-center gap-2 mt-1">
          <Award size={16} /> {user.rank}
        </p>
      </div>

      <div className="bg-darkCard border border-slate-800 rounded-3xl p-6 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neonGreen/5 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Vocal Range</h3>
            <span className="text-neonGreen font-black text-2xl tracking-tighter">
              {lowestStr} <span className="text-slate-500 font-medium px-1">—</span> {highestStr}
            </span>
          </div>
          
          <button 
            onClick={resetVocalRange}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-[10px] font-bold uppercase tracking-wider border border-slate-700"
          >
            <RefreshCw size={12} /> Reset
          </button>
        </div>
        
        <div className="relative h-10 bg-slate-900 rounded-xl overflow-hidden mb-2 border border-slate-800">
          <div className="absolute inset-0 flex justify-between px-0 opacity-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white"></div>
            ))}
          </div>
          
          {lowestNoteNum !== null && (
            <div 
              className="absolute h-full bg-gradient-to-r from-neonBlue/40 to-neonGreen/40 border-x-2 border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500 ease-out"
              style={{ left: `${Math.max(0, rangeStart)}%`, width: `${Math.min(100, rangeWidth)}%` }}
            ></div>
          )}
        </div>
        
        <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest px-1">
          <span>C1</span>
          <span>C4 (MID)</span>
          <span>C8</span>
        </div>
      </div>

      {/* เพิ่มการ์ดแสดงประเภทเนื้อเสียง (Voice Type) */}
      <div className="bg-darkCard border border-slate-800 rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-neonBlue/10 flex items-center justify-center text-neonBlue shrink-0">
          <Music size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Voice Type</p>
          <p className={`text-xl font-black tracking-wide ${voiceType === 'Not Measured' ? 'text-slate-500' : 'text-white'}`}>
            {voiceType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-neonBlue/10 flex items-center justify-center text-neonBlue mb-3">
            <FileText size={20} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Saved Sheets</p>
          <p className="text-2xl font-black text-white">{sheetCount}</p>
        </div>
        
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-neonGreen/10 flex items-center justify-center text-neonGreen mb-3">
            <HardDrive size={20} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Storage Used</p>
          <p className="text-2xl font-black text-white">{storageUsed}</p>
        </div>
      </div>

      <button className="w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold tracking-wider hover:bg-slate-700 transition-colors mb-4 border border-slate-700">
        Account Settings
      </button>

      <button 
        onClick={() => {
          if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้")) {
            clearAllData();
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500/10 text-rose-500 font-bold tracking-wider hover:bg-rose-500/20 transition-colors border border-rose-500/30"
      >
        <Trash2 size={18} /> Clear All Data
      </button>

    </div>
  );
};

export default ProfilePage;