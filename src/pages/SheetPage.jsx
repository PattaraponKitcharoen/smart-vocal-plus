import { useState, useEffect, useRef } from 'react';
import { Search, Plus, FileText, X, Image as ImageIcon, Check, Trash2, Edit2, User, Filter } from 'lucide-react';
import { db, compressImage } from '../utils/db';

const SheetPage = () => {
  const [sheets, setSheets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับระบบ Filter
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  
  // State สำหรับ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newSheet, setNewSheet] = useState({ title: '', artist: '', songKey: 'C' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewingSheet, setViewingSheet] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    const allSheets = await db.sheets.orderBy('id').reverse().toArray();
    setSheets(allSheets);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSaveSheet = async () => {
    if (!newSheet.title) return alert('กรุณาใส่ชื่อเพลงครับ');
    if (!selectedFile) return alert('กรุณาเลือกรูปชีตเพลงครับ');
    
    setIsUploading(true);
    try {
      let blobToSave = null;

      if (selectedFile !== 'KEEP_EXISTING') {
        blobToSave = await compressImage(selectedFile);
      }

      if (editingId) {
        const updateData = {
          title: newSheet.title,
          artist: newSheet.artist || 'Unknown',
          songKey: newSheet.songKey
        };
        if (blobToSave) updateData.imageBlob = blobToSave;
        
        await db.sheets.update(editingId, updateData);
      } else {
        await db.sheets.add({
          title: newSheet.title,
          artist: newSheet.artist || 'Unknown',
          songKey: newSheet.songKey,
          imageBlob: blobToSave,
          dateAdded: new Date().toISOString()
        });
      }

      closeModal();
      loadSheets();
    } catch (error) {
      console.error("Error saving sheet:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกครับ");
    }
    setIsUploading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("แน่ใจหรือไม่ว่าต้องการลบชีตเพลงนี้?")) {
      await db.sheets.delete(id);
      loadSheets();
      
      // ล้าง Filter ที่อาจจะค้างอยู่ถ้าลบเพลงสุดท้ายของศิลปินนั้นทิ้งไป
      setSelectedArtists([]);
      setSelectedKeys([]);
    }
  };

  const handleEdit = (e, sheet) => {
    e.stopPropagation();
    setEditingId(sheet.id);
    setNewSheet({ title: sheet.title, artist: sheet.artist, songKey: sheet.songKey });
    
    const url = URL.createObjectURL(sheet.imageBlob);
    setPreviewUrl(url);
    setSelectedFile('KEEP_EXISTING');
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewSheet({ title: '', artist: '', songKey: 'C' });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // 1. ดึงรายชื่อศิลปินและคีย์ที่ไม่ซ้ำกันออกมาจากฐานข้อมูล เพื่อทำตัวเลือกใน Filter
  const uniqueArtists = [...new Set(sheets.map(s => s.artist))].filter(Boolean);
  const uniqueKeys = [...new Set(sheets.map(s => s.songKey))].filter(Boolean);

  // 2. ฟังก์ชันช่วยสลับการเลือก (Select/Deselect) แบบ Multiple
  const toggleSelection = (array, setArray, item) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  // 3. อัปเดตลอจิกการกรอง ให้เช็คทั้ง Search, Artist, และ Key
  const filteredSheets = sheets.filter(sheet => {
    const matchSearch = sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        sheet.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchArtist = selectedArtists.length === 0 || selectedArtists.includes(sheet.artist);
    const matchKey = selectedKeys.length === 0 || selectedKeys.includes(sheet.songKey);
    
    return matchSearch && matchArtist && matchKey;
  });

  const activeFilterCount = selectedArtists.length + selectedKeys.length;

  return (
    <div className="flex flex-col h-full bg-darkBg pb-24 relative">
      
      {/* Header & Search */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">SHEET <span className="text-neonBlue">MUSIC</span></h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-neonGreen/20 text-neonGreen rounded-xl border border-neonGreen/40 active:scale-95 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full bg-darkCard border border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-white text-[16px] focus:outline-none focus:border-neonBlue transition-colors shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* ปุ่มเปิด/ปิด Filter */}
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`relative p-3.5 rounded-2xl border transition-colors flex items-center justify-center shrink-0 ${
              isFilterOpen || activeFilterCount > 0 
                ? 'bg-neonBlue/20 border-neonBlue text-neonBlue' 
                : 'bg-darkCard border-slate-700 text-slate-400'
            }`}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neonBlue text-darkBg text-[10px] font-black flex items-center justify-center border-2 border-darkBg">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Dropdown Panel */}
      {isFilterOpen && (
        <div className="px-6 pb-4 shrink-0 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4">
            
            {/* Filter: Artists */}
            {uniqueArtists.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Artists</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueArtists.map(artist => {
                    const isSelected = selectedArtists.includes(artist);
                    return (
                      <button 
                        key={artist}
                        onClick={() => toggleSelection(selectedArtists, setSelectedArtists, artist)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {artist}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter: Keys */}
            {uniqueKeys.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keys</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueKeys.map(songKey => {
                    const isSelected = selectedKeys.includes(songKey);
                    return (
                      <button 
                        key={songKey}
                        onClick={() => toggleSelection(selectedKeys, setSelectedKeys, songKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected ? 'bg-neonBlue/20 border-neonBlue text-neonBlue' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {songKey}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ปุ่ม Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700 flex justify-end">
                <button 
                  onClick={() => { setSelectedArtists([]); setSelectedKeys([]); }}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-400 uppercase tracking-wider transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Sheet List */}
      <div className="flex-1 px-6 overflow-y-auto space-y-3 pb-6">
        {filteredSheets.map((sheet) => {
          const imageUrl = URL.createObjectURL(sheet.imageBlob);
          
          return (
            <div 
              key={sheet.id} 
              onClick={() => setViewingSheet(imageUrl)}
              className="bg-darkCard border border-slate-800 rounded-2xl p-3 flex items-center gap-4 active:bg-slate-800 transition-colors cursor-pointer group relative"
            >
              <div className="w-16 h-20 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-700 relative">
                <img src={imageUrl} alt={sheet.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 min-w-0 pr-8">
                <h3 className="text-white font-bold text-base truncate mb-1.5">{sheet.title}</h3>
                
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 truncate max-w-full">
                    <User size={10} className="shrink-0" />
                    <span className="truncate">{sheet.artist}</span>
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-neonBlue/10 text-neonBlue text-[10px] font-bold border border-neonBlue/20 shrink-0">
                    Key: {sheet.songKey}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button 
                  onClick={(e) => handleEdit(e, sheet)}
                  className="p-2 rounded-lg text-slate-500 hover:text-neonBlue hover:bg-neonBlue/10 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, sheet.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredSheets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">
              {activeFilterCount > 0 ? 'No sheets match your filters.' : 'No sheet music found.'}
            </p>
            {activeFilterCount === 0 && <p className="text-xs mt-1">Tap + to add your first score.</p>}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
          <div className="bg-darkBg border border-slate-700 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl mt-4 mb-20">
            
            <div className="flex justify-between items-center p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-lg font-bold text-white">{editingId ? 'Edit Sheet' : 'Add New Sheet'}</h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
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

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Song Title</label>
                <input 
                  type="text" value={newSheet.title} onChange={e => setNewSheet({...newSheet, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-[16px] focus:outline-none focus:border-neonBlue"
                  placeholder="e.g. ฤดูที่แตกต่าง"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Artist</label>
                  <input 
                    type="text" value={newSheet.artist} onChange={e => setNewSheet({...newSheet, artist: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-[16px] focus:outline-none focus:border-neonBlue"
                    placeholder="Artist Name"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Key</label>
                  <input 
                    type="text" value={newSheet.songKey} onChange={e => setNewSheet({...newSheet, songKey: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-[16px] focus:outline-none focus:border-neonBlue text-center uppercase"
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
                {isUploading ? 'SAVING...' : <><Check size={20} /> {editingId ? 'UPDATE SHEET' : 'SAVE SHEET'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

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