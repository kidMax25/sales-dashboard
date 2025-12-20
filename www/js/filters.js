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
    this.cachedOptions = null; 
    this.cachedKPIs = null;
    this.initialStateSent = false;
    this.init();
  }
  
  init() {
    console.log('Starting Filters...');
    
    if (window.ShinyBridge) {
      window.ShinyBridge.on('filter_options', (data) => this.handleOptions(data));
      window.ShinyBridge.on('update_kpis', (data) => this.handleKPIs(data));
    }
    
    if (typeof $ !== 'undefined') {
      $(document).on('shiny:connected', () => {
        console.log('Shiny connected, waiting for dashboard render...');
        this.waitForElements();
      });
    } else {
      this.waitForElements();
    }
  }
  
  handleOptions(data) {
    this.cachedOptions = data;
    this.populateOptions(data);
  }
  
  handleKPIs(data) {
    this.cachedKPIs = data; 
    this.updateKPIs(data);
  }
  
  waitForElements() {
    const checkElements = () => {
      const startDate = document.getElementById('start_date');
      const agentFilter = document.getElementById('agent_filter');
      const kpiCard = document.querySelector('.div4 .grid > div:nth-child(1) .text-2xl');
      
      if (startDate && agentFilter) {
        this.bindEvents();
  
        if (this.cachedOptions) {
          this.populateOptions(this.cachedOptions);
        }
        
        if (kpiCard && this.cachedKPIs) {
          this.updateKPIs(this.cachedKPIs);
        } else if (this.cachedKPIs && !kpiCard) {
          setTimeout(() => {
            const kpiCheck = document.querySelector('.div4 .grid > div:nth-child(1) .text-2xl');
            if (kpiCheck && this.cachedKPIs) {
              this.updateKPIs(this.cachedKPIs);
            }
          }, 500);
        }
        
        this.sendInitialState();
       
        return true;
      }
      return false;
    };
    
    if (checkElements()) return;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    const interval = setInterval(() => {
      attempts++;
      
      if (checkElements()) {
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('Filter elements not found after 5 seconds');
      }
    }, 100);
  }
  
  sendInitialState() {
    if (this.initialStateSent) {
      return;
    }
    
    console.log('Sending initial filter state to R...');
    
    this.updateState();
    
    if (window.ShinyBridge && window.ShinyBridge.isReady()) {
      window.ShinyBridge.setInput('dashboard_filters', this.state, {priority: 'event'});
      console.log('Initial filter state sent: ' + JSON.stringify(this.state));
      this.initialStateSent = true;
    } else {
      console.warn('Shiny not ready, will retry in 500ms');
      setTimeout(() => this.sendInitialState(), 500);
    }
  }
  
  bindEvents() {
    if (this.bound) {
      return;
    }
    
    const filterIds = ['start_date', 'end_date', 'agent_filter', 'region_filter', 'category_filter'];
    let boundCount = 0;
    
    filterIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => this.handleChange(id));
        boundCount++;
      } else {
        console.warn('Not found: ' + id);
      }
    });
    
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.reset();
      });
      boundCount++;
    } else {
      console.warn('Not found: reset-filters');
    }
    
    if (boundCount > 0) {
      this.bound = true;
      console.log('Successfully bound ' + boundCount + ' filter elements');
    } else {
      console.error('No filter elements were bound!');
    }
  }
  
  handleChange(filterId) {
    this.updateState();
    console.log('Filter changed: ' + filterId + ' = ' + this.state[this.getStateKey(filterId)]);
    
    if (window.ShinyBridge && window.ShinyBridge.isReady()) {
      window.ShinyBridge.setInput('dashboard_filters', this.state, {priority: 'event'});
      console.log('Sent filter update to Shiny');
    } else {
      console.warn('Shiny not ready, cannot send filter update');
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
    
    // Reset agent profile to default
    if (window.AgentProfileManager) {
      window.AgentProfileManager.resetToDefault();
    }
    
    if (window.ShinyBridge && window.ShinyBridge.isReady()) {
      window.ShinyBridge.setInput('dashboard_filters', this.state, {priority: 'event'});
      console.log('Reset state sent to Shiny');
    }
    
    console.log('Filters reset');
  }
  
  populateOptions(options) {
    console.log('Populating filter options...');
    
    if (!options) {
      console.error('No options provided');
      return;
    }
    
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
        
        console.log('Agents: ' + options.agents.length + ' items');
      } else {
        console.warn('agent_filter element not found');
      }
    }
    
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
        
        console.log('Regions: ' + options.regions.length + ' items');
      } else {
        console.warn('region_filter element not found');
      }
    }
    
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
        
        console.log('Categories: ' + options.categories.length + ' items');
      } else {
        console.warn('category_filter element not found');
      }
    }
    
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
      
      console.log('Date range: ' + options.date_range.min_date + ' to ' + options.date_range.max_date);
    }
    
    console.log('Filter options populated');
  }
  
  updateKPIs(kpis) {
    console.log('Updating KPIs...');
    
    if (!kpis) {
      console.error('No KPI data provided');
      return;
    }
    
    const updateElement = (selector, text) => {
      const el = document.querySelector(selector);
      if (el) {
        el.textContent = text;
      } else {
        console.warn('Element not found: ' + selector);
      }
    };
    
    if (kpis.total_revenue) {
      updateElement('.div4 .grid > div:nth-child(1) .text-2xl', kpis.total_revenue.formatted);
      updateElement('.div4 .grid > div:nth-child(1) .text-xs', kpis.total_revenue.subtitle);
      console.log('Revenue: ' + kpis.total_revenue.formatted);
    }
    
    if (kpis.total_orders) {
      updateElement('.div4 .grid > div:nth-child(2) .text-2xl', kpis.total_orders.formatted);
      updateElement('.div4 .grid > div:nth-child(2) .text-xs', kpis.total_orders.subtitle);
      console.log('Orders: ' + kpis.total_orders.formatted);
    }
    
    if (kpis.average_order_value) {
      updateElement('.div4 .grid > div:nth-child(3) .text-2xl', kpis.average_order_value.formatted);
      updateElement('.div4 .grid > div:nth-child(3) .text-xs', kpis.average_order_value.subtitle);
      console.log('Avg Order: ' + kpis.average_order_value.formatted);
    }
    
    if (kpis.total_shipped) {
      updateElement('.div4 .grid > div:nth-child(4) .text-2xl', kpis.total_shipped.formatted);
      updateElement('.div4 .grid > div:nth-child(4) .text-xs', kpis.total_shipped.subtitle);
      console.log('Shipped: ' + kpis.total_shipped.formatted);
    }
    
    console.log('KPIs updated');
  }
  
  getState() {
    return {...this.state};
  }
  
  isFiltered() {
    return Object.values(this.state).some(v => v !== '');
  }
}

window.FilterManager = new FilterManager();

console.log('Filter Manager loaded');