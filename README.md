# Microclimate Lab · CN466

บทเรียน AIoT ภาษาไทยสำหรับนักศึกษาที่เพิ่งเริ่มต้น ผู้เรียนจะอ่านค่าอุณหภูมิและความชื้นจากบอร์ด Cucumber RS แล้วใช้ k-Nearest Neighbors (k-NN) จำแนกสภาพห้องเป็น **สบาย**, **ร้อน** หรือ **อับชื้น** โดยโมเดลทำงานในเบราว์เซอร์ของพีซี

| ส่วน | เทคโนโลยี |
| --- | --- |
| IoT | Cucumber RS (ESP32-S2), เซนเซอร์ HTS221 บนบอร์ด, Arduino ผ่าน PlatformIO |
| การส่งข้อมูล | USB Serial 115200 baud ส่ง JSON หนึ่งบรรทัดทุก 2 วินาที |
| AI | k-NN, k = 3, ปรับสเกลสองตัวแปรและใช้ระยะ Euclidean |
| UI และบทเรียน | HTML, CSS, JavaScript ภายใน `docs/` เผยแพร่ผ่าน GitHub Pages |

```text
HTS221 → Cucumber RS → USB Serial → Web Serial บนพีซี → k-NN → Dashboard
ข้อมูลจำลอง → k-NN ตัวเดียวกัน → Dashboard
```

## ทดลองโดยยังไม่มีบอร์ด

เปิด `docs/index.html` ในเบราว์เซอร์ กด **เริ่มทดลอง** แล้วเปลี่ยนสถานการณ์เป็นห้องสบาย ห้องร้อน และห้องอับชื้นตามลำดับ เทียบผลจำแนกกับตัวอย่างใกล้ที่สุด 3 แถวในแผง **ทำไม AI ตอบแบบนี้** จากนั้นลองทำแบบทดสอบในส่วนบทเรียน

ตัวอย่างฝึกทั้ง 18 รายการเป็นข้อมูลสังเคราะห์ โมเดลใช้ค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐานจากชุดฝึกปรับสเกลแต่ละตัวแปร หากทั้งสามเพื่อนบ้านโหวตคนละป้าย ให้เลือกป้ายของเพื่อนบ้านที่ใกล้ที่สุด คะแนนโหวตอธิบายคำตอบเฉพาะรายการได้ ส่วนความแม่นยำต้องวัดด้วยชุดทดสอบอิสระที่ติดป้ายจากข้อมูลจริง

## ทดสอบกับบอร์ดจริง

1. เปิดโฟลเดอร์นี้ใน VS Code ที่ติดตั้งส่วนขยาย PlatformIO
2. เสียบ Cucumber RS ด้วยสาย USB ที่ส่งข้อมูลได้ผ่านช่อง **Debug**
3. เปิด **PlatformIO → Project Tasks → cucumber → Upload** หรือใช้ PlatformIO Terminal ตามคำสั่ง

   ```sh
   pio run -e cucumber -t upload
   pio device monitor -b 115200
   ```

4. ตรวจว่าค่าออกมาทุกประมาณ 2 วินาที เช่น `{"temperature":25.40,"humidity":51.20}` แล้วปิด Serial Monitor ให้พอร์ตว่าง
5. เปิด GitHub Pages ใน Chrome หรือ Edge บนพีซี กด **เชื่อมต่อบอร์ด** แล้วเลือก COM ของบอร์ด ถ้าทดสอบก่อนเผยแพร่ ให้เปิดเซิร์ฟเวอร์จากโฟลเดอร์นี้ด้วย `python -m http.server 8000 --bind 127.0.0.1 --directory docs` แล้วเปิด `http://localhost:8000/`
6. ตรวจว่าแถบสถานะขึ้น **รับข้อมูลจริงจาก Cucumber** เทียบค่าหน้าเว็บกับค่าที่เห็นจาก Monitor ก่อนปิด และลองย้ายบอร์ดไปตำแหน่งอื่นเพื่อดูการเปลี่ยนแปลง จากนั้นกด **ตัดการเชื่อมต่อ** และตรวจว่าหน้าเว็บกลับสู่ข้อมูลจำลอง

เฟิร์มแวร์นี้ใช้ขา I²C SDA 41 และ SCL 40 ตามเฟิร์มแวร์ Cucumber RS ของใบงานก่อนหน้า ถ้าเห็น `sensor_not_found` ให้ตรวจรุ่นบอร์ดก่อน ถ้าเปิด COM ไม่ได้ ให้ปิด Serial Monitor หรือโปรแกรมอื่นที่ครองพอร์ต ตรวจไดรเวอร์ และลองสาย USB สำหรับส่งข้อมูล

