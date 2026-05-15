let audioContext;
let analyser;
let microphone;
let dataArray;

export const startAudio = async () => {
  try {
    // 1. สร้าง Audio Context (รองรับทั้ง Chrome และ Safari)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    // 2. ขออนุญาตใช้ไมโครโฟน
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false, // ปิดตัดเสียงสะท้อน เพื่อให้ได้เสียงร้องดิบๆ ธรรมชาติที่สุด
        autoGainControl: false,  // ปิดการปรับลดเสียงอัตโนมัติ
        noiseSuppression: false  // ปิดการตัดเสียงรบกวน (หรือเปิดถ้าห้องซ้อมเสียงดังมาก)
      } 
    });

    // 3. เอาสัญญาณไมค์มาต่อเข้ากับ Context
    microphone = audioContext.createMediaStreamSource(stream);
    
    // 4. สร้างตัววิเคราะห์เสียง (Analyser)
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // ขนาด Sample Rate ยิ่งเยอะกราฟยิ่งเนียน
    
    // 5. เสียบสายไมค์เข้าตัววิเคราะห์
    microphone.connect(analyser);

    // 6. เตรียม Array ว่างๆ ไว้รอรับข้อมูลคลื่นเสียง
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Float32Array(bufferLength);

    return true; // สำเร็จ!
  } catch (error) {
    console.error("Mic access denied:", error);
    return false; // โดนผู้ใช้ปฏิเสธการเข้าถึงไมค์
  }
};

export const stopAudio = () => {
  // เช็คก่อนว่ามี audioContext ไหม และสถานะต้องยังไม่ถูกปิด
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  
  if (microphone) {
    // สั่งปิดการทำงานของไมค์ที่ไฟขึ้นสีแดงบนเบราว์เซอร์
    microphone.mediaStream.getTracks().forEach(track => track.stop());
  }
};

// ฟังก์ชันสำหรับดูดข้อมูลคลื่นเสียง ณ เสี้ยววินาทีนั้นๆ ออกไปใช้วาดกราฟ
export const getAudioData = () => {
  if (!analyser) return null;
  analyser.getFloatTimeDomainData(dataArray);
  return dataArray;
};