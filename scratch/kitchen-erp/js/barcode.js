/**
 * barcode.js — Módulo de leitura de código de barras
 * Usa QuaggaJS para leitura via câmera
 */

const BarcodeScanner = {
  isRunning: false,
  callbackFn: null,

  init(callback) {
    this.callbackFn = callback;
  },

  open(callback) {
    if (callback) this.callbackFn = callback;
    const overlay = document.getElementById('scannerOverlay');
    overlay.classList.add('active');
    document.getElementById('scannerResult').innerHTML = '<p>Iniciando câmera...</p>';
    document.getElementById('manualBarcode').value = '';
    this.start();
  },

  close() {
    this.stop();
    const overlay = document.getElementById('scannerOverlay');
    overlay.classList.remove('active');
  },

  start() {
    if (this.isRunning) return;

    // Verifica se QuaggaJS está disponível
    if (typeof Quagga === 'undefined') {
      document.getElementById('scannerResult').innerHTML =
        '<p style="color: var(--warning)">⚠️ Biblioteca de leitura não disponível. Use o campo manual abaixo.</p>';
      return;
    }

    const viewport = document.getElementById('interactive');
    viewport.innerHTML = '';

    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: viewport,
        constraints: {
          width: { min: 320 },
          height: { min: 240 },
          facingMode: 'environment',
          aspectRatio: { min: 1, max: 2 }
        }
      },
      locator: {
        patchSize: 'medium',
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: [
          'code_128_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader',
          '2of5_reader',
          'i2of5_reader'
        ]
      },
      locate: true
    }, (err) => {
      if (err) {
        console.error('Quagga init error:', err);
        document.getElementById('scannerResult').innerHTML =
          `<p style="color: var(--danger)">❌ Câmera não disponível: ${err.message || err}.<br>Use o campo manual abaixo.</p>`;
        return;
      }
      Quagga.start();
      this.isRunning = true;
      document.getElementById('scannerResult').innerHTML =
        '<p>📷 Aponte a câmera para o código de barras...</p>';
    });

    Quagga.onDetected((result) => {
      if (!result || !result.codeResult) return;
      const code = result.codeResult.code;
      if (!code) return;

      // Feedback visual
      document.getElementById('scannerResult').innerHTML =
        `<p style="color: var(--accent)">✅ Código detectado: <strong>${code}</strong></p>`;

      this.stop();
      setTimeout(() => {
        this.close();
        if (this.callbackFn) this.callbackFn(code);
      }, 800);
    });

    Quagga.onProcessed((result) => {
      const drawingCtx = Quagga.canvas.ctx.overlay;
      const drawingCanvas = Quagga.canvas.dom.overlay;
      if (!drawingCtx || !drawingCanvas) return;
      drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), parseInt(drawingCanvas.getAttribute('height')));
    });
  },

  stop() {
    if (this.isRunning && typeof Quagga !== 'undefined') {
      try { Quagga.stop(); } catch(e) {}
    }
    this.isRunning = false;
  },

  // Leitura via USB (input de teclado) — detecta sequência rápida de teclas
  initKeyboardListener(callback) {
    let buffer = '';
    let timer = null;

    document.addEventListener('keydown', (e) => {
      // Ignora se estiver digitando em um input (exceto se for o leitor USB que é muito rápido)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (timer) clearTimeout(timer);
      if (e.key === 'Enter' && buffer.length > 3) {
        callback(buffer);
        buffer = '';
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
      }
      timer = setTimeout(() => {
        buffer = '';
      }, 100);
    });
  }
};

// Setup botões do scanner
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('scannerClose').addEventListener('click', () => {
    BarcodeScanner.close();
  });

  document.getElementById('manualBarcodeBtn').addEventListener('click', () => {
    const val = document.getElementById('manualBarcode').value.trim();
    if (val) {
      BarcodeScanner.close();
      if (BarcodeScanner.callbackFn) BarcodeScanner.callbackFn(val);
    }
  });

  document.getElementById('manualBarcode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        BarcodeScanner.close();
        if (BarcodeScanner.callbackFn) BarcodeScanner.callbackFn(val);
      }
    }
  });
});
