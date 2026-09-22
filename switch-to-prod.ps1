# สคริปต์สลับการเชื่อมต่อกลับไปที่ Production Database (Supabase)

$restored = $false

if (Test-Path ".env.production.bak") {
    Copy-Item ".env.production.bak" ".env" -Force
    $restored = $true
}

if (Test-Path ".env.local.production.bak") {
    Copy-Item ".env.local.production.bak" ".env.local" -Force
    $restored = $true
}

if ($restored) {
    Write-Host "✅ สลับการเชื่อมต่อกลับไปที่ Production Supabase Database เรียบร้อยแล้ว!" -ForegroundColor Green
    Write-Host "⚠️ ตอนนี้การทำงานจะต่อกับฐานข้อมูลจริง (Supabase) แล้วครับ" -ForegroundColor Yellow
} else {
    Write-Host "❌ ไม่พบไฟล์สำรอง .env.production.bak หรือ .env.local.production.bak" -ForegroundColor Red
}
