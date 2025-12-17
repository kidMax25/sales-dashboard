class ProductInfoManager {
  constructor() {
    this.charts = {
      categoryDonut: null,
      salesBar: null
    };
    this.cachedData = null;
    this.init();
  }
  
  init() {
    if (window.ShinyBridge) {
      window.ShinyBridge.on('product_data', (data) => this.handleProductData(data));
    
    }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const categoryChart = document.querySelector('.div5');
      const salesChart = document.querySelector('.div6');
      const latestSales = document.querySelector('.div7');
      
      if (categoryChart && salesChart && latestSales) {
        this.initializeCharts();
        
        if (this.cachedData) {
          this.updateCharts(this.cachedData);
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
  
  handleProductData(data) {
    this.cachedData = data;
    
    if (this.charts.categoryDonut) {
      this.updateCharts(data);
    }
  }
  
  initializeCharts() {
    
    const categoryOptions = {
      series: [1],
      chart: {
        type: 'donut',
        height: 350,
        animations: {
          enabled: true,
          speed: 800
        }
      },
      labels: ['Loading...'],
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f43f5e'],
      legend: {
        position: 'bottom',
        fontSize: '12px'
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val.toFixed(1) + '%';
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Sales',
                fontSize: '11px',
                fontWeight: 600,
                formatter: function(w) {
                  return '$' + w.globals.seriesTotals.reduce((a, b) => a + b, 0).toFixed(0);
                }
              }
            }
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 250
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
    
    const categoryContainer = document.querySelector('.div5 > div');
    if (categoryContainer) {
      categoryContainer.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Product Category Distribution</h3>
        <div id="category-donut-chart"></div>
      `;
      
      this.charts.categoryDonut = new ApexCharts(
        document.querySelector('#category-donut-chart'),
        categoryOptions
      );
      this.charts.categoryDonut.render();
      console.log(' Category donut chart initialized');
    }
    
    // Initialize Sales Bar Chart (div6)
    const salesOptions = {
      series: [{
        name: 'Sales',
        data: [1]
      }],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: false,
          columnWidth: '60%',
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return '$' + val.toFixed(0);
        },
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: ['Loading...'],
        labels: {
          style: {
            fontSize: '11px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Sales ($)',
          style: {
            fontSize: '12px'
          }
        },
        labels: {
          formatter: function(val) {
            return '$' + val.toFixed(0);
          }
        }
      },
      colors: ['#3b82f6'],
      grid: {
        borderColor: '#e5e7eb'
      }
    };
    
    const salesContainer = document.querySelector('.div6 > div');
    if (salesContainer) {
      salesContainer.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Products by Sales</h3>
        <div id="sales-bar-chart"></div>
      `;
      
      this.charts.salesBar = new ApexCharts(
        document.querySelector('#sales-bar-chart'),
        salesOptions
      );
      this.charts.salesBar.render();
      console.log('  Sales bar chart initialized');
    }
    
    console.log('All product charts initialized');
  }
  
  updateCharts(data) {
    if (!data) {
      
      return;
    }
    
    // Update Category Donut Chart
    if (data.category_distribution && this.charts.categoryDonut) {
      const categories = data.category_distribution.map(d => d.category);
      const values = data.category_distribution.map(d => d.sales);
      
      this.charts.categoryDonut.updateOptions({
        labels: categories,
        series: values
      });
      
      console.log(` Category donut updated (${categories.length} categories)`);
    }
    
    // Update Sales Bar Chart
    if (data.top_products && this.charts.salesBar) {
      const products = data.top_products.map(d => d.product);
      const sales = data.top_products.map(d => d.sales);
      
      this.charts.salesBar.updateOptions({
        xaxis: {
          categories: products
        }
      });
      
      this.charts.salesBar.updateSeries([{
        name: 'Sales',
        data: sales
      }]);
      
      console.log(` Sales bar updated (${products.length} products)`);
    }
    
    // Update Latest Sales List
    if (data.latest_sales) {
      this.updateLatestSales(data.latest_sales);
    }
    
    console.log('Product charts updated');
  }
  
  updateLatestSales(sales) {
    console.log('Updating latest sales list...');
    
    const container = document.querySelector('.div7 .space-y-3');
    if (!container) {
      console.warn(' Latest sales container not found');
      return;
    }
    
    if (!sales || sales.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm text-center py-8">No sales data available</p>';
      return;
    }
    
    // Build HTML for sales items
    const html = sales.map(sale => `
      <div class="flex items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div>
          <div class="font-medium text-sm text-gray-800">${sale.product}</div>
          <div class="text-xs text-gray-500">${sale.category}</div>
        </div>
        <div class="text-right">
          <div class="font-semibold text-sm text-gray-800">$${sale.total.toFixed(2)}</div>
          <div class="text-xs text-gray-500">${sale.quantity} ${sale.quantity === 1 ? 'unit' : 'units'}</div>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = html;
    console.log(` Latest sales updated (${sales.length} items)`);
  }
  
  destroy() {
    // Clean up charts
    if (this.charts.categoryDonut) {
      this.charts.categoryDonut.destroy();
    }
    if (this.charts.salesBar) {
      this.charts.salesBar.destroy();
    }
  }
}

// Create global instance
window.ProductInfoManager = new ProductInfoManager();

console.log('Product Info Manager loaded');