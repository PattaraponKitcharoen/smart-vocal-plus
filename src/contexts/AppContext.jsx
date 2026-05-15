import { createContext, useState, useEffect } from 'react';
import { db } from '../utils/db';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ข้อมูล Vocal Range
  const [lowestNoteNum, setLowestNoteNum] = useState(() => {
    const saved = localStorage.getItem('lowestNote');
    return saved ? parseInt(saved) : null;
  });
  const [highestNoteNum, setHighestNoteNum] = useState(() => {
    const saved = localStorage.getItem('highestNote');
    return saved ? parseInt(saved) : null;
  });

  // ข้อมูลโปรไฟล์ (Default เป็นข้อมูลของคุณ)
  const [userProfile, setUserProfile] = useState({
    name: "Phattharaphon K.",
    rank: "Advanced Singer",
    profilePic: null
  });

  const [sheetCount, setSheetCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState("0.0 MB");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // โหลดข้อมูลโปรไฟล์จาก DB
    const profile = await db.userProfile.get(1);
    if (profile) {
      setUserProfile(profile);
    }
    calculateStorage();
  };

  const calculateStorage = async () => {
    try {
      const sheets = await db.sheets.toArray();
      setSheetCount(sheets.length);
      let totalBytes = 0;
      sheets.forEach(sheet => { if (sheet.imageBlob) totalBytes += sheet.imageBlob.size; });
      // รวมขนาดรูปโปรไฟล์ด้วยถ้ามี
      if (userProfile.profilePic) totalBytes += userProfile.profilePic.size;
      
      const mb = (totalBytes / (1024 * 1024)).toFixed(1);
      setStorageUsed(`${mb} MB`);
    } catch (error) {}
  };

  const updateProfile = async (newData) => {
    const updated = { ...userProfile, ...newData, id: 1 };
    setUserProfile(updated);
    await db.userProfile.put(updated);
    calculateStorage();
  };

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
    localStorage.clear();
    await db.sheets.clear();
    await db.userProfile.clear();
    setLowestNoteNum(null);
    setHighestNoteNum(null);
    setUserProfile({ name: "User", rank: "Beginner", profilePic: null });
    calculateStorage();
    alert("ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว");
  };

  return (
    <AppContext.Provider value={{
      lowestNoteNum, highestNoteNum, updateVocalRange, resetVocalRange,
      sheetCount, storageUsed, clearAllData,
      userProfile, updateProfile // ส่งข้อมูลโปรไฟล์ออกไป
    }}>
      {children}
    </AppContext.Provider>
  );
};