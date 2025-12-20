class RegionalDistributionManager {
  constructor() {
    this.data = null;
    this.mapElement = null;
    this.cachedData = null;
    this.init();
  }
  
  init() {
  
    if (window.ShinyBridge) {
      window.ShinyBridge.on('regional_distribution', (data) => this.handleData(data));
      
    }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const container = document.querySelector('.div9');
      
      if (container) {
        
        this.initializeTreeMap();
        
        
        if (this.cachedData) {
          
          this.updateTreeMap(this.cachedData);
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
      }
    }, 100);
  }
  
  initializeTreeMap() {
    const container = document.querySelector('.div9 > div');
    if (!container) return;
    
    container.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Regional Sales Distribution</h3>
      <div id="regional-treemap" style="width: 100%; height: calc(100% - 40px);"></div>
    `;
    
    this.mapElement = document.getElementById('regional-treemap');
    
    this.showLoadingState();
    
  }
  
  showLoadingState() {
    if (!this.mapElement) return;
    
    this.mapElement.innerHTML = `
      <div class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <div class="animate-pulse mb-2">---</div>
          <p class="text-sm">Loading distribution data...</p>
        </div>
      </div>
    `;
  }
  
  handleData(data) {
    
    if (!data || !data.hierarchy) {
      console.error('Invalid distribution data received');
      return;
    }
    
    this.cachedData = data;
    this.data = data;
    
    console.log(`  - Labels: ${data.hierarchy.labels.length}`);
    console.log(`  - Total revenue: $${data.summary?.total_revenue?.toLocaleString() || 0}`);
    
    if (this.mapElement) {
      this.updateTreeMap(data);
    } else {
      console.warn('Treemap not ready, data cached for later');
    }
  }
  
  updateTreeMap(data) {
    if (!this.mapElement || !data.hierarchy) {
      console.warn('No data to display');
      return;
    }
    
    const { labels, parents, values, orders, items } = data.hierarchy;
    
    if (!labels || labels.length === 0) {
      this.showLoadingState();
      return;
    }
    
    const cleanLabels = labels.map(label => {
      if (label.includes(' @ ')) {
        const parts = label.split(' @ ');
        return parts[0];
      }
      return label;
    });
    
    const hoverText = labels.map((label, i) => {
      let nodeType = 'Region';
      if (label.includes(' @ ')) nodeType = 'ZIP Code';
      else if (label.includes(' - ')) nodeType = 'State';
      else if (label !== 'USA') nodeType = 'City';
      
      return `<b>${label.replace(' @ ', ' in ').replace(' - ', ', ')}</b><br>` +
             `Type: ${nodeType}<br>` +
             `Revenue: $${values[i].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}<br>` +
             `Orders: ${orders[i].toLocaleString()}<br>` +
             `Items: ${items[i].toLocaleString()}`;
    });
    
    const trace = {
      type: 'treemap',
      labels: cleanLabels,
      parents: parents,
      values: values,
      text: hoverText,
      hoverinfo: 'text',
      textposition: 'middle center',
      marker: {
        colorscale: [
          [0, '#fef3c7'],
          [0.2, '#fbbf24'],
          [0.4, '#f59e0b'],
          [0.6, '#f97316'],
          [0.8, '#ef4444'],
          [1, '#dc2626']
        ],
        line: {
          color: '#ffffff',
          width: 2
        },
        pad: {
          t: 30,
          l: 5,
          r: 5,
          b: 5
        }
      },
      pathbar: {
        visible: true,
        thickness: 25,
        textfont: {
          size: 12,
          family: 'Inter, sans-serif'
        },
        edgeshape: '>'
      },
      textfont: {
        size: 12,
        family: 'Inter, sans-serif',
        color: '#1f2937'
      }
    };
    
    const layout = {
      margin: { t: 35, b: 10, l: 10, r: 10 },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: {
        family: 'Inter, sans-serif',
        size: 11,
        color: '#374151'
      },
      hoverlabel: {
        bgcolor: '#1f2937',
        font: { 
          family: 'Inter, sans-serif',
          size: 12,
          color: '#ffffff'
        },
        bordercolor: '#1f2937'
      }
    };
    
    const config = {
      displayModeBar: false,
      responsive: true
    };
    
    Plotly.react(this.mapElement, [trace], layout, config);
    
  }
  
  getData() {
    return this.data;
  }
}

window.RegionalDistributionManager = new RegionalDistributionManager();

