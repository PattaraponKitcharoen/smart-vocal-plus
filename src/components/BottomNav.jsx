import { Mic, Timer, FileText, User } from 'lucide-react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  // ลิสต์ของเมนูเพื่อให้ลูปสร้างปุ่มได้ง่ายๆ
  const navItems = [
    { id: 'vocal', label: 'Vocal', icon: Mic },
    { id: 'tempo', label: 'Tempo', icon: Timer },
    { id: 'sheet', label: 'Sheet', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-darkCard border-t border-slate-800 px-6 py-2 pb-6">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-16 ${
                isActive ? 'text-neonBlue' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {/* ขีดเรืองแสงด้านบนปุ่มที่ถูกเลือก */}
              <div 
                className={`h-1 w-8 rounded-full mb-1 transition-all duration-300 ${
                  isActive ? 'bg-neonBlue shadow-[0_0_8px_#22d3ee]' : 'bg-transparent'
                }`}
              ></div>
              
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;