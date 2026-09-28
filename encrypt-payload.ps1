$ErrorActionPreference = "Stop"
$password = 'Hitss2026$SecuredPass'
$saltStr = 'HITSS_SECURE_SALT_2026_V1'
$salt = [System.Text.Encoding]::UTF8.GetBytes($saltStr)
$pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($password, $salt, 200000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$key = $pbkdf2.GetBytes(32)
$iv = [Convert]::FromBase64String('5rk37Llzj99IrvohN/ZPzw==')

$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $key
$aes.IV = $iv
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

$rawContent = [System.IO.File]::ReadAllText('C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\payload_clean.js', [System.Text.Encoding]::UTF8)
$rawBytes = [System.Text.Encoding]::UTF8.GetBytes($rawContent)
$encryptor = $aes.CreateEncryptor()
$cipherBytes = $encryptor.TransformFinalBlock($rawBytes, 0, $rawBytes.Length)
$cipherB64 = [Convert]::ToBase64String($cipherBytes)

# Save to encrypted_payload.txt
Set-Content -Path 'C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\encrypted_payload.txt' -Value $cipherB64 -Encoding UTF8 -NoNewline

# Replace ENCRYPTED_PAYLOAD_BASE64 in app.src.js
$srcContent = [System.IO.File]::ReadAllText('C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\app.src.js', [System.Text.Encoding]::UTF8)
$pattern = 'const ENCRYPTED_PAYLOAD_BASE64 = "[^"]+";'
$replacement = 'const ENCRYPTED_PAYLOAD_BASE64 = "' + $cipherB64 + '";'
$newSrcContent = [regex]::Replace($srcContent, $pattern, $replacement)
[System.IO.File]::WriteAllText('C:\Users\alexa\.gemini\antigravity\scratch\hitss-tickets\app.src.js', $newSrcContent, [System.Text.Encoding]::UTF8)

Write-Host "✅ Payload encrypted and updated in app.src.js successfully!"
