import { useState } from 'react';
import BottomNav from './components/BottomNav';
import VocalPage from './pages/VocalPage';
import TempoPage from './pages/TempoPage';
import SheetPage from './pages/SheetPage';
import ProfilePage from './pages/ProfilePage';
// 1. นำเข้า AppProvider
import { AppProvider } from './contexts/AppContext';

function App() {
  const [activeTab, setActiveTab] = useState('vocal');

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
    // 2. เอา AppProvider ครอบแอปทั้งหมดไว้แบบนี้
    <AppProvider>
      <div className="h-screen w-full bg-darkBg text-white overflow-hidden flex flex-col font-sans">
        <div className="flex-1 overflow-y-auto pb-24 relative">
          {renderPage()}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AppProvider>
  );
}

export default App;