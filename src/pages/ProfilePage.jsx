import { User, Award, Music, Mic2 } from 'lucide-react';

const ProfilePage = () => {
  // ข้อมูลจำลอง (ในอนาคตเราจะดึงมาจาก Global State หรือ Database)
  const stats = {
    name: "Phattharaphon K.",
    rank: "Advanced Singer",
    lowestNote: "E2",
    highestNote: "G4",
    vocalType: "Tenor",
    practiceHours: "12.5 hrs",
    accuracy: "88%"
  };

  // จำลองตำแหน่งของ Vocal Range (ในสเกลเปียโน)
  // E2 อยู่ค่อนไปทางซ้าย, G4 อยู่ค่อนไปทางขวา
  const rangeStart = 20; // % จากด้านซ้าย
  const rangeWidth = 45; // % ความกว้างของแถบ

  return (
    <div className="flex flex-col h-full bg-darkBg px-6 pt-8 pb-24 overflow-y-auto">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neonBlue to-neonGreen p-1 mb-4">
          <div className="w-full h-full rounded-full bg-darkBg flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">{stats.name}</h2>
        <p className="text-neonBlue font-medium flex items-center gap-2">
          <Award size={16} /> {stats.rank}
        </p>
      </div>

      {/* Vocal Range Chart - Highlight Feature */}
      <div className="bg-darkCard border border-slate-800 rounded-3xl p-6 mb-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">Vocal Range</h3>
          <span className="text-neonGreen font-black text-xl">{stats.lowestNote} — {stats.highestNote}</span>
        </div>
        
        {/* แถบกราฟเปรียบเทียบ */}
        <div className="relative h-12 bg-slate-900 rounded-xl overflow-hidden mb-2">
          {/* ขีดสเกลเปียโนจำลอง */}
          <div className="absolute inset-0 flex justify-between px-2 opacity-20">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white"></div>
            ))}
          </div>
          
          {/* แถบ Range ของเรา */}
          <div 
            className="absolute h-full bg-gradient-to-r from-neonBlue/50 to-neonGreen/50 border-x-2 border-neonGreen shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            style={{ left: `${rangeStart}%`, width: `${rangeWidth}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
          <span>C1 (Sub Bass)</span>
          <span>C4 (Middle)</span>
          <span>C8 (High)</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-4">
          <Music className="text-neonBlue mb-2" size={20} />
          <p className="text-slate-500 text-xs font-bold uppercase">Voice Type</p>
          <p className="text-xl font-bold text-white">{stats.vocalType}</p>
        </div>
        
        <div className="bg-darkCard border border-slate-800 rounded-2xl p-4">
          <Mic2 className="text-neonGreen mb-2" size={20} />
          <p className="text-slate-500 text-xs font-bold uppercase">Avg Accuracy</p>
          <p className="text-xl font-bold text-white">{stats.accuracy}</p>
        </div>

        <div className="bg-darkCard border border-slate-800 rounded-2xl p-4 col-span-2 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Total Practice Time</p>
            <p className="text-2xl font-bold text-white">{stats.practiceHours}</p>
          </div>
          <div className="h-12 w-12 rounded-full border-2 border-slate-700 flex items-center justify-center text-neonBlue font-bold">
            8/10
          </div>
        </div>
      </div>

      {/* Settings Button */}
      <button className="mt-8 w-full py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors">
        Account Settings
      </button>

    </div>
  );
};

export default ProfilePage;