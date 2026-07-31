﻿﻿﻿# Odyssey 快速启动脚本
$ErrorActionPreference = "SilentlyContinue"
$ROOT = $PSScriptRoot
$BACKEND = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Odyssey 一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 PostgreSQL
Write-Host "[1/4] 检查 PostgreSQL..." -ForegroundColor Yellow
$pg = Get-Service -Name "postgresql-x64-17" -ErrorAction SilentlyContinue
if ($pg.Status -eq "Running") {
    Write-Host "  [OK] PostgreSQL 已运行" -ForegroundColor Green
} else {
    Write-Host "  正在启动 PostgreSQL..." -ForegroundColor Gray
    Start-Service "postgresql-x64-17" -ErrorAction SilentlyContinue
    Start-Sleep 2
    Write-Host "  [OK] PostgreSQL 已启动" -ForegroundColor Green
}

# 2. 清理旧进程
Write-Host "[2/4] 清理旧进程..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Write-Host "  [OK] 进程已清理" -ForegroundColor Green

# 3. 启动后端
Write-Host "[3/4] 启动后端..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$BACKEND'; alembic upgrade head; uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
Write-Host "  [OK] 后端: http://localhost:8000" -ForegroundColor Green

# 4. 启动前端
Write-Host "[4/4] 启动前端..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", "cd '$FRONTEND'; npm run dev")
Write-Host "  [OK] 前端: http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全部启动完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  关闭服务: 关闭弹出的两个窗口"
Write-Host ""
Write-Host "等待服务就绪..." -ForegroundColor Gray
Start-Sleep 18
Start-Process "http://localhost:3000"
Write-Host "  [OK] 浏览器已打开" -ForegroundColor Green
Start-Sleep 3

