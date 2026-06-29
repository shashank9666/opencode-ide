export const antigravityInjectionScript = `
(() => {
  if (window.__antigravityUI) return;

  // CSS Injection
  const style = document.createElement('style');
  style.textContent = \`
    #ag-ui-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647; /* Max z-index */
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Custom Cursor */
    #ag-cursor {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.4);
      border-radius: 50%;
      top: -10px;
      left: -10px;
      transform: translate(0, 0);
      transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
      display: none;
    }

    #ag-cursor.clicking {
      animation: ag-click 0.3s ease-out;
    }

    @keyframes ag-click {
      0% { transform: scale(1); background: rgba(99, 102, 241, 0.4); }
      50% { transform: scale(0.6); background: rgba(99, 102, 241, 0.8); }
      100% { transform: scale(1); background: rgba(99, 102, 241, 0.4); }
    }

    /* Glassmorphic Modal */
    #ag-modal {
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 24px;
      color: #f8fafc;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    #ag-modal.show {
      opacity: 1;
      transform: translateY(0);
    }
  \`;
  document.head.appendChild(style);

  // DOM Elements Injection
  const container = document.createElement('div');
  container.id = 'ag-ui-container';

  const cursor = document.createElement('div');
  cursor.id = 'ag-cursor';

  const modal = document.createElement('div');
  modal.id = 'ag-modal';

  container.appendChild(cursor);
  container.appendChild(modal);
  document.documentElement.appendChild(container);

  // Expose API
  window.__antigravityUI = {
    showModal: (text) => {
      modal.textContent = text;
      modal.classList.add('show');
    },
    hideModal: () => {
      modal.classList.remove('show');
    },
    moveCursorTo: (x, y) => {
      cursor.style.display = 'block';
      cursor.style.transform = \`translate(\${x}px, \${y}px)\`;
    },
    click: () => {
      cursor.classList.remove('clicking');
      // Trigger reflow to restart animation
      void cursor.offsetWidth;
      cursor.classList.add('clicking');
    },
    typeText: async (element, text) => {
      // Basic typing effect simulation
      element.focus();
      element.value = '';
      for (let i = 0; i < text.length; i++) {
        element.value += text[i];
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
      }
    }
  };
})();
`;
