/**
 * Lucy Public Widget
 *
 * Simple round button that opens the ElevenLabs widget.
 * No access code - this is for customer-facing public Lucy.
 */
(function() {
  'use strict';

  const AGENT_ID = 'agent_7801kfyjvzw7fgdae9g64jwsgxmx';

  function createWidget() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #lucy-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .lucy-widget-btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #64b5f6;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
      }

      .lucy-widget-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 24px rgba(100, 181, 246, 0.3);
      }

      .lucy-widget-btn svg {
        width: 24px;
        height: 24px;
      }

      .lucy-widget-btn.active {
        background: linear-gradient(135deg, #64b5f6 0%, #2d5a8c 100%);
        color: white;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(100, 181, 246, 0.4); }
        50% { box-shadow: 0 4px 30px rgba(100, 181, 246, 0.6); }
      }

      /* Hide our button when ElevenLabs widget is active */
      #lucy-widget.widget-active .lucy-widget-btn {
        display: none;
      }

      /* Position the ElevenLabs widget */
      elevenlabs-convai {
        --elevenlabs-convai-widget-position: fixed;
        --elevenlabs-convai-widget-bottom: 24px;
        --elevenlabs-convai-widget-right: 24px;
      }
    `;
    document.head.appendChild(style);

    // Create widget container
    const widget = document.createElement('div');
    widget.id = 'lucy-widget';
    widget.innerHTML = `
      <button class="lucy-widget-btn" id="lucy-widget-btn" title="Chat with Lucy">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    `;
    document.body.appendChild(widget);

    let widgetElement = null;
    let isActive = false;

    const btn = document.getElementById('lucy-widget-btn');

    btn.addEventListener('click', () => {
      if (isActive && widgetElement) {
        // End conversation
        widgetElement.remove();
        widgetElement = null;
        isActive = false;
        widget.classList.remove('widget-active');
        btn.classList.remove('active');
        return;
      }

      // Create ElevenLabs widget
      widgetElement = document.createElement('elevenlabs-convai');
      widgetElement.setAttribute('agent-id', AGENT_ID);

      // Event listeners
      widgetElement.addEventListener('elevenlabs-convai:connected', () => {
        isActive = true;
        widget.classList.add('widget-active');
        btn.classList.add('active');
      });

      widgetElement.addEventListener('elevenlabs-convai:disconnected', () => {
        isActive = false;
        widget.classList.remove('widget-active');
        btn.classList.remove('active');
        if (widgetElement) {
          widgetElement.remove();
          widgetElement = null;
        }
      });

      document.body.appendChild(widgetElement);
      isActive = true;
      widget.classList.add('widget-active');
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
