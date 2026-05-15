import Dexie from 'dexie';

// 1. สร้างฐานข้อมูลชื่อ SmartVocalDB
export const db = new Dexie('SmartVocalDB');

// 2. กำหนดโครงสร้างตาราง (เก็บ id, ชื่อ, ศิลปิน, คีย์ เป็น Index เพื่อให้ค้นหาเร็ว)
// ส่วนไฟล์รูป (imageBlob) ไม่ต้องทำ Index เพื่อประหยัดเมมโมรี่ตอนค้นหา
db.version(2).stores({
  sheets: '++id, title, artist, songKey, category, dateAdded',
  userProfile: 'id, name, rank' // เพิ่มตารางเก็บโปรไฟล์
});

// 3. ฟังก์ชันรีดน้ำหนักรูปภาพ (ลดขนาดให้เหลือความกว้างไม่เกิน 1200px และแปลงเป็น WebP)
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // ความละเอียดพอดีกับหน้าจอมือถือ/แท็บเล็ต
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // แปลงเป็น WebP คุณภาพ 80% (โหลดเร็วสุดๆ)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/webp', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
  });
};