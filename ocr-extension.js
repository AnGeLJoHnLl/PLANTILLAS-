/* ──────────────────────────────────────────────
   HITSS Tickets — Módulo OCR de Alta Velocidad
   Motor Local Tesseract.js (WASM) + Fallback Nube OCR.Space
   ────────────────────────────────────────────── */

let cropperSimple = null;
let tesseractWorkerPromise = null;

// Obtener o inicializar trabajador único de Tesseract en memoria (Singleton pre-calentado)
async function getTesseractWorker() {
    if (!tesseractWorkerPromise) {
        tesseractWorkerPromise = (async () => {
            if (typeof Tesseract === 'undefined') {
                throw new Error('La librería Tesseract.js no está disponible en la página.');
            }
            const worker = await Tesseract.createWorker();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            return worker;
        })();
    }
    return tesseractWorkerPromise;
}

// Pool de Claves API gratuitas de OCR.Space (rotación automática masiva)
const API_KEYS_POOL = [
    'K81133870688957',
    'K87948218888957',
    'helloworld'
];

let currentApiKeyIndex = 0;

function getActiveApiKey() {
    const customKey = localStorage.getItem('hitss_custom_ocr_key');
    if (customKey && customKey.trim().length > 5) {
        return customKey.trim();
    }
    return API_KEYS_POOL[currentApiKeyIndex % API_KEYS_POOL.length];
}

function rotateApiKey() {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS_POOL.length;
}

document.addEventListener('DOMContentLoaded', () => {
    initOCRSimpleListeners();
});

function initOCRSimpleListeners() {
    const fileInput = document.getElementById('fileInputOCR');
    if (fileInput) fileInput.addEventListener('change', handleFileSelectOCR);

    // Recalcular dimensiones de Cropper cuando cambia el zoom del navegador
    window.addEventListener('resize', () => {
        if (cropperSimple) {
            cropperSimple.resize();
        }
    });

    // Pegado global Ctrl + V
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const blob = item.getAsFile();
                loadImageBlobOCR(blob);
                if (typeof showToast === 'function') showToast('¡Imagen cargada!');
                break;
            }
        }
    });

    const btnReset = document.getElementById('btnResetCropOCR');
    if (btnReset) btnReset.addEventListener('click', () => cropperSimple && cropperSimple.reset());

    const btnMove = document.getElementById('btnMoveModeOCR');
    if (btnMove) btnMove.addEventListener('click', setMoveModeOCR);

    const btnCrop = document.getElementById('btnCropModeOCR');
    if (btnCrop) btnCrop.addEventListener('click', setCropModeOCR);

    const btnZoomIn = document.getElementById('btnZoomInOCR');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => cropperSimple && cropperSimple.zoom(0.15));

    const btnZoomOut = document.getElementById('btnZoomOutOCR');
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => cropperSimple && cropperSimple.zoom(-0.15));

    const btnScan = document.getElementById('btnExtractTextOCR');
    if (btnScan) btnScan.addEventListener('click', processOCRSimple);
}

function setMoveModeOCR() {
    if (cropperSimple) cropperSimple.setDragMode('move');
}

function setCropModeOCR() {
    if (cropperSimple) cropperSimple.setDragMode('crop');
}

function handleFileSelectOCR(e) {
    if (e.target.files && e.target.files[0]) {
        loadImageBlobOCR(e.target.files[0]);
    }
}

function loadImageBlobOCR(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        initCropperOCR(e.target.result);
        // Pre-calentar el motor OCR local en segundo plano para respuesta instantánea
        getTesseractWorker().catch(err => console.warn('Pre-calentando motor OCR:', err));
    };
    reader.readAsDataURL(file);
}

function initCropperOCR(imageSrc) {
    const dropzone = document.getElementById('dropzoneOCR');
    const wrapper = document.getElementById('cropperWrapperOCR');
    const toolbar = document.getElementById('cropperToolbarOCR');
    const img = document.getElementById('imageToCropOCR');

    if (dropzone) dropzone.classList.add('hidden');
    if (wrapper) wrapper.classList.remove('hidden');
    if (toolbar) toolbar.classList.remove('hidden');

    if (cropperSimple) {
        cropperSimple.destroy();
        cropperSimple = null;
    }

    img.src = imageSrc;
    cropperSimple = new Cropper(img, {
        viewMode: 0, // Permite mover la imagen libremente
        dragMode: 'crop', // Clic izquierdo subraya por defecto
        autoCropArea: 0.95,
        responsive: true,
        background: false,
        zoomOnWheel: true,
        toggleDragModeOnDblclick: false,
        ready() {
            const btnScan = document.getElementById('btnExtractTextOCR');
            if (btnScan) btnScan.disabled = false;

            // Configurar desplazamiento fluido con Clic Derecho
            const container = wrapper.querySelector('.cropper-container');
            if (container && !container.dataset.mouseBound) {
                container.dataset.mouseBound = "true";

                let isRightDrag = false;
                let startX = 0;
                let startY = 0;

                container.addEventListener('contextmenu', (e) => e.preventDefault());

                container.addEventListener('mousedown', (e) => {
                    if (!cropperSimple) return;
                    if (e.button === 2) { // Clic Derecho
                        e.preventDefault();
                        e.stopPropagation();
                        isRightDrag = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        container.style.cursor = 'grabbing';
                    }
                });

                window.addEventListener('mousemove', (e) => {
                    if (isRightDrag && cropperSimple) {
                        e.preventDefault();
                        const dx = e.clientX - startX;
                        const dy = e.clientY - startY;
                        startX = e.clientX;
                        startY = e.clientY;
                        cropperSimple.move(dx, dy);
                    }
                });

                window.addEventListener('mouseup', (e) => {
                    if (isRightDrag) {
                        isRightDrag = false;
                        if (container) container.style.cursor = 'default';
                    }
                });
            }
        }
    });
}

