/**
 * Lucy Voice Widget
 *
 * Custom voice widget for ludicrous-lucy.me that:
 * 1. Gates access with a simple code
 * 2. Fetches pre-call context from lucy-bridge
 * 3. Starts ElevenLabs conversation with dynamic variables
 *
 * Usage:
 *   <script src="https://elevenlabs.io/convai-widget/index.js" async></script>
 *   <script src="voice-widget.js" defer></script>
 *
 * The widget auto-injects its UI when loaded.
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    agentId: 'agent_9501kb4trkxcepq9865ftg509wag',
    bridgeUrl: 'https://lucy-bridge.wplab.com',
    // Access code - can be changed by Matt
    // Simple obfuscation (not security, just prevents casual inspection)
    accessCode: atob('THVjeVZvaWNlMjAyNg=='), // "LucyVoice2026"
    storageKey: 'lucy_voice_access'
  };

  // State
  let conversation = null;
  let isConnected = false;
  let hasAccess = false;

  // Check for stored access
  function checkStoredAccess() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Access valid for 7 days
        if (data.timestamp && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch (e) {
      console.log('Could not check stored access');
    }
    return false;
  }

  // Store access
  function storeAccess() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({
        timestamp: Date.now()
      }));
    } catch (e) {
      console.log('Could not store access');
    }
  }

  // Create the widget UI
  function createWidget() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #lucy-voice-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lucy-voice-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(100, 181, 246, 0.4);
        transition: all 0.3s ease;
      }

      .lucy-voice-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(100, 181, 246, 0.5);
      }

      .lucy-voice-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .lucy-voice-btn svg {
        width: 28px;
        height: 28px;
      }

      .lucy-voice-btn.active {
        background: linear-gradient(135deg, #64b5f6 0%, #2d5a8c 100%);
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(100, 181, 246, 0.4); }
        50% { box-shadow: 0 4px 30px rgba(100, 181, 246, 0.6); }
      }

      .lucy-voice-modal {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 300px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        padding: 24px;
        display: none;
      }

      .lucy-voice-modal.show {
        display: block;
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .lucy-voice-modal h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        color: #333;
      }

      .lucy-voice-modal p {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;
      }

      .lucy-voice-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e1e1e1;
        border-radius: 8px;
        font-size: 16px;
        box-sizing: border-box;
        transition: border-color 0.3s;
      }

      .lucy-voice-input:focus {
        outline: none;
        border-color: #64b5f6;
      }

      .lucy-voice-input.error {
        border-color: #f5576c;
        animation: shake 0.5s ease;
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .lucy-voice-submit {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: opacity 0.3s;
      }

      .lucy-voice-submit:hover {
        opacity: 0.9;
      }

      .lucy-voice-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .lucy-voice-status {
        text-align: center;
        padding: 8px;
        font-size: 14px;
        color: #666;
      }

      .lucy-voice-status.error {
        color: #f5576c;
      }

      .lucy-voice-status.success {
        color: #10b981;
      }
    `;
    document.head.appendChild(style);

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'lucy-voice-widget';
    widget.innerHTML = `
      <div class="lucy-voice-modal" id="lucy-voice-modal">
        <h3>Talk to Lucy</h3>
        <p id="lucy-modal-content">Enter access code to start a voice conversation.</p>
        <input type="password" class="lucy-voice-input" id="lucy-access-code" placeholder="Access code" autocomplete="off">
        <button class="lucy-voice-submit" id="lucy-submit-code">Start Conversation</button>
        <div class="lucy-voice-status" id="lucy-status"></div>
      </div>
      <button class="lucy-voice-btn" id="lucy-voice-btn" title="Talk to Lucy">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
      </button>
    `;
    document.body.appendChild(widget);

    // Get elements
    const btn = document.getElementById('lucy-voice-btn');
    const modal = document.getElementById('lucy-voice-modal');
    const codeInput = document.getElementById('lucy-access-code');
    const submitBtn = document.getElementById('lucy-submit-code');
    const status = document.getElementById('lucy-status');
    const modalContent = document.getElementById('lucy-modal-content');

    // Check if already has access
    hasAccess = checkStoredAccess();

    // Button click handler
    btn.addEventListener('click', async () => {
      if (isConnected) {
        // End conversation
        await endConversation();
        return;
      }

      if (hasAccess) {
        // Already has access, start directly
        modal.classList.add('show');
        modalContent.textContent = 'Click to start your voice conversation with Lucy.';
        codeInput.style.display = 'none';
        submitBtn.textContent = 'Start Conversation';
      } else {
        // Show access code modal
        modal.classList.add('show');
        modalContent.textContent = 'Enter access code to start a voice conversation.';
        codeInput.style.display = 'block';
        codeInput.value = '';
        codeInput.focus();
      }
    });

    // Submit handler
    submitBtn.addEventListener('click', async () => {
      if (!hasAccess) {
        // Verify access code
        const code = codeInput.value.trim();
        if (code !== CONFIG.accessCode) {
          codeInput.classList.add('error');
          status.textContent = 'Invalid access code';
          status.className = 'lucy-voice-status error';
          setTimeout(() => {
            codeInput.classList.remove('error');
          }, 500);
          return;
        }

        // Store access
        hasAccess = true;
        storeAccess();
      }

      // Start conversation
      await startConversation(status, btn, modal);
    });

    // Enter key to submit
    codeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitBtn.click();
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (!widget.contains(e.target) && modal.classList.contains('show')) {
        modal.classList.remove('show');
      }
    });
  }

  // Fetch pre-call context
  async function fetchContext() {
    try {
      const response = await fetch(`${CONFIG.bridgeUrl}/voice/pre-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.dynamic_variables || {};
    } catch (error) {
      console.error('Failed to fetch context:', error);
      // Return fallback values
      return {
        greeting: "Hello! How can I help you today?",
        recent_context: "No context available"
      };
    }
  }

  // Start ElevenLabs conversation
  async function startConversation(status, btn, modal) {
    status.textContent = 'Fetching context...';
    status.className = 'lucy-voice-status';

    try {
      // Fetch dynamic context
      const context = await fetchContext();

      status.textContent = 'Connecting...';

      // Wait for ElevenLabs SDK to load (async script)
      let attempts = 0;
      while (!window.ElevenLabsConversationalAI && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.ElevenLabsConversationalAI) {
        throw new Error('ElevenLabs SDK failed to load. Please refresh the page.');
      }

      // Get page language
      const pageLang = document.documentElement.lang || 'en';

      // Start the conversation
      conversation = await window.ElevenLabsConversationalAI.startSession({
        agentId: CONFIG.agentId,
        dynamicVariables: context,
        language: pageLang,
        onConnect: () => {
          console.log('Connected to Lucy');
          isConnected = true;
          btn.classList.add('active');
          modal.classList.remove('show');
        },
        onDisconnect: () => {
          console.log('Disconnected from Lucy');
          isConnected = false;
          btn.classList.remove('active');
          conversation = null;
        },
        onError: (error) => {
          console.error('Conversation error:', error);
          status.textContent = 'Connection error. Please try again.';
          status.className = 'lucy-voice-status error';
          isConnected = false;
          btn.classList.remove('active');
        },
        onModeChange: (mode) => {
          // mode can be 'speaking', 'listening', 'idle'
          console.log('Mode:', mode);
        }
      });

      status.textContent = 'Connected! Speak now.';
      status.className = 'lucy-voice-status success';

    } catch (error) {
      console.error('Failed to start conversation:', error);
      status.textContent = error.message || 'Failed to connect. Please try again.';
      status.className = 'lucy-voice-status error';
    }
  }

  // End conversation
  async function endConversation() {
    if (conversation) {
      try {
        await conversation.endSession();
      } catch (e) {
        console.error('Error ending session:', e);
      }
      conversation = null;
    }
    isConnected = false;
    document.getElementById('lucy-voice-btn')?.classList.remove('active');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
