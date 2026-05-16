import { useContext, useState, useRef } from 'react';
import { User, Award, HardDrive, FileText, RefreshCw, Trash2, Music, Mic, X, Camera, Check, Download, Upload } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { getNoteString } from '../utils/audioEngine'; 
import { compressImage } from '../utils/db';

const ProfilePage = () => {
  const { 
    lowestNoteNum, highestNoteNum, resetVocalRange, 
    sheetCount, storageUsed, clearAllData,
    userProfile, updateProfile, exportAllData, importAllData
  } = useContext(AppContext);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', rank: '' });
  const [tempPicUrl, setTempPicUrl] = useState(null);
  const [newPicBlob, setNewPicBlob] = useState(null);
  
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const hasRange = lowestNoteNum !== null && highestNoteNum !== null;
  const lowestStr = hasRange ? getNoteString(lowestNoteNum) : "--";
  const highestStr = hasRange ? getNoteString(highestNoteNum) : "--";

  const minPianoNote = 24; 
  const totalNotes = 84;
  let rangeStart = hasRange ? ((lowestNoteNum - minPianoNote) / totalNotes) * 100 : 0;
  let rangeWidth = hasRange ? ((highestNoteNum - lowestNoteNum) / totalNotes) * 100 : 0;

  const profileImageUrl = userProfile.profilePic ? URL.createObjectURL(userProfile.profilePic) : null;

  const getVoiceType = (lowest, highest) => {
    if (lowest === null || highest === null) return "Not Measured";
    const mid = (lowest + highest) / 2;
    if (mid < 53.5) return "Bass";
    if (mid < 57.5) return "Baritone";
    if (mid < 62.5) return "Tenor";
    if (mid < 67.5) return "Alto";
    if (mid < 71.5) return "Mezzo-Soprano";
    return "Soprano";
  };
  const voiceType = getVoiceType(lowestNoteNum, highestNoteNum);

  const openSettings = () => {
    setEditData({ name: userProfile.name, rank: userProfile.rank });
    setTempPicUrl(profileImageUrl);
    setIsSettingsOpen(true);
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setNewPicBlob(compressed);
      setTempPicUrl(URL.createObjectURL(compressed));
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        await importAllData(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const saveSettings = async () => {
    const dataToUpdate = { name: editData.name, rank: editData.rank };
    if (newPicBlob) dataToUpdate.profilePic = newPicBlob;
    await updateProfile(dataToUpdate);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-darkBg px-6 pt-8 pb-24 overflow-y-auto no-scrollbar relative">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neonBlue to-neonGreen p-1 mb-3 shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden">
          <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            {profileImageUrl ? (
              <img src={profileImageUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User size={48} className="text-slate-500" />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-wide">{userProfile.name}</h2>
        <p className="text-neonBlue font-medium flex items-center gap-2 mt-1 text-sm">
          <Award size={16} /> {userProfile.rank}
        </p>
      </div>

      {/* Vocal Range Chart */}
      <div className="bg-darkCard border border-slate-800 rounded-3xl p-5 mb-4 relative flex flex-col gap-4">
        <div className="flex justify-between items-center w-full relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Vocal Range:</span>
            <span className={`text-sm font-black tracking-tighter ${hasRange ? 'text-neonGreen' : 'text-slate-500'}`}>
              {lowestStr} <span className="text-slate-600 font-medium px-1">—</span> {highestStr}
            </span>
          </div>
          <button onClick={resetVocalRange} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase border border-slate-700">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
        <div className="relative h-10 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          {hasRange ? (
            <div className="absolute h-full bg-gradient-to-r from-neonBlue/40 to-neonGreen/40 border-x-2 border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-500"
              style={{ left: `${Math.max(0, rangeStart)}%`, width: `${Math.max(2, rangeWidth)}%` }}></div>
          ) : (
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase tracking-widest"><Mic size={12} className="mr-2"/> Measure in Vocal Tab</div>
          )}
        </div>
        <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase px-1"><span>C1</span><span>C4</span><span>C8</span></div>
      </div>

      {/* Voice Type Card */}
      <div className="bg-darkCard border border-slate-800 rounded-2xl p-4 mb-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${hasRange ? 'bg-neonBlue/10 text-neonBlue' : 'bg-slate-800 text-slate-500'}`}>
          <Music size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">Voice Type</p>
          <p className={`text-xl font-black tracking-wide ${!hasRange ? 'text-slate-600' : 'text-white'}`}>
            {voiceType}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center">
          <FileText size={20} className="text-neonBlue mb-2" />
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Sheets</p>
          <p className="text-2xl font-black text-white">{sheetCount}</p>
        </div>
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center">
          <HardDrive size={20} className="text-neonGreen mb-2" />
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Storage</p>
          <p className="text-2xl font-black text-white">{storageUsed}</p>
        </div>
      </div>

      {/* Account Settings Button (ขยับขึ้นมาเหนือปุ่ม Backup) */}
      <button onClick={openSettings} className="w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold tracking-wider hover:bg-slate-700 transition-colors mb-4 border border-slate-700">
        Account Settings
      </button>

      {/* ระบบ Backup & Restore (ย้ายมาอยู่ล่าง Account Settings) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={exportAllData}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-800 transition-colors"
        >
          <Download size={16} className="text-neonBlue" /> Export Backup
        </button>
        <button 
          onClick={() => importInputRef.current.click()}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-800 transition-colors"
        >
          <Upload size={16} className="text-neonGreen" /> Import Backup
        </button>
        <input type="file" ref={importInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
      </div>

      {/* Danger Zone */}
      <button onClick={() => window.confirm("คุณต้องการลบข้อมูลทั้งหมดในเครื่องใช่ไหม? ข้อมูลแผ่นเพลงและข้อมูลส่วนตัวจะหายไปทั้งหมด") && clearAllData()}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-rose-500/10 text-rose-500 font-bold border border-rose-500/30">
        <Trash2 size={18} /> Clear All Data
      </button>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-200">
          <div className="bg-darkBg border border-slate-700 rounded-3xl p-6 shadow-2xl mt-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-slate-800 rounded-full"><X size={20}/></button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div onClick={() => fileInputRef.current.click()} className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer">
                {tempPicUrl ? <img src={tempPicUrl} className="w-full h-full object-cover" /> : <Camera className="text-slate-500" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera size={20}/></div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handlePicChange} accept="image/*" className="hidden" />
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase">Tap to change photo</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Display Name</label>
                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-[16px] focus:border-neonBlue outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bio / Rank</label>
                <input type="text" value={editData.rank} onChange={e => setEditData({...editData, rank: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-[16px] focus:border-neonBlue outline-none" />
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-4 bg-neonBlue text-darkBg font-black rounded-xl flex items-center justify-center gap-2">
              <Check size={20}/> SAVE CHANGES
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;