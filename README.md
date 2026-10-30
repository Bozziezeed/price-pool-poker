# PEACE CLUB POKER

คำนวณเงินรางวัลโป๊กเกอร์สำหรับเกมในบ้าน — Next.js, ไม่มีฐานข้อมูล

- **ทัวร์นาเมนต์ / Bounty** — รวมบายอิน รีบาย แอดออน หักค่าดำเนินการ (฿) แบ่งรางวัลตาม % ต่ออันดับ
  บันทึกการตกรอบเพื่อจัดอันดับ, Bounty: คนน็อคได้ค่าหัวเต็ม, ค่าหัวของผู้ชนะคืนให้ผู้ชนะ
- **แคชเกม** — บายอินหลายครั้ง (จำนวนต่างกันได้), แคชเอาท์, ได้/เสีย, ใครโอนให้ใคร
- **แชร์** — คัดลอกข้อความไป LINE หรือส่งลิงก์ (ข้อมูลอยู่ในลิงก์เอง)

เกมปัจจุบันเก็บใน localStorage ของเบราว์เซอร์ (รีเฟรชแล้วไม่หาย)

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit tests for the money math (src/lib)
npm run build
```

## Deploy (Vercel)

Push to GitHub → import the repo at vercel.com/new → Deploy. No env vars needed.

## Rules

- Prize pool = total paid − bounty pool − operation cost
- Prizes round down to the chosen unit; the leftover goes to 1st place so the total is exact
- Cash game operation cost comes out of the pot: total cash-out must equal total buy-ins − cost
