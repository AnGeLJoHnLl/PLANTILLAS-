/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HITSS Tickets â€” Production Build (Obfuscated & Encrypted)
   Protected with SHA-256 Auth & Hex Obfuscation
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
(function(){
var _0x5a1b = [
/* ──────────────────────────────────────────────
   HITSS Tickets — Secure Web Crypto API Engine v8
   Cifrado Nativo AES-256-GCM / PBKDF2 (200,000 Iteraciones)
   Soporte de Sesión Persistente para F5 Cifrado (Anti-Bypass F12)
   ────────────────────────────────────────────── */

const IV_BASE64 = _0x5a1b[0];
const SALT_STR  = _0x5a1b[1];
const RESTORE_SALT_STR = _0x5a1b[2];
const ENCRYPTED_PAYLOAD_BASE64 = _0x5a1b[3];

let isAppUnlocked = false;
let inactivityTimer = null;
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos

async function deriveKeyFromPassword(password, saltStr = SALT_STR) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    _0x5a1b[27],
    enc.encode(password),
    { name: _0x5a1b[28] },
    false,
    [_0x5a1b[29]]
  );
  return await crypto.subtle.deriveKey(
    {
      name: _0x5a1b[30],
      salt: enc.encode(saltStr),
      iterations: 200000,
      hash: _0x5a1b[31]
    },
    passwordKey,
    { name: _0x5a1b[32], length: 256 },
    false,
    [_0x5a1b[33]]
  );
}

async function deriveSessionDeviceKey() {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    _0x5a1b[34],
    enc.encode(_0x5a1b[35]),
    { name: _0x5a1b[36] },
    false,
    [_0x5a1b[37]]
  );
  return await crypto.subtle.deriveKey(
    {
      name: _0x5a1b[38],
      salt: enc.encode(RESTORE_SALT_STR),
      iterations: 10000,
      hash: _0x5a1b[39]
    },
    passwordKey,
    { name: _0x5a1b[40], length: 256 },
    false,
    [_0x5a1b[41], _0x5a1b[42]]
  );
}

async function saveSessionPassword(password) {
  try {
    const key = await deriveSessionDeviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const cipherBuf = await crypto.subtle.encrypt(
      { name: _0x5a1b[43], iv: iv },
      key,
      enc.encode(password)
    );
    const blob = {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(cipherBuf))),
      time: Date.now()
    };
    sessionStorage.setItem(_0x5a1b[44], JSON.stringify(blob));
  } catch (e) {}
}

async function tryAutoRestoreSession() {
  try {
    const raw = sessionStorage.getItem(_0x5a1b[45]);
    if (!raw) return false;

    const blob = JSON.parse(raw);
    if (!blob || !blob.iv || !blob.data || !blob.time) return false;

    if (Date.now() - blob.time > INACTIVITY_LIMIT_MS) {
      sessionStorage.removeItem(_0x5a1b[46]);
      return false;
    }

    const key = await deriveSessionDeviceKey();
    const ivBuf = Uint8Array.from(atob(blob.iv), c => c.charCodeAt(0));
    const cipherBuf = Uint8Array.from(atob(blob.data), c => c.charCodeAt(0));

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: _0x5a1b[47], iv: ivBuf },
      key,
      cipherBuf
    );

    const dec = new TextDecoder(_0x5a1b[48]);
    const restoredPass = dec.decode(decryptedBuf);

    if (restoredPass) {
      const ok = await unlockWithPassword(restoredPass, true);
      return ok;
    }
  } catch (e) {
    sessionStorage.removeItem(_0x5a1b[49]);
  }
  return false;
}

async function unlockWithPassword(pass, isRestore = false) {
  try {
    const trimmed = (pass || '').trim();
    let decryptionPass = trimmed;
    // Compatibilidad multi-clave: clave maestra y PINs autorizados
    if (trimmed === _0x5a1b[50] || trimmed.toLowerCase() === _0x5a1b[51] || trimmed === _0x5a1b[52] || trimmed === _0x5a1b[53]) {
      decryptionPass = _0x5a1b[54];
    }

    const key = await deriveKeyFromPassword(decryptionPass);
    const ivBuf = Uint8Array.from(atob(IV_BASE64), c => c.charCodeAt(0));
    const cipherBuf = Uint8Array.from(atob(ENCRYPTED_PAYLOAD_BASE64), c => c.charCodeAt(0));

    const decryptedBuf = await crypto.subtle.decrypt(
      { name: _0x5a1b[55], iv: ivBuf },
      key,
      cipherBuf
    );

    const dec = new TextDecoder(_0x5a1b[56]);
    const decryptedCode = dec.decode(decryptedBuf);

    const scriptEl = document.createElement(_0x5a1b[57]);
    scriptEl.text = decryptedCode;
    document.head.appendChild(scriptEl);

    isAppUnlocked = true;
    if (!isRestore) {
      await saveSessionPassword(decryptionPass);
    }
    if (isRestore) {
      hideAuthModal(true);
    }
    startInactivityTimer();
    return true;
  } catch (err) {
    if (!isRestore) {
      showAuthError(_0x5a1b[58]);
    }
    return false;
  }
}

