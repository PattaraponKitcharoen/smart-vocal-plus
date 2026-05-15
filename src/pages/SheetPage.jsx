import { useState } from 'react';
import { Search, Plus, FileText, Music } from 'lucide-react';

const SheetPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // ข้อมูลจำลอง (เดี๋ยวเราจะเปลี่ยนเป็นระบบอัปโหลดจริงในสเต็ปถัดไป)
  const [sheets, setSheets] = useState([
    { id: 1, title: 'ฤดูที่แตกต่าง', artist: 'บอย โกสิยพงษ์', key: 'G', category: 'The Voice 2026' },
    { id: 2, title: 'Live and Learn', artist: 'กมลา สุโกศล', key: 'D', category: 'Pop' },
  ]);

  const filteredSheets = sheets.filter(sheet => 
    sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sheet.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-darkBg pb-20">
      {/* Header & Search */}
      <div className="p-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Sheet Music</h1>
          <button className="p-2 bg-neonGreen/20 text-neonGreen rounded-lg border border-neonGreen/40 active:scale-95 transition-transform">
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Search songs, artists..."
            className="w-full bg-darkCard border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-neonBlue transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto px-6 mb-6 no-scrollbar">
        {['All', 'The Voice 2026', 'Pop', 'Jazz', 'Rock'].map((cat) => (
          <button key={cat} className="whitespace-nowrap px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 text-sm font-medium hover:bg-slate-700 active:bg-neonBlue active:text-darkBg transition-colors">
            {cat}
          </button>
        ))}
      </div>

      {/* Sheet List */}
      <div className="flex-1 px-6 overflow-y-auto space-y-4">
        {filteredSheets.map((sheet) => (
          <div key={sheet.id} className="bg-darkCard border border-slate-800 rounded-2xl p-4 flex items-center gap-4 active:bg-slate-800 transition-colors cursor-pointer group">
            {/* Thumbnail Placeholder */}
            <div className="w-16 h-20 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-neonBlue transition-colors">
              <Music size={32} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{sheet.title}</h3>
              <p className="text-slate-400 text-sm">{sheet.artist}</p>
              <div className="inline-block mt-2 px-2 py-0.5 rounded bg-neonBlue/10 text-neonBlue text-[10px] font-bold border border-neonBlue/20">
                Key: {sheet.key}
              </div>
            </div>
            
            <FileText className="text-slate-600" size={20} />
          </div>
        ))}

        {filteredSheets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>No sheet music found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SheetPage;