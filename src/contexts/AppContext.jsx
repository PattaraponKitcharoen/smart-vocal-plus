import { createContext, useState, useEffect } from 'react';
import { db } from '../utils/db';

export const AppContext = createContext();

// ฟังก์ชันผู้ช่วย: แปลง Blob เป็น Base64 String เพื่อบันทึกลง JSON
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ฟังก์ชันผู้ช่วย: แปลง Base64 String กลับมาเป็น Blob
const base64ToBlob = async (base64Uri) => {
  const res = await fetch(base64Uri);
  return await res.blob();
};

export const AppProvider = ({ children }) => {
  const [lowestNoteNum, setLowestNoteNum] = useState(null);
  const [highestNoteNum, setHighestNoteNum] = useState(null);
  const [sheetCount, setSheetCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState("0.0 MB");
  const [userProfile, setUserProfile] = useState({ name: "User", rank: "Singer", profilePic: null });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // โหลด Vocal Range จาก LocalStorage
    const savedLowest = localStorage.getItem('lowestNote');
    const savedHighest = localStorage.getItem('highestNote');
    setLowestNoteNum(savedLowest ? parseInt(savedLowest) : null);
    setHighestNoteNum(savedHighest ? parseInt(savedHighest) : null);

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
      
      const profile = await db.userProfile.get(1);
      if (profile && profile.profilePic) totalBytes += profile.profilePic.size;
      
      const mb = (totalBytes / (1024 * 1024)).toFixed(2);
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
    setLowestNoteNum(prev => {
      const val = (prev === null || noteNum < prev) ? noteNum : prev;
      localStorage.setItem('lowestNote', val);
      return val;
    });
    setHighestNoteNum(prev => {
      const val = (prev === null || noteNum > prev) ? noteNum : prev;
      localStorage.setItem('highestNote', val);
      return val;
    });
  };

  const resetVocalRange = () => {
    setLowestNoteNum(null);
    setHighestNoteNum(null);
    localStorage.removeItem('lowestNote');
    localStorage.removeItem('highestNote');
  };

  // 2. ฟังก์ชัน EXPORT: มัดรวมทุกอย่างส่งออกเป็นไฟล์ JSON
  const exportAllData = async () => {
    try {
      const sheets = await db.sheets.toArray();
      // แปลงรูปชีตเพลงทั้งหมดเป็นสติงข้อความ
      const serializedSheets = await Promise.all(sheets.map(async (s) => ({
        ...s,
        imageBlob: s.imageBlob ? await blobToBase64(s.imageBlob) : null
      })));

      const profile = await db.userProfile.get(1);
      const serializedProfile = profile ? {
        ...profile,
        profilePic: profile.profilePic ? await blobToBase64(profile.profilePic) : null
      } : null;

      const backupData = {
        vocalRange: {
          lowestNote: localStorage.getItem('lowestNote'),
          highestNote: localStorage.getItem('highestNote')
        },
        userProfile: serializedProfile,
        sheets: serializedSheets
      };

      // สร้างไฟล์ดาวน์โหลด
      const jsonString = JSON.stringify(backupData);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-vocal-plus-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      alert("ไม่สามารถสำรองข้อมูลได้ครับ");
    }
  };

  // 3. ฟังก์ชัน IMPORT: แกะกล่อง JSON กลับคืนค่าลงระบบ
  const importAllData = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      // ล้างข้อมูลเก่าออกก่อนป้องกันการชนกัน
      localStorage.clear();
      await db.sheets.clear();
      await db.userProfile.clear();

      // คืนค่า Vocal Range
      if (data.vocalRange?.lowestNote) localStorage.setItem('lowestNote', data.vocalRange.lowestNote);
      if (data.vocalRange?.highestNote) localStorage.setItem('highestNote', data.vocalRange.highestNote);

      // คืนค่า User Profile
      if (data.userProfile) {
        const profilePic = data.userProfile.profilePic ? await base64ToBlob(data.userProfile.profilePic) : null;
        await db.userProfile.put({ ...data.userProfile, profilePic });
      }

      // คืนค่า ชีตเพลงทั้งหมด
      if (data.sheets && data.sheets.length > 0) {
        for (const s of data.sheets) {
          const imageBlob = s.imageBlob ? await base64ToBlob(s.imageBlob) : null;
          await db.sheets.add({ ...s, imageBlob });
        }
      }

      // โหลดข้อมูลเข้าสู่หน้าจอใหม่ทันที
      await loadInitialData();
      alert("กู้คืนข้อมูลสำเร็จเรียบร้อยแล้วครับ!");
    } catch (error) {
      console.error("Import failed", error);
      alert("ไฟล์สำรองข้อมูลไม่ถูกต้องหรือไม่สมบูรณ์ครับ");
    }
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
      userProfile, updateProfile, exportAllData, importAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};