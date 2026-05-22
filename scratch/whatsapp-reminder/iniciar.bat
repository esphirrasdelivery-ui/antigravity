@echo off
title Esphirra's — WhatsApp Reminder Server
cd /d "%~dp0"
echo Iniciando servidor WhatsApp...
echo Acesse o ERP para escanear o QR code:
echo https://esphirras-erp.pages.dev/whatsapp.html
echo.
node server.js
pause