function clearOCRImage() {
    if (cropperSimple) {
        cropperSimple.destroy();
        cropperSimple = null;
    }
    const dropzone = document.getElementById('dropzoneOCR');
    const wrapper = document.getElementById('cropperWrapperOCR');
    const toolbar = document.getElementById('cropperToolbarOCR');
    const img = document.getElementById('imageToCropOCR');
    const output = document.getElementById('ocrOutputSimple');
    const fileInput = document.getElementById('fileInputOCR');

    if (img) img.src = '';
    if (output) output.value = '';
    if (fileInput) fileInput.value = '';

    if (wrapper) wrapper.classList.add('hidden');
    if (toolbar) toolbar.classList.add('hidden');
    if (dropzone) dropzone.classList.remove('hidden');

    if (typeof showToast === 'function') showToast('Imagen eliminada');
}

// Mejora automática del canvas para textos pequeños y números de serie/MAC
function enhanceCanvasForOCR(sourceCanvas) {
    const minWidth = 450;
    let canvas = sourceCanvas;
    if (sourceCanvas.width < minWidth) {
        const scale = Math.max(2, minWidth / sourceCanvas.width);
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.round(sourceCanvas.width * scale);
        scaledCanvas.height = Math.round(sourceCanvas.height * scale);
        const ctx = scaledCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        canvas = scaledCanvas;
    }
    return canvas;
}

async function processCloudOCRSimple(croppedCanvas) {
    const maxDim = 1200;
    let finalCanvas = croppedCanvas;
    if (croppedCanvas.width > maxDim || croppedCanvas.height > maxDim) {
        const scale = maxDim / Math.max(croppedCanvas.width, croppedCanvas.height);
        const resized = document.createElement('canvas');
        resized.width = Math.round(croppedCanvas.width * scale);
        resized.height = Math.round(croppedCanvas.height * scale);
        const ctx = resized.getContext('2d');
        ctx.drawImage(croppedCanvas, 0, 0, resized.width, resized.height);
        finalCanvas = resized;
    }

    const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.85);
    const apiKey = getActiveApiKey();

    const formData = new FormData();
    formData.append('base64Image', dataUrl);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('apikey', apiKey);

    // Timeout rápido de 3.5 segundos con AbortController para evitar congelamientos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();

        if (json.IsErroredOnProcessing) {
            const errMsg = (json.ErrorMessage && json.ErrorMessage.length > 0) ? json.ErrorMessage[0] : '';
            throw new Error(errMsg || 'Error en procesamiento OCR');
        }

        return (json.ParsedResults && json.ParsedResults.length > 0) ? json.ParsedResults[0].ParsedText : '';
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
}

async function processOCRSimple() {
    if (!cropperSimple) return;
    
    let croppedCanvas = cropperSimple.getCroppedCanvas();
    if (!croppedCanvas) {
        cropperSimple.crop();
        croppedCanvas = cropperSimple.getCroppedCanvas();
    }
    
    if (!croppedCanvas) {
        alert('No se pudo obtener el recuadro de la imagen.');
        return;
    }

    const btnScan = document.getElementById('btnExtractTextOCR');
    const output = document.getElementById('ocrOutputSimple');

    if (btnScan) {
        btnScan.disabled = true;
        btnScan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Escaneando...';
    }

    try {
        let rawText = '';
        const enhancedCanvas = enhanceCanvasForOCR(croppedCanvas);

        // Si el usuario tiene una clave personalizada propia, intentar nube primero con timeout estricto de 3.5s
        const customKey = localStorage.getItem('hitss_custom_ocr_key');
        if (customKey && customKey.trim().length > 5) {
            try {
                rawText = await processCloudOCRSimple(enhancedCanvas);
            } catch (cloudErr) {
                console.warn('OCR en la nube no disponible, cambiando a motor local Tesseract:', cloudErr.message);
            }
        }

        // Si no hay clave personalizada o la nube falló/demoró, usar el motor local Tesseract (100% fiable, sin límites ni 503)
        if (!rawText || rawText.trim().length === 0) {
            const worker = await getTesseractWorker();
            const blob = await new Promise(r => enhancedCanvas.toBlob(r, 'image/png'));
            const res = await worker.recognize(blob);
            rawText = res.data.text;
        }

        const cleanedText = (rawText || '').trim();
        if (output) output.value = cleanedText;

        if (cleanedText.length > 0) {
            if (typeof showToast === 'function') showToast('¡Texto escaneado con éxito!');
        } else {
            alert('No se detectó texto en el recorte. Asegúrate de subrayar la zona con el botón ✂️ Subrayar.');
        }

    } catch (err) {
        console.error('Error en escáner OCR:', err);
        alert('Error en escáner OCR: ' + err.message);
    } finally {
        if (btnScan) {
            btnScan.disabled = false;
            btnScan.innerHTML = '<i class="fa-solid fa-bolt"></i> Escanear Recorte';
        }
    }
}

function copyOCRResultText() {
    const output = document.getElementById('ocrOutputSimple');
    if (!output || !output.value) {
        alert('No hay texto escaneado para copiar.');
        return;
    }

    const text = output.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (typeof showToast === 'function') showToast('¡Texto escaneado copiado!');
        }).catch(() => {
            output.select();
            document.execCommand('copy');
            if (typeof showToast === 'function') showToast('¡Texto escaneado copiado!');
        });
    } else {
        output.select();
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('¡Texto escaneado copiado!');
    }
}