async function intentarLogin() {
  const passInput = document.getElementById(_0x5a1b[59]);
  const btnSubmit = document.getElementById(_0x5a1b[60]);
  const authCard = document.getElementById(_0x5a1b[61]);
  const iconWrap = document.getElementById(_0x5a1b[62]);
  const loadingBar = document.getElementById(_0x5a1b[63]);
  const loadingProgress = document.getElementById(_0x5a1b[64]);
  const authSubtitle = document.getElementById(_0x5a1b[65]);
  const authTitle = document.getElementById(_0x5a1b[66]);

  if (!passInput) return;

  const pass = passInput.value.trim();
  if (!pass) {
    showAuthError(_0x5a1b[67]);
    passInput.focus();
    return;
  }

  hideAuthError();

  // Iniciar animación de verificación futurista
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = _0x5a1b[68];
  }
  if (authCard) {
    authCard.classList.remove(_0x5a1b[69], _0x5a1b[70]);
    authCard.classList.add(_0x5a1b[71]);
  }
  if (loadingBar) {
    loadingBar.classList.remove(_0x5a1b[72]);
  }
  if (loadingProgress) {
    loadingProgress.style.width = _0x5a1b[73];
    setTimeout(() => {
      if (authCard && authCard.classList.contains(_0x5a1b[74])) {
        loadingProgress.style.width = _0x5a1b[75];
      }
    }, 150);
  }
  if (authSubtitle) {
    authSubtitle.textContent = _0x5a1b[76];
    authSubtitle.classList.remove(_0x5a1b[77]);
  }

  // Pequeño delay de 280ms para una cadencia fluida y de alta tecnología
  await new Promise(r => setTimeout(r, 280));

  const success = await unlockWithPassword(pass, false);

  if (success) {
    if (loadingProgress) loadingProgress.style.width = _0x5a1b[78];
    if (authCard) {
      authCard.classList.remove(_0x5a1b[79]);
      authCard.classList.add(_0x5a1b[80]);
    }
    if (authTitle) {
      authTitle.textContent = _0x5a1b[81];
    }
    if (authSubtitle) {
      authSubtitle.textContent = _0x5a1b[82];
    }
    if (iconWrap) {
      iconWrap.innerHTML = `
        <svg width="28" height="28" viewBox=_0x5a1b[5] fill=_0x5a1b[6] stroke=_0x5a1b[7] stroke-width=_0x5a1b[8] stroke-linecap=_0x5a1b[9] stroke-linejoin=_0x5a1b[10] class=_0x5a1b[11]>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d=_0x5a1b[12]></path>
        </svg>
      `;
    }
    if (btnSubmit) {
      btnSubmit.className = _0x5a1b[83];
      btnSubmit.innerHTML = `
        <svg width="18" height="18" viewBox=_0x5a1b[13] fill=_0x5a1b[14] stroke=_0x5a1b[15] stroke-width=_0x5a1b[16] stroke-linecap=_0x5a1b[17] stroke-linejoin=_0x5a1b[18]>
          <polyline points=_0x5a1b[19]></polyline>
        </svg>
        <span>Acceso Autorizado</span>
      `;
    }

    passInput.value = '';

    // Pausa visual para que el usuario aprecie el desbloqueo
    await new Promise(r => setTimeout(r, 550));
    hideAuthModal();
  } else {
    if (loadingProgress) {
      loadingProgress.style.width = _0x5a1b[84];
    }
    if (authCard) {
      authCard.classList.remove(_0x5a1b[85]);
      authCard.classList.add(_0x5a1b[86]);
      setTimeout(() => authCard.classList.remove(_0x5a1b[87]), 600);
    }
    if (loadingBar) loadingBar.classList.add(_0x5a1b[88]);
    if (authSubtitle) authSubtitle.classList.add(_0x5a1b[89]);
    if (loadingProgress) loadingProgress.style.width = '0%';

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.className = _0x5a1b[90];
      btnSubmit.innerHTML = _0x5a1b[91];
    }
    passInput.select();
  }
}

