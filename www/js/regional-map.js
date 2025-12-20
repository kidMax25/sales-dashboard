class RegionalMapManager {
  constructor() {
    this.mapData = null;
    this.mapElement = null;
    this.cachedData = null; // ✅ CACHE DATA
    this.init();
  }
  
  init() {
    console.log('🗺️ Initializing Regional Map Manager...');
    
    if (window.ShinyBridge) {
      window.ShinyBridge.on('regional_data', (data) => this.handleRegionalData(data));
      console.log('✅ Regional Map Manager connected to Shiny Bridge');
    }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const mapContainer = document.querySelector('.div8');
      
      if (mapContainer) {
        console.log('✅ Map container found');
        this.initializeMap();
        
        // ✅ If we have cached data, display it now
        if (this.cachedData) {
          console.log('📋 Displaying cached regional data');
          this.updateMap(this.cachedData);
        }
        
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
        console.error('❌ Map container not found after 5 seconds');
      }
    }, 100);
  }
  
  initializeMap() {
    const container = document.querySelector('.div8 > div');
    if (!container) return;
    
    container.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Orders by State</h3>
      <div id="regional-map" style="width: 100%; height: 280px;"></div>
    `;
    
    this.mapElement = document.getElementById('regional-map');
    
    // Show loading state
    this.showLoadingState();
    
    console.log('✅ Map initialized');
  }
  
  showLoadingState() {
    if (!this.mapElement) return;
    
    const data = [{
      type: 'choropleth',
      locationmode: 'USA-states',
      locations: ['CA', 'TX', 'NY'],
      z: [1, 1, 1],
      colorscale: [[0, '#e5e7eb'], [1, '#e5e7eb']],
      showscale: false,
      hoverinfo: 'skip'
    }];
    
    const layout = {
      geo: {
        scope: 'usa',
        showlakes: false,
        showland: true,
        landcolor: '#f9fafb',
        bgcolor: '#ffffff'
      },
      margin: { t: 0, b: 0, l: 0, r: 0 },
      paper_bgcolor: '#ffffff',
      font: { family: 'Inter, sans-serif', size: 10 }
    };
    
    const config = {
      displayModeBar: false,
      responsive: true
    };
    
    Plotly.newPlot(this.mapElement, data, layout, config);
  }
  
  handleRegionalData(data) {
    console.log('📥 Received regional data from Shiny');
    
    if (!data || !data.states) {
      console.error('❌ Invalid regional data received');
      return;
    }
    
    // ✅ CACHE THE DATA
    this.cachedData = data;
    this.mapData = data;
    
    console.log(`  - States: ${data.states.length}`);
    console.log(`  - Total orders: ${data.summary?.total_orders || 0}`);
    
    // ✅ Try to update immediately
    if (this.mapElement) {
      this.updateMap(data);
    } else {
      console.warn('⚠️ Map not ready, data cached for later');
    }
  }
  
  updateMap(data) {
    if (!this.mapElement || !data.states || data.states.length === 0) {
      console.warn('⚠️ No data to display on map');
      return;
    }
    
    const states = data.states.map(s => s.state);
    const orders = data.states.map(s => s.orders);
    const revenues = data.states.map(s => s.revenue);
    const stateNames = data.states.map(s => s.state_name);
    const items = data.states.map(s => s.items);
    
    const hoverText = data.states.map(s => 
      `<b>${s.state_name}</b><br>` +
      `Orders: ${s.orders.toLocaleString()}<br>` +
      `Revenue: $${s.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}<br>` +
      `Items Shipped: ${s.items.toLocaleString()}`
    );
    
    const choroplethTrace = {
      type: 'choropleth',
      locationmode: 'USA-states',
      locations: states,
      z: orders,
      text: hoverText,
      hoverinfo: 'text',
      colorscale: [
        [0, '#dbeafe'],
        [0.5, '#60a5fa'],
        [1, '#1e40af']
      ],
      colorbar: {
        title: {
          text: 'Orders',
          side: 'right',
          font: { size: 10 }
        },
        thickness: 10,
        len: 0.7,
        x: 1.02,
        tickfont: { size: 9 }
      },
      marker: {
        line: {
          color: '#ffffff',
          width: 1
        }
      }
    };
    
    const bubbleTrace = {
      type: 'scattergeo',
      locationmode: 'USA-states',
      locations: states,
      text: stateNames,
      marker: {
        size: revenues.map(r => Math.sqrt(r) / 50),
        color: '#ef4444',
        line: {
          color: '#ffffff',
          width: 1
        },
        sizemode: 'diameter',
        opacity: 0.6
      },
      hoverinfo: 'skip',
      showlegend: false
    };
    
    const traces = [choroplethTrace, bubbleTrace];
    
    const layout = {
      geo: {
        scope: 'usa',
        projection: {
          type: 'albers usa'
        },
        showlakes: true,
        lakecolor: '#e0f2fe',
        showland: true,
        landcolor: '#f9fafb',
        bgcolor: '#ffffff',
        countrycolor: '#d1d5db',
        showframe: false
      },
      margin: { t: 5, b: 5, l: 5, r: 50 },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: {
        family: 'Inter, sans-serif',
        size: 10,
        color: '#374151'
      },
      hoverlabel: {
        bgcolor: '#1f2937',
        font: { 
          family: 'Inter, sans-serif',
          size: 11,
          color: '#ffffff'
        },
        bordercolor: '#1f2937'
      }
    };
    
    const config = {
      displayModeBar: false,
      responsive: true,
      staticPlot: true
    };
    
    Plotly.react(this.mapElement, traces, layout, config);
    
    console.log('✅ Map updated with', states.length, 'states');
  }
  
  getMapData() {
    return this.mapData;
  }
}

window.RegionalMapManager = new RegionalMapManager();

console.log('✅ Regional Map Manager loaded');