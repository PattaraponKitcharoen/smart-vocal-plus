import { createContext, useState, useEffect } from 'react';
import { db } from '../utils/db'; // ดึงฐานข้อมูลมาใช้คำนวณ

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lowestNoteNum, setLowestNoteNum] = useState(() => {
    const saved = localStorage.getItem('lowestNote');
    return saved ? parseInt(saved) : null;
  });
  const [highestNoteNum, setHighestNoteNum] = useState(() => {
    const saved = localStorage.getItem('highestNote');
    return saved ? parseInt(saved) : null;
  });

  const [sheetCount, setSheetCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState("0.0 MB");

  // อัปเดตสถิติพื้นที่จัดเก็บทุกครั้งที่มีการเปิดแอป
  useEffect(() => {
    calculateStorage();
    
    // ตั้ง Event Listener ให้ Dexie อัปเดตข้อมูลเมื่อมีการเพิ่ม/ลบ
    const subscription = db.sheets.hook('creating', () => {
      setTimeout(calculateStorage, 500); // ดีเลย์นิดนึงรอให้เซฟเสร็จ
    });
    
    return () => subscription.unsubscribe?.();
  }, []);

  const calculateStorage = async () => {
    try {
      const sheets = await db.sheets.toArray();
      setSheetCount(sheets.length);
      
      // เอาขนาดของ Blob ทุกไฟล์มารวมกัน
      let totalBytes = 0;
      sheets.forEach(sheet => {
        if (sheet.imageBlob) totalBytes += sheet.imageBlob.size;
      });
      
      const mb = (totalBytes / (1024 * 1024)).toFixed(1);
      setStorageUsed(`${mb} MB`);
    } catch (error) {
      console.error("Failed to calculate storage", error);
    }
  };

  useEffect(() => {
    if (lowestNoteNum !== null) localStorage.setItem('lowestNote', lowestNoteNum);
    if (highestNoteNum !== null) localStorage.setItem('highestNote', highestNoteNum);
  }, [lowestNoteNum, highestNoteNum]);

  const updateVocalRange = (noteNum) => {
    setLowestNoteNum(prev => (prev === null || noteNum < prev) ? noteNum : prev);
    setHighestNoteNum(prev => (prev === null || noteNum > prev) ? noteNum : prev);
  };

  const resetVocalRange = () => {
    setLowestNoteNum(null);
    setHighestNoteNum(null);
    localStorage.removeItem('lowestNote');
    localStorage.removeItem('highestNote');
  };

  const clearAllData = async () => {
    resetVocalRange();
    await db.sheets.clear(); // ลบชีตเพลงทั้งหมด
    calculateStorage();
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