# Script para empaquetar app.src.js -> app.js con cargador Base64 seguro
$ErrorActionPreference = "Stop"

$srcPath = "C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\app.src.js"
$dstPath = "C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\app.js"

$rawCode = [System.IO.File]::ReadAllText($srcPath, [System.Text.Encoding]::UTF8)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($rawCode)
$base64 = [Convert]::ToBase64String($bytes)

$wrappedCode = "(function(_0x5a1b,_0x3f2c){var _0x1d4e=function(_0x4b2a){return decodeURIComponent(atob(_0x4b2a).split('').map(function(c){return '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2);}).join(''));};var _0x9e8a=_0x1d4e(_0x3f2c);var _0x2c1f=document.createElement('script');_0x2c1f.text=_0x9e8a;document.head.appendChild(_0x2c1f);})(this,'$base64');"

[System.IO.File]::WriteAllText($dstPath, $wrappedCode, [System.Text.Encoding]::UTF8)
Write-Host "✅ app.js generado exitosamente con cargador seguro Base64!"
