# 🔧 แก้ไขปัญหา: ข้อมูลผลไม้ไม่แสดงบนหน้าเว็บ

## ✅ ขั้นตอนการตรวจสอบและแก้ไข

### 1. ตรวจสอบว่า Backend API ทำงานอยู่

```bash
# ตรวจสอบว่า backend container ทำงานอยู่
cd mr_smoothy_be
docker-compose ps

# ตรวจสอบ logs
docker-compose logs api --tail 50
```

### 2. ทดสอบ API Endpoint โดยตรง

```bash
# ทดสอบ API endpoint
curl http://localhost:8080/api/public/fruits

# ควรได้ response แบบนี้:
# {
#   "success": true,
#   "message": "OK",
#   "data": [
#     {
#       "id": 1,
#       "name": "กล้วย",
#       "description": "...",
#       "pricePerUnit": 25.00,
#       "imageUrl": "...",
#       "active": true
#     }
#   ]
# }
```

### 3. ตรวจสอบข้อมูลใน Database

```sql
-- เชื่อมต่อ MySQL
mysql -u smoothy -psmoothypass mr_smoothy

-- ตรวจสอบข้อมูลผลไม้
SELECT * FROM fruits;

-- ตรวจสอบว่ามีผลไม้ที่ active = true หรือไม่
SELECT * FROM fruits WHERE active = true;
SELECT * FROM fruits WHERE active = 1;

-- ถ้าไม่มีข้อมูล ให้เพิ่มข้อมูลทดสอบ
INSERT INTO fruits (name, price_per_unit, active) VALUES 
('กล้วย', 25.00, true),
('สตรอเบอรี่', 30.00, true),
('แอปเปิ้ล', 20.00, true);
```

### 4. ตรวจสอบ Frontend Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์ `mr-smoothy-fe`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_MINIO_URL=http://localhost:9000
```

**สำคัญ**: ต้อง restart Next.js dev server หลังจากสร้างไฟล์ `.env.local`

```bash
# หยุด server (Ctrl+C) แล้วรันใหม่
npm run dev
```

### 5. ตรวจสอบใน Browser

1. เปิด Browser DevTools (F12)
2. ไปที่แท็บ **Console** - ดู error messages
3. ไปที่แท็บ **Network** - ดู API requests
   - ตรวจสอบว่า request ไปที่ URL ถูกต้องหรือไม่
   - ตรวจสอบ response status code (ควรเป็น 200)
   - ดู response body ว่ามีข้อมูลหรือไม่

### 6. ปัญหาที่พบบ่อย

#### ปัญหา: "Connection refused" หรือ "Network error"
**สาเหตุ**: Backend ไม่ทำงานหรือ URL ผิด

**แก้ไข**:
- ตรวจสอบว่า backend container ทำงานอยู่: `docker-compose ps`
- ตรวจสอบว่า API URL ถูกต้องใน `.env.local`
- Restart backend: `docker-compose restart api`

#### ปัญหา: API ทำงานแต่ไม่มีข้อมูล
**สาเหตุ**: ข้อมูลใน database มี `active = false` หรือ `active = NULL`

**แก้ไข**:
```sql
-- ตรวจสอบข้อมูล
SELECT id, name, active FROM fruits;

-- อัพเดทให้ active = true
UPDATE fruits SET active = true WHERE active IS NULL OR active = false;
```

#### ปัญหา: CORS Error
**สาเหตุ**: CORS configuration ไม่ถูกต้อง

**แก้ไข**: Backend มี CORS filter อยู่แล้ว แต่ถ้ายังมีปัญหา:
- ตรวจสอบว่า frontend เรียก API จาก `http://localhost:3000`
- ตรวจสอบ backend logs ว่ามี CORS error หรือไม่

### 7. ใช้หน้า Debug

1. ไปที่หน้า `/fruits`
2. กดปุ่ม "แสดง Debug"
3. ดูข้อมูลที่แสดง:
   - API Base URL
   - Response type
   - Data length
   - Raw response

### 8. ทดสอบด้วย SQL Query

```sql
-- ดูข้อมูลทั้งหมด
SELECT * FROM fruits;

-- ดูเฉพาะผลไม้ที่ active
SELECT id, name, price_per_unit, active, image_url 
FROM fruits 
WHERE active = true 
ORDER BY id;

-- นับจำนวนผลไม้
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN active = true THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN active = false OR active IS NULL THEN 1 ELSE 0 END) as inactive_count
FROM fruits;
```

## 📝 Checklist

- [ ] Backend container ทำงานอยู่ (`docker-compose ps`)
- [ ] API endpoint ทำงาน (`curl http://localhost:8080/api/public/fruits`)
- [ ] มีข้อมูลผลไม้ใน database (`SELECT * FROM fruits`)
- [ ] ผลไม้มีค่า `active = true` (`SELECT * FROM fruits WHERE active = true`)
- [ ] Frontend `.env.local` ตั้งค่าถูกต้อง
- [ ] Next.js dev server restart แล้ว
- [ ] Browser console ไม่มี error
- [ ] Network tab แสดง API request สำเร็จ (status 200)

## 🆘 ถ้ายังแก้ไม่ได้

1. ดู logs ของ backend: `docker-compose logs api --tail 100`
2. ดู logs ของ frontend ใน browser console
3. ใช้หน้า Debug ที่ `/fruits` เพื่อดูข้อมูล response
4. ทดสอบ API โดยตรงด้วย curl หรือ Postman

