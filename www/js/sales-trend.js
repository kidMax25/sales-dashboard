class SalesTrendManager {
  constructor() {
    this.dailyData = null;
    this.chart = null;
    this.currentPeriod = 'monthly';
    this.cachedData = null;
    this.init();
  }
  
  init() {
    
    if (window.ShinyBridge) {
      window.ShinyBridge.on('sales_trend', (data) => this.handleData(data));
        }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const container = document.querySelector('.div10');
      
      if (container) {
        this.initializeChart();
        
        if (this.cachedData) {
          this.processTrendData(this.cachedData);
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
  
  initializeChart() {
    const container = document.querySelector('.div10 > div');
    if (!container) return;
    
    container.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Sales Trend</h3>
      <div id="sales-trend-chart" style="width: 100%; height: 240px;"></div>
      
      <div class="flex items-center gap-2 mt-2">
        <div class="inline-flex rounded-lg border border-gray-200 bg-white p-1" role="group">
          <button id="period-monthly" 
                  class="period-toggle-btn active px-4 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style="background-color: #3b82f6; color: #ffffff;">
            Monthly
          </button>
          <button id="period-quarterly" 
                  class="period-toggle-btn px-4 py-1.5 text-xs font-medium rounded-md transition-colors"
                  style="background-color: transparent; color: #6b7280;">
            Quarterly
          </button>
        </div>
      </div>
    `;
    
    this.bindToggleButtons();
    this.initializeApexChart();
    
    }
  
  initializeApexChart() {
    const options = {
      series: [
        {
          name: 'Revenue',
          type: 'column',
          data: []
        },
        {
          name: 'Orders',
          type: 'line',
          data: []
        }
      ],
      chart: {
        height: 240,
        type: 'line',
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
        },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          columnWidth: '60%',
          borderRadius: 4
        }
      },
      colors: ['#3b82f6', '#ef4444'],
      dataLabels: {
        enabled: false
      },
      labels: [],
      xaxis: {
        type: 'category',
        labels: {
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: [
        {
          title: {
            text: 'Revenue ($)',
            style: {
              fontSize: '11px'
            }
          },
          labels: {
            formatter: function(val) {
              return '$' + val.toFixed(0);
            },
            style: {
              fontSize: '10px'
            }
          }
        },
        {
          opposite: true,
          title: {
            text: 'Orders',
            style: {
              fontSize: '11px'
            }
          },
          labels: {
            formatter: function(val) {
              return val.toFixed(0);
            },
            style: {
              fontSize: '10px'
            }
          }
        }
      ],
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '11px',
        offsetY: 0
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: function(val, { seriesIndex }) {
            if (seriesIndex === 0) {
              return '$' + val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
            return val.toFixed(0);
          }
        }
      },
      grid: {
        borderColor: '#e5e7eb'
      }
    };
    
    this.chart = new ApexCharts(document.querySelector('#sales-trend-chart'), options);
    this.chart.render();
  }
  
  bindToggleButtons() {
    const monthlyBtn = document.getElementById('period-monthly');
    const quarterlyBtn = document.getElementById('period-quarterly');
    
    if (monthlyBtn) {
      monthlyBtn.addEventListener('click', () => {
        this.currentPeriod = 'monthly';
        this.updateToggleState();
        this.aggregateAndUpdate();
      });
    }
    
    if (quarterlyBtn) {
      quarterlyBtn.addEventListener('click', () => {
        this.currentPeriod = 'quarterly';
        this.updateToggleState();
        this.aggregateAndUpdate();
      });
    }
  }
  
  updateToggleState() {
    const monthlyBtn = document.getElementById('period-monthly');
    const quarterlyBtn = document.getElementById('period-quarterly');
    
    if (monthlyBtn && quarterlyBtn) {
      if (this.currentPeriod === 'monthly') {
        monthlyBtn.style.backgroundColor = '#3b82f6';
        monthlyBtn.style.color = '#ffffff';
        quarterlyBtn.style.backgroundColor = 'transparent';
        quarterlyBtn.style.color = '#6b7280';
      } else {
        quarterlyBtn.style.backgroundColor = '#3b82f6';
        quarterlyBtn.style.color = '#ffffff';
        monthlyBtn.style.backgroundColor = 'transparent';
        monthlyBtn.style.color = '#6b7280';
      }
    }
  }
  
  handleData(data) {
    if (!data || !data.daily) {
      console.error('Invalid trend data received');
      return;
    }
    
    this.cachedData = data;
    
    
    if (this.chart) {
      this.processTrendData(data);
    } else {
      console.warn('Chart not ready, data cached for later');
    }
  }
  
  processTrendData(data) {
    if (!this.chart) {
      console.warn(' Chart not initialized yet');
      return;
    }
    
    this.dailyData = data.daily;
    
    console.log(`  - Days: ${data.daily.length}`);
    console.log(`  - Date range: ${data.summary?.date_range || 'N/A'}`);
    
    this.aggregateAndUpdate();
  }
  
  aggregateAndUpdate() {
    if (!this.dailyData || this.dailyData.length === 0) {
      console.warn('No data to aggregate');
      return;
    }
    
    let aggregated;
    
    if (this.currentPeriod === 'monthly') {
      aggregated = this.aggregateMonthly();
    } else {
      aggregated = this.aggregateQuarterly();
    }
    
    this.updateChart(aggregated);
    
    console.log(`Chart updated (${this.currentPeriod}):`, aggregated.labels.length, 'periods');
  }
  
  aggregateMonthly() {
    const grouped = {};
    
    this.dailyData.forEach(day => {
      const key = day.month_name;
      
      if (!grouped[key]) {
        grouped[key] = {
          revenue: 0,
          orders: 0,
          items: 0
        };
      }
      
      grouped[key].revenue += day.revenue;
      grouped[key].orders += day.orders;
      grouped[key].items += day.items;
    });
    
    const labels = Object.keys(grouped);
    const revenue = labels.map(k => grouped[k].revenue);
    const orders = labels.map(k => grouped[k].orders);
    
    return { labels, revenue, orders };
  }
  
  aggregateQuarterly() {
    const grouped = {};
    
    this.dailyData.forEach(day => {
      const key = day.quarter_name;
      
      if (!grouped[key]) {
        grouped[key] = {
          revenue: 0,
          orders: 0,
          items: 0
        };
      }
      
      grouped[key].revenue += day.revenue;
      grouped[key].orders += day.orders;
      grouped[key].items += day.items;
    });
    
    const labels = Object.keys(grouped);
    const revenue = labels.map(k => grouped[k].revenue);
    const orders = labels.map(k => grouped[k].orders);
    
    return { labels, revenue, orders };
  }
  
  updateChart(data) {
    if (!this.chart) return;
    
    this.chart.updateOptions({
      xaxis: {
        categories: data.labels
      }
    });
    
    this.chart.updateSeries([
      {
        name: 'Revenue',
        data: data.revenue
      },
      {
        name: 'Orders',
        data: data.orders
      }
    ]);
  }
  
  getData() {
    return this.dailyData;
  }
  
  getCurrentPeriod() {
    return this.currentPeriod;
  }
}

window.SalesTrendManager = new SalesTrendManager();
