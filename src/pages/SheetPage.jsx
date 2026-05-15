import { useState, useEffect, useRef } from 'react';
import { Search, Plus, FileText, Music, X, Image as ImageIcon, Check } from 'lucide-react';
import { db, compressImage } from '../utils/db';

const SheetPage = () => {
  const [sheets, setSheets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับโหมดเพิ่มชีตเพลง
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newSheet, setNewSheet] = useState({ title: '', artist: '', songKey: 'C' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // State สำหรับโหมดดูรูปเต็มจอ
  const [viewingSheet, setViewingSheet] = useState(null);

  const fileInputRef = useRef(null);

  // ดึงข้อมูลทั้งหมดจาก IndexedDB เมื่อเปิดหน้าต่างนี้
  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    const allSheets = await db.sheets.orderBy('id').reverse().toArray();
    setSheets(allSheets);
  };

  // ลอจิกการเลือกและพรีวิวรูป
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // ลอจิกการบันทึกลงฐานข้อมูลออฟไลน์
  const handleSaveSheet = async () => {
    if (!newSheet.title || !selectedFile) return alert('กรุณาใส่ชื่อเพลงและเลือกรูปชีตเพลงครับ');
    
    setIsUploading(true);
    try {
      // 1. บีบอัดรูปก่อน
      const compressedBlob = await compressImage(selectedFile);
      
      // 2. เซฟลง Dexie
      await db.sheets.add({
        title: newSheet.title,
        artist: newSheet.artist || 'Unknown',
        songKey: newSheet.songKey,
        imageBlob: compressedBlob,
        dateAdded: new Date().toISOString()
      });

      // 3. รีเซ็ตและโหลดใหม่
      setIsModalOpen(false);
      setNewSheet({ title: '', artist: '', songKey: 'C' });
      setSelectedFile(null);
      setPreviewUrl(null);
      loadSheets();
    } catch (error) {
      console.error("Error saving sheet:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกครับ");
    }
    setIsUploading(false);
  };

  const filteredSheets = sheets.filter(sheet => 
    sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-darkBg pb-24 relative">
      
      {/* Header & Search */}
      <div className="p-6 pb-4 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">SHEET <span className="text-neonBlue">MUSIC</span></h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-neonGreen/20 text-neonGreen rounded-xl border border-neonGreen/40 active:scale-95 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search songs, artists..."
            className="w-full bg-darkCard border border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-neonBlue transition-colors shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Sheet List */}
      <div className="flex-1 px-6 overflow-y-auto space-y-3 pb-6">
        {filteredSheets.map((sheet) => {
          // สร้าง URL ชั่วคราวจาก Blob เพื่อให้โหลดเร็วระดับ Millisecond
          const imageUrl = URL.createObjectURL(sheet.imageBlob);
          
          return (
            <div 
              key={sheet.id} 
              onClick={() => setViewingSheet(imageUrl)}
              className="bg-darkCard border border-slate-800 rounded-2xl p-3 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="w-16 h-20 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-700 relative">
                <img src={imageUrl} alt={sheet.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base truncate">{sheet.title}</h3>
                <p className="text-slate-400 text-xs truncate mt-0.5">{sheet.artist}</p>
                <div className="inline-block mt-2 px-2 py-0.5 rounded bg-neonBlue/10 text-neonBlue text-[10px] font-bold border border-neonBlue/20">
                  Key: {sheet.songKey}
                </div>
              </div>
            </div>
          );
        })}

        {filteredSheets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No sheet music found.</p>
            <p className="text-xs mt-1">Tap + to add your first score.</p>
          </div>
        )}
      </div>

      {/* Modal เพิ่มชีตเพลง (Add New Sheet) */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <div className="bg-darkBg border border-slate-700 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl mt-4 mb-20">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-white">Add New Sheet</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Image Picker */}
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full h-48 rounded-2xl border-2 border-dashed border-slate-700 bg-darkCard flex flex-col items-center justify-center cursor-pointer hover:border-neonBlue transition-colors overflow-hidden relative"
              >
                {previewUrl ? (
                  <img src={previewUrl} className="w-full h-full object-cover opacity-80" alt="Preview" />
                ) : (
                  <>
                    <ImageIcon size={32} className="text-slate-500 mb-2" />
                    <span className="text-sm text-slate-400 font-medium">Tap to upload photo</span>
                    <span className="text-[10px] text-slate-600 mt-1">JPEG, PNG, WEBP</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              </div>

              {/* Form Inputs */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Song Title</label>
                <input 
                  type="text" value={newSheet.title} onChange={e => setNewSheet({...newSheet, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neonBlue"
                  placeholder="e.g. ฤดูที่แตกต่าง"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Artist</label>
                  <input 
                    type="text" value={newSheet.artist} onChange={e => setNewSheet({...newSheet, artist: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neonBlue"
                    placeholder="Artist Name"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Key</label>
                  <input 
                    type="text" value={newSheet.songKey} onChange={e => setNewSheet({...newSheet, songKey: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neonBlue text-center"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 shrink-0 bg-darkCard">
              <button 
                onClick={handleSaveSheet}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-neonGreen text-darkBg font-black tracking-wider active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? 'SAVING...' : <><Check size={20} /> SAVE SHEET</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* โหมด Full Screen Viewer (ดูรูปชัดๆ) */}
      {viewingSheet && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex justify-end p-4 absolute top-0 w-full z-10 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={() => setViewingSheet(null)} className="p-3 bg-slate-800/80 text-white rounded-full backdrop-blur-md">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-2 pt-20">
             <img src={viewingSheet} className="max-w-full w-auto h-auto object-contain" alt="Sheet Full View" />
          </div>
        </div>
      )}

    </div>
  );
};

export default SheetPage;