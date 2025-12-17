class FilterManager {
  constructor() {
    this.state = {
      startDate: '',
      endDate: '',
      agent: '',
      region: '',
      category: ''
    };
    
    this.bound = false;
    this.cachedOptions = null; // ✅ CACHE OPTIONS HERE
    this.cachedKPIs = null; // ✅ CACHE KPIs HERE
    this.init();
  }
  
  init() {
    console.log('🔧 Initializing Filter Manager...');
    
    // Register handlers with Shiny Bridge
    if (window.ShinyBridge) {
      window.ShinyBridge.on('filter_options', (data) => this.handleOptions(data));
      window.ShinyBridge.on('update_kpis', (data) => this.handleKPIs(data));
      console.log('✅ Filter Manager connected to Shiny Bridge');
    }
    
    // Wait for Shiny to be connected AND elements to be rendered
    if (typeof $ !== 'undefined') {
      $(document).on('shiny:connected', () => {
        console.log('🔌 Shiny connected, waiting for dashboard render...');
        this.waitForElements();
      });
    } else {
      this.waitForElements();
    }
  }
  
  /**
   * Handle filter options - cache them and populate if elements exist
   */
  handleOptions(data) {
    console.log('📥 Received filter options from Shiny');
    this.cachedOptions = data; // ✅ CACHE THE DATA
    
    // Try to populate immediately
    this.populateOptions(data);
  }
  
  /**
   * Handle KPI updates - cache them and update if elements exist
   */
  handleKPIs(data) {
    console.log('📥 Received KPI data from Shiny');
    this.cachedKPIs = data; // ✅ CACHE THE DATA
    
    // Try to update immediately
    this.updateKPIs(data);
  }
  
  waitForElements() {
    console.log('⏳ Waiting for filter elements...');
    
    const checkElements = () => {
      const startDate = document.getElementById('start_date');
      const agentFilter = document.getElementById('agent_filter');
      const kpiCard = document.querySelector('.div4 .grid > div:nth-child(1) .text-2xl');
      
      if (startDate && agentFilter) {
        console.log('✅ Filter elements found!');
        this.bindEvents();
        
        // ✅ POPULATE CACHED OPTIONS NOW
        if (this.cachedOptions) {
          console.log('📋 Populating cached options...');
          this.populateOptions(this.cachedOptions);
        }
        
        // ✅ UPDATE CACHED KPIs IF ELEMENTS EXIST
        if (kpiCard && this.cachedKPIs) {
          console.log('📊 Updating cached KPIs...');
          this.updateKPIs(this.cachedKPIs);
        } else if (this.cachedKPIs && !kpiCard) {
          console.log('⚠️ KPI elements not ready yet, will retry...');
          // Continue checking for KPI elements
          setTimeout(() => {
            const kpiCheck = document.querySelector('.div4 .grid > div:nth-child(1) .text-2xl');
            if (kpiCheck && this.cachedKPIs) {
              console.log('📊 KPI elements now ready, updating...');
              this.updateKPIs(this.cachedKPIs);
            }
          }, 500);
        }
        
        return true;
      }
      return false;
    };
    
    // Try immediately
    if (checkElements()) return;
    
    // Check every 100ms for up to 5 seconds
    let attempts = 0;
    const maxAttempts = 50;
    
    const interval = setInterval(() => {
      attempts++;
      
      if (checkElements()) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('❌ Filter elements not found after 5 seconds');
      }
    }, 100);
  }
  
  bindEvents() {
    if (this.bound) {
      console.log('⚠️ Events already bound, skipping');
      return;
    }
    
    console.log('🔗 Binding filter events...');
    
    const filterIds = ['start_date', 'end_date', 'agent_filter', 'region_filter', 'category_filter'];
    let boundCount = 0;
    
    filterIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.handleChange(id));
        boundCount++;
        console.log(`  ✅ Bound: ${id}`);
      } else {
        console.warn(`  ⚠️ Not found: ${id}`);
      }
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.reset();
      });
      boundCount++;
      console.log('  ✅ Bound: reset-filters');
    } else {
      console.warn('  ⚠️ Not found: reset-filters');
    }
    
    if (boundCount > 0) {
      this.bound = true;
      console.log(`✅ Successfully bound ${boundCount} filter elements`);
    } else {
      console.error('❌ No filter elements were bound!');
    }
  }
  
  handleChange(filterId) {
    this.updateState();
    console.log(`🔄 Filter changed: ${filterId} = ${this.state[this.getStateKey(filterId)]}`);
    
    // ✅ FIX: Send when Shiny IS ready (removed the !)
    if (window.ShinyBridge && window.ShinyBridge.isReady()) {
      window.ShinyBridge.setInput('dashboard_filters', this.state, {priority: 'event'});
      console.log('📤 Sent filter update to Shiny');
    } else {
      console.warn('⚠️ Shiny not ready, cannot send filter update');
    }
  }
  
  getStateKey(elementId) {
    const map = {
      'start_date': 'startDate',
      'end_date': 'endDate',
      'agent_filter': 'agent',
      'region_filter': 'region',
      'category_filter': 'category'
    };
    return map[elementId] || elementId;
  }
  
  updateState() {
    const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    
    this.state = {
      startDate: getValue('start_date'),
      endDate: getValue('end_date'),
      agent: getValue('agent_filter'),
      region: getValue('region_filter'),
      category: getValue('category_filter')
    };
  }
  
  reset() {
    console.log('🔄 Resetting filters...');
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    
    setVal('start_date', '');
    setVal('end_date', '');
    setVal('agent_filter', '');
    setVal('region_filter', '');
    setVal('category_filter', '');
    
    this.state = {
      startDate: '',
      endDate: '',
      agent: '',
      region: '',
      category: ''
    };
    
    if (typeof updateAgentProfile === 'function') {
      updateAgentProfile('agent1');
    }
    
    console.log('✅ Filters reset');
  }
  
  populateOptions(options) {
    console.log('📥 Populating filter options...');
    
    if (!options) {
      console.error('❌ No options provided');
      return;
    }
    
    // Populate Agents
    if (options.agents && Array.isArray(options.agents)) {
      const select = document.getElementById('agent_filter');
      if (select) {
        select.innerHTML = '<option value="">All Agents</option>';
        
        options.agents.forEach(agent => {
          const option = document.createElement('option');
          option.value = agent.value;
          option.textContent = agent.label;
          select.appendChild(option);
        });
        
        console.log(`  ✅ Agents: ${options.agents.length} items`);
      } else {
        console.warn('  ⚠️ agent_filter element not found');
      }
    }
    
    // Populate Regions
    if (options.regions && Array.isArray(options.regions)) {
      const select = document.getElementById('region_filter');
      if (select) {
        select.innerHTML = '<option value="">All Cities</option>';
        
        options.regions.forEach(region => {
          const option = document.createElement('option');
          option.value = region.value;
          option.textContent = region.label;
          select.appendChild(option);
        });
        
        console.log(`  ✅ Regions: ${options.regions.length} items`);
      } else {
        console.warn('  ⚠️ region_filter element not found');
      }
    }
    
    // Populate Categories
    if (options.categories && Array.isArray(options.categories)) {
      const select = document.getElementById('category_filter');
      if (select) {
        select.innerHTML = '<option value="">All Categories</option>';
        
        options.categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.value;
          option.textContent = cat.label;
          select.appendChild(option);
        });
        
        console.log(`  ✅ Categories: ${options.categories.length} items`);
      } else {
        console.warn('  ⚠️ category_filter element not found');
      }
    }
    
    // Set date range
    if (options.date_range) {
      const startDate = document.getElementById('start_date');
      const endDate = document.getElementById('end_date');
      
      if (startDate) {
        startDate.min = options.date_range.min_date;
        startDate.max = options.date_range.max_date;
      }
      
      if (endDate) {
        endDate.min = options.date_range.min_date;
        endDate.max = options.date_range.max_date;
      }
      
      console.log(`  ✅ Date range: ${options.date_range.min_date} to ${options.date_range.max_date}`);
    }
    
    console.log('✅ Filter options populated');
  }
  
  updateKPIs(kpis) {
    console.log('📊 Updating KPIs...');
    
    if (!kpis) {
      console.error('❌ No KPI data provided');
      return;
    }
    
    const updateElement = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) {
        el.textContent = text;
      } else {
        console.warn(`  ⚠️ Element not found: ${selector}`);
      }
    };
    
    if (kpis.total_revenue) {
      updateElement('.div4 .grid > div:nth-child(1) .text-2xl', kpis.total_revenue.formatted);
      updateElement('.div4 .grid > div:nth-child(1) .text-xs', kpis.total_revenue.subtitle);
      console.log(`  ✅ Revenue: ${kpis.total_revenue.formatted}`);
    }
    
    if (kpis.total_orders) {
      updateElement('.div4 .grid > div:nth-child(2) .text-2xl', kpis.total_orders.formatted);
      updateElement('.div4 .grid > div:nth-child(2) .text-xs', kpis.total_orders.subtitle);
      console.log(`  ✅ Orders: ${kpis.total_orders.formatted}`);
    }
    
    if (kpis.average_order_value) {
      updateElement('.div4 .grid > div:nth-child(3) .text-2xl', kpis.average_order_value.formatted);
      updateElement('.div4 .grid > div:nth-child(3) .text-xs', kpis.average_order_value.subtitle);
      console.log(`  ✅ Avg Order: ${kpis.average_order_value.formatted}`);
    }
    
    if (kpis.total_shipped) {
      updateElement('.div4 .grid > div:nth-child(4) .text-2xl', kpis.total_shipped.formatted);
      updateElement('.div4 .grid > div:nth-child(4) .text-xs', kpis.total_shipped.subtitle);
      console.log(`  ✅ Shipped: ${kpis.total_shipped.formatted}`);
    }
    
    console.log('✅ KPIs updated');
  }
  
  getState() {
    return {...this.state};
  }
  
  isFiltered() {
    return Object.values(this.state).some(v => v !== '');
  }
}

// Create global instance
window.FilterManager = new FilterManager();

console.log('✅ Filter Manager loaded');