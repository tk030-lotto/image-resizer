@echo off
chcp 932 >nul
cd /d "%~dp0"
title Image Resizer

echo ========================================================
echo   Image Resizer (画像リサイズツール)
echo ========================================================
echo.
echo ブラウザでツールを開いています...
start "" "%~dp0index.html"
echo.
echo ツールが起動しました。
echo 終了する場合は、このウィンドウを閉じるか、何かキーを押してください。
echo.
pause >nul
exit
