import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ดึงค่า Range เดิมจาก LocalStorage (ถ้ามี)
  const [lowestNoteNum, setLowestNoteNum] = useState(() => {
    const saved = localStorage.getItem('lowestNote');
    return saved ? parseInt(saved) : null;
  });
  const [highestNoteNum, setHighestNoteNum] = useState(() => {
    const saved = localStorage.getItem('highestNote');
    return saved ? parseInt(saved) : null;
  });

  // ข้อมูลจำลองสำหรับชีทเพลง (เดี๋ยวเราค่อยอัปเดตตอนทำ IndexedDB)
  const [sheetCount, setSheetCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState("0 MB");

  // เซฟลง LocalStorage อัตโนมัติเวลาค่าเปลี่ยน
  useEffect(() => {
    if (lowestNoteNum !== null) localStorage.setItem('lowestNote', lowestNoteNum);
    if (highestNoteNum !== null) localStorage.setItem('highestNote', highestNoteNum);
  }, [lowestNoteNum, highestNoteNum]);

  // ฟังก์ชันอัปเดต Range
  const updateVocalRange = (noteNum) => {
    setLowestNoteNum(prev => (prev === null || noteNum < prev) ? noteNum : prev);
    setHighestNoteNum(prev => (prev === null || noteNum > prev) ? noteNum : prev);
  };

  // รีเซ็ตเฉพาะ Range
  const resetVocalRange = () => {
    setLowestNoteNum(null);
    setHighestNoteNum(null);
    localStorage.removeItem('lowestNote');
    localStorage.removeItem('highestNote');
  };

  // ล้างข้อมูลทั้งหมด (Clear All Data)
  const clearAllData = () => {
    resetVocalRange();
    // อนาคตเราจะเพิ่มลบฐานข้อมูล Dexie.js ตรงนี้ด้วย
    alert("ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว");
  };

  return (
    <AppContext.Provider value={{
      lowestNoteNum, highestNoteNum, updateVocalRange, resetVocalRange,
      sheetCount, storageUsed, clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};