function showAuthError(msg) {
  const fb = document.getElementById(_0x5a1b[92]);
  if (!fb) return;
  fb.textContent = msg;
  fb.classList.remove(_0x5a1b[93]);
}

function hideAuthError() {
  const fb = document.getElementById(_0x5a1b[94]);
  if (fb) fb.classList.add(_0x5a1b[95]);
}

function resetAuthModalUI() {
  const authCard = document.getElementById(_0x5a1b[96]);
  const iconWrap = document.getElementById(_0x5a1b[97]);
  const loadingBar = document.getElementById(_0x5a1b[98]);
  const loadingProgress = document.getElementById(_0x5a1b[99]);
  const authSubtitle = document.getElementById(_0x5a1b[100]);
  const authTitle = document.getElementById(_0x5a1b[101]);
  const btnSubmit = document.getElementById(_0x5a1b[102]);

  if (authCard) authCard.classList.remove(_0x5a1b[103], _0x5a1b[104], _0x5a1b[105]);
  if (loadingBar) loadingBar.classList.add(_0x5a1b[106]);
  if (loadingProgress) loadingProgress.style.width = '0%';
  if (authSubtitle) {
    authSubtitle.textContent = '';
    authSubtitle.classList.add(_0x5a1b[107]);
  }
  if (authTitle) authTitle.textContent = _0x5a1b[108];
  if (iconWrap) {
    iconWrap.innerHTML = `
      <svg width="26" height="26" viewBox=_0x5a1b[20] fill=_0x5a1b[21] stroke=_0x5a1b[22] stroke-width=_0x5a1b[23] stroke-linecap=_0x5a1b[24] stroke-linejoin=_0x5a1b[25]>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d=_0x5a1b[26]></path>
      </svg>
    `;
  }
  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.className = _0x5a1b[109];
    btnSubmit.innerHTML = _0x5a1b[110];
  }
}

function hideAuthModal(immediate = false) {
  const modal = document.getElementById(_0x5a1b[111]);
  if (!modal) return;
  if (immediate) {
    modal.classList.add(_0x5a1b[112]);
    modal.classList.remove(_0x5a1b[113]);
    resetAuthModalUI();
    return;
  }
  modal.classList.add(_0x5a1b[114]);
  setTimeout(() => {
    modal.classList.add(_0x5a1b[115]);
    modal.classList.remove(_0x5a1b[116]);
    resetAuthModalUI();
  }, 350);
}

function showAuthModal(noticeMsg) {
  resetAuthModalUI();
  const modal = document.getElementById(_0x5a1b[117]);
  if (modal) modal.classList.remove(_0x5a1b[118], _0x5a1b[119]);
  if (noticeMsg) showAuthError(noticeMsg);
  const passInp = document.getElementById(_0x5a1b[120]);
  if (passInp) { passInp.value = ''; passInp.focus(); }
}

function toggleAuthPassEye() {
  const inp = document.getElementById(_0x5a1b[121]);
  if (!inp) return;
  inp.type = (inp.type === _0x5a1b[122]) ? _0x5a1b[123] : _0x5a1b[124];
}

function startInactivityTimer() {
  resetInactivityTimer();
  [_0x5a1b[125], _0x5a1b[126], _0x5a1b[127], _0x5a1b[128], _0x5a1b[129]].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
}

function resetInactivityTimer() {
  if (!isAppUnlocked) return;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    isAppUnlocked = false;
    sessionStorage.removeItem(_0x5a1b[130]);
    showAuthModal(_0x5a1b[131]);
  }, INACTIVITY_LIMIT_MS);
}

async function initCryptoAuth() {
  const restored = await tryAutoRestoreSession();
  if (!restored) {
    showAuthModal();
  }
}

if (document.readyState === _0x5a1b[132]) {
  document.addEventListener(_0x5a1b[133], initCryptoAuth);
} else {
  initCryptoAuth();
}

// Exponer funciones globales para eventos inline de HTML
window.intentarLogin = intentarLogin;
window.toggleAuthPassEye = toggleAuthPassEye;
window.unlockWithPassword = unlockWithPassword;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;


})();
