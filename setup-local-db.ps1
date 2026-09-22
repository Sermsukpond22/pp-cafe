# สคริปต์เปิดใช้งานและสร้าง Database บนเครื่องอัตโนมัติ (Local Test)

Write-Host "☕ กำลังเริ่มเปิดระบบ Database บนเครื่องด้วย Docker..." -ForegroundColor Cyan

# 1. เปิด Container PostgreSQL และ Adminer
docker compose up -d

Write-Host "⏳ รอ PostgreSQL พร้อมทำงาน..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 2. สำรองไฟล์ Production เดิม (.env และ .env.local)
if (Test-Path ".env") {
    if (-not (Test-Path ".env.production.bak")) {
        Copy-Item ".env" ".env.production.bak"
        Write-Host "💾 สำรอง .env Production ไว้ที่ .env.production.bak" -ForegroundColor Gray
    }
}
if (Test-Path ".env.local") {
    if (-not (Test-Path ".env.local.production.bak")) {
        Copy-Item ".env.local" ".env.local.production.bak"
        Write-Host "💾 สำรอง .env.local Production ไว้ที่ .env.local.production.bak" -ForegroundColor Gray
    }
}

# 3. สลับมาใช้การตั้งค่า Local Docker
Copy-Item ".env.local.docker" ".env" -Force
Copy-Item ".env.local.docker" ".env.local" -Force
Write-Host "🔄 สลับการเชื่อมต่อมาใช้ Local Database (Port 5433) แล้ว" -ForegroundColor Green

# 4. สั่งสร้างโครงสร้างตารางด้วย Prisma
Write-Host "📦 กำลังสร้างโครงสร้างตาราง (Prisma db push)..." -ForegroundColor Cyan
npx prisma db push --skip-generate

# 5. ใส่ข้อมูลเริ่มต้น (Super Admin & เมนูกาแฟ)
Write-Host "🌱 กำลังใส่ข้อมูลเริ่มต้น (Seed Data)..." -ForegroundColor Cyan
npm run db:seed

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 ตั้งค่า Local Database บนเครื่องเรียบร้อยแล้ว!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "👉 เริ่มรันเว็บทดสอบ: npm run dev" -ForegroundColor White
Write-Host "👉 เข้าดูตาราง Database ผ่านเว็บ: http://localhost:8080" -ForegroundColor White
Write-Host "   - ระบบ: PostgreSQL" -ForegroundColor Gray
Write-Host "   - Server: postgres" -ForegroundColor Gray
Write-Host "   - Username: postgres" -ForegroundColor Gray
Write-Host "   - Password: postgrespassword" -ForegroundColor Gray
Write-Host "   - Database: pp_cafe_local" -ForegroundColor Gray
Write-Host ""
Write-Host "👉 เข้าสู่ระบบหน้าร้าน: http://localhost:3000/login" -ForegroundColor White
Write-Host "   - Super Admin: admin" -ForegroundColor Gray
Write-Host "   - Password: admin1234" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
