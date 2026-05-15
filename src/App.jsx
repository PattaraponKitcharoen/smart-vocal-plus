import { useState } from 'react';
import BottomNav from './components/BottomNav';
import VocalPage from './pages/VocalPage';
import TempoPage from './pages/TempoPage';
import SheetPage from './pages/SheetPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  // สร้าง State สำหรับจำว่าตอนนี้อยู่หน้าไหน (ค่าเริ่มต้นคือหน้า vocal)
  const [activeTab, setActiveTab] = useState('vocal');

  // ฟังก์ชันสลับหน้าจอ
  const renderPage = () => {
    switch (activeTab) {
      case 'vocal': return <VocalPage />;
      case 'tempo': return <TempoPage />;
      case 'sheet': return <SheetPage />;
      case 'profile': return <ProfilePage />;
      default: return <VocalPage />;
    }
  };

  return (
    <div className="h-screen w-full bg-darkBg text-white overflow-hidden flex flex-col font-sans">
      
      {/* พื้นที่แสดงเนื้อหาหลักตรงกลางจอ (เผื่อพื้นที่ด้านล่างไว้ 24px กันเมนูบัง) */}
      <div className="flex-1 overflow-y-auto pb-24">
        {renderPage()}
      </div>

      {/* แถบเมนูด้านล่าง */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
    </div>
  );
}

export default App;