## เผยแพร่ด้วย GitHub Pages

### อัปโหลดผ่านหน้า GitHub

1. แตก ZIP แล้วเปิดโฟลเดอร์ชั้นในที่มี `docs/`, `firmware/`, `README.md`, `CLIP.md`, `platformio.ini` และ `.gitignore`
2. ที่หน้า repository ให้กด **uploading an existing file** ถ้า repository ยังว่าง หรือ **Add file → Upload files** ถ้ามีไฟล์แล้ว ลากไฟล์และโฟลเดอร์ในชั้นนั้นทั้งหมดเข้าไป โดยให้ `docs/` และ `firmware/` อยู่ระดับเดียวกับ `README.md`
3. Commit ไปที่ `main` แล้วตรวจว่าบน GitHub มี `docs/index.html`, `docs/.nojekyll`, `docs/assets/` และ `firmware/main.cpp`
4. ไปที่ **Settings → Pages** เลือก **Deploy from a branch → main → /docs → Save** เมื่อมี **Visit site** ให้เปิดลิงก์ในหน้าต่างไม่ระบุตัวตนเพื่อทดสอบ หากยังขึ้น 404 ให้ตรวจผล **pages build and deployment** ในแท็บ **Actions**

[วิธีอัปโหลดไฟล์ผ่าน GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

### อัปโหลดผ่าน Git

1. แตก ZIP แล้วเปิด PowerShell ในโฟลเดอร์ที่มี `README.md`, `docs/`, `firmware/` และ `platformio.ini`
2. สร้าง repository สาธารณะใหม่ชื่อ `microclimate-lab` บน GitHub ให้ repository ว่าง โดยเว้นการสร้าง README, .gitignore และ License ตอนสร้าง
3. เปลี่ยน `YOUR-USERNAME` เป็นชื่อบัญชี GitHub ของคุณ แล้วรันทีละบรรทัด ถ้า Git ถามชื่อและอีเมล ให้ตั้งค่าตามบัญชีของคุณแล้วรันคำสั่ง commit อีกครั้ง

   ```sh
   git init -b main
   git add README.md CLIP.md .gitignore platformio.ini firmware docs
   git commit -m "Publish CN466 Microclimate Lab"
   git remote add origin https://github.com/YOUR-USERNAME/microclimate-lab.git
   git push -u origin main
   ```

4. ใน Repository เปิด **Settings → Pages** เลือก **Deploy from a branch** แล้วตั้ง branch เป็น **main** และโฟลเดอร์เป็น **/docs** จากนั้นกด **Save**
5. รอให้ GitHub แสดง **Visit site** แล้วเปิดจากหน้าต่างไม่ระบุตัวตนเพื่อตรวจว่าอาจารย์เข้าถึงได้ ลิงก์จะมีรูปแบบ `https://YOUR-USERNAME.github.io/microclimate-lab/`

[คู่มือตั้งค่า publishing source ของ GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## เกณฑ์ตรวจงาน

- ข้อมูลจำลองทั้งสามสถานการณ์แสดงป้ายที่คาดไว้ พร้อมตัวอย่างเพื่อนบ้าน 3 จุด
- แบบทดสอบให้ผลย้อนกลับเมื่อเลือกคำตอบถูกและผิด
- กราฟและตารางเปลี่ยนตามตัวอย่าง และรีเซ็ตเมื่อสลับแหล่งข้อมูล
- เมื่อทดสอบฮาร์ดแวร์ ใช้สถานะบนเว็บและค่า JSON ยืนยันว่าข้อมูลมาจากบอร์ด
- ลิงก์ GitHub Pages เปิดได้จากหน้าต่างไม่ระบุตัวตน

## ไฟล์หลัก

- `docs/index.html` แดชบอร์ดและบทเรียน
- `docs/assets/model.js` ชุดฝึก โมเดล k-NN และตัวตรวจข้อมูล JSON
- `docs/assets/app.js` รับข้อมูล Serial สร้างข้อมูลจำลอง และอัปเดตหน้าเว็บ
- `firmware/main.cpp` เฟิร์มแวร์อ่าน HTS221
- `CLIP.md` บทพูดและภาพที่ใช้บันทึกคลิปส่งงาน

อ้างอิงโครงเวิร์กช็อปจากโปรเจกต์ Smart Lamp ของรายวิชา และใช้เอกสาร Web Serial สำหรับการเชื่อมบอร์ดผ่านเบราว์เซอร์ [AIoT for Beginners](https://github.com/vsupacha/aiot-for-beginners) · [Chrome for Developers](https://developer.chrome.com/docs/capabilities/serial/)
