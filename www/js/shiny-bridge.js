class ShinyBridge {
  constructor() {
    this.ready = false;
    this.messageHandlers = new Map();
    this.init();
  }
  
  init() {
    if (typeof Shiny === 'undefined') {
      console.warn('Shiny not available - Bridge in standalone mode');
      return;
    }
    
    console.log('Initializing Shiny Bridge...');
    
    $(document).on('shiny:connected', () => {
      this.ready = true;
      this.setupMessageHandlers();
    });
    
    $(document).on('shiny:disconnected', () => {
      this.ready = false;
      console.warn(' Shiny disconnected');
    });
  }
  
  setupMessageHandlers() {
    Shiny.addCustomMessageHandler('filter_options', (data) => {
      console.log('[Bridge] Received filter_options');
      this.trigger('filter_options', data);
    });
    
    Shiny.addCustomMessageHandler('update_kpis', (data) => {
      console.log('[Bridge] Received update_kpis');
      this.trigger('update_kpis', data);
    });
    
    Shiny.addCustomMessageHandler('product_data', (data) => {
      console.log('[Bridge] Received product_data');
      this.trigger('product_data', data);
    });
    
    Shiny.addCustomMessageHandler('filter_state', (data) => {
      console.log('[Bridge] Received filter_state');
      this.trigger('filter_state', data);
    });
    
    Shiny.addCustomMessageHandler('agent_data', (data) => {
      console.log('[Bridge] Received agent_data');
      this.trigger('agent_data', data);
    });
    
    Shiny.addCustomMessageHandler('regional_data', (data) => {
      console.log('[Bridge] Received regional_data');
      this.trigger('regional_data', data);
    });
    
    Shiny.addCustomMessageHandler('regional_distribution', (data) => {
      console.log('[Bridge] Received regional_distribution');
      this.trigger('regional_distribution', data);
    });
    
    
    Shiny.addCustomMessageHandler('sales_trend', (data) => {
      console.log('[Bridge] Received sales_trend');
      this.trigger('sales_trend', data);
    });
  }
  
  /**
   * Send data to Shiny input
   * @param {string} inputId - The input ID (e.g., 'dashboard_filters')
   * @param {any} value - The value to send
   * @param {object} options - Shiny options (priority, etc.)
   */
  setInput(inputId, value, options = {}) {
    if (!this.ready) {
      console.warn(`Cannot set input '${inputId}' - Shiny not ready`);
      return false;
    }
    
    Shiny.setInputValue(inputId, value, options);
    console.log(`[Bridge] Sent to input '${inputId}':`, value);
    return true;
  }
  
  /**
   * Send custom message to R
   * @param {string} type - Message type
   * @param {any} message - Message data
   */
  sendCustomMessage(type, message) {
    if (!this.ready) {
      console.warn(`Cannot send message '${type}' - Shiny not ready`);
      return false;
    }
    
    Shiny.setInputValue(type, message, {priority: 'event'});
    console.log(`[Bridge] Sent custom message '${type}':`, message);
    return true;
  }
  
  /**
   * Register a handler for messages from R
   * @param {string} type - Message type to listen for
   * @param {function} callback - Function to call when message received
   */
  on(type, callback) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(callback);
    console.log(`[Bridge] Handler registered for '${type}'`);
  }
  
  /**
   * Trigger handlers for a message type
   * @param {string} type - Message type
   * @param {any} data - Message data
   */
  trigger(type, data) {
    if (!this.messageHandlers.has(type)) return;
    
    const handlers = this.messageHandlers.get(type);
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in handler for '${type}':`, error);
      }
    });
  }
  
  /**
   * Get a Shiny input value
   * @param {string} inputId - The input ID
   * @returns {any} The current value
   */
  getInput(inputId) {
    if (!this.ready) return null;
    return Shiny.shinyapp.$inputValues[inputId];
  }
  
  /**
   * Check if Shiny is ready
   * @returns {boolean}
   */
  isReady() {
    return this.ready;
  }
}

// Create global instance
window.ShinyBridge = new ShinyBridge();