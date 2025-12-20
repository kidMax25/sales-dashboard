class SalesAgentsManager {
  constructor() {
    this.agents = [];
    this.agentStats = [];
    this.filteredAgents = [];
    this.currentSort = 'name';
    this.portraitBasePath = '/portraits/';
    
    this.roleColors = {
      'sales manager': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'manager': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'vice president': { bg: 'bg-red-100', text: 'text-red-700' },
      'sales representative': { bg: 'bg-green-100', text: 'text-green-700' }
    };
    
    this.init();
  }
  
  init() {
    console.log('Sales Agents Manager initialized');
    
    if (window.ShinyBridge) {
      window.ShinyBridge.on('agent_data', (data) => this.handleAgentData(data));
      window.ShinyBridge.on('agent_performance', (data) => this.handlePerformanceData(data));
    }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const grid = document.getElementById('agents-grid');
      const searchInput = document.getElementById('agent-search');
      
      if (grid) {
        console.log('Sales agents page elements found');
        
        if (searchInput) {
          searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        const roleFilter = document.getElementById('agent-role-filter');
        if (roleFilter) {
          roleFilter.addEventListener('change', (e) => this.handleRoleFilter(e.target.value));
        }
        
        const sortSelect = document.getElementById('agent-sort');
        if (sortSelect) {
          sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value));
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
        console.error('Sales agents page elements not found');
      }
    }, 100);
  }
  
  handleAgentData(data) {
    if (!data || !data.agents) return;
    
    this.agents = data.agents;
    console.log('Loaded ' + this.agents.length + ' agents');
    
    this.filteredAgents = [...this.agents];
    this.renderAgents();
  }
  
  handlePerformanceData(data) {
    if (!data) return;
    
    this.agentStats = data;
    console.log('Loaded performance data for agents');
    
    this.renderAgents();
  }
  
  handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredAgents = [...this.agents];
    } else {
      this.filteredAgents = this.agents.filter(agent => {
        return agent.full_name.toLowerCase().includes(searchTerm) ||
               agent.role.toLowerCase().includes(searchTerm) ||
               agent.email.toLowerCase().includes(searchTerm);
      });
    }
    
    this.renderAgents();
  }
  
  handleRoleFilter(role) {
    if (!role) {
      this.filteredAgents = [...this.agents];
    } else {
      this.filteredAgents = this.agents.filter(agent => {
        return agent.role.toLowerCase().includes(role.toLowerCase());
      });
    }
    
    this.renderAgents();
  }
  
  handleSort(sortBy) {
    this.currentSort = sortBy;
    
    this.filteredAgents.sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'revenue') {
        const aStats = this.getAgentStats(a.employee_id);
        const bStats = this.getAgentStats(b.employee_id);
        return (bStats?.revenue || 0) - (aStats?.revenue || 0);
      } else if (sortBy === 'orders') {
        const aStats = this.getAgentStats(a.employee_id);
        const bStats = this.getAgentStats(b.employee_id);
        return (bStats?.orders || 0) - (aStats?.orders || 0);
      }
      return 0;
    });
    
    this.renderAgents();
  }
  
  getAgentStats(employeeId) {
    if (!this.agentStats || !Array.isArray(this.agentStats)) return null;
    return this.agentStats.find(s => s.employee_id === employeeId);
  }
  
  getRoleColors(role) {
    const roleLower = (role || '').toLowerCase();
    
    if (roleLower.includes('sales manager') || roleLower.includes('manager')) {
      return this.roleColors['manager'];
    } else if (roleLower.includes('vice president') || roleLower.includes('vp')) {
      return this.roleColors['vice president'];
    } else if (roleLower.includes('sales representative') || roleLower.includes('representative')) {
      return this.roleColors['sales representative'];
    }
    
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
  
  renderAgents() {
    const grid = document.getElementById('agents-grid');
    if (!grid) return;
    
    if (this.filteredAgents.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        </div>
      `;
      return;
    }
    
    const cardsHtml = this.filteredAgents.map(agent => {
      const stats = this.getAgentStats(agent.employee_id);
      const colors = this.getRoleColors(agent.role);
      
      return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div class="flex flex-col items-center">
            <div class="w-24 h-24 mb-4 rounded-full overflow-hidden border-4 ${colors.bg} flex-shrink-0">
              <img src="${this.portraitBasePath}${agent.portrait}" 
                   alt="${agent.full_name}"
                   onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(agent.full_name.split(' ').map(n => n[0]).join(''))}&size=200&background=3b82f6&color=fff&bold=true'"
                   class="w-full h-full object-cover">
            </div>
            
            <h3 class="text-lg font-bold text-gray-800 mb-1 text-center">${agent.full_name}</h3>
            
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${colors.bg} ${colors.text}">
              ${agent.role}
            </span>
            
            <a href="mailto:${agent.email}" 
               class="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline mb-4">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span>${agent.email}</span>
            </a>
            
            ${stats ? `
              <div class="w-full pt-4 border-t border-gray-100">
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div class="text-2xl font-bold text-gray-800">$${(stats.revenue / 1000).toFixed(0)}K</div>
                    <div class="text-xs text-gray-500">Revenue</div>
                  </div>
                  <div>
                    <div class="text-2xl font-bold text-gray-800">${stats.orders}</div>
                    <div class="text-xs text-gray-500">Orders</div>
                  </div>
                </div>
              </div>
            ` : `
              <div class="w-full pt-4 border-t border-gray-100 text-center text-gray-400 text-xs">
                No performance data
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
    
    grid.innerHTML = cardsHtml;
    console.log('Rendered ' + this.filteredAgents.length + ' agent cards');
  }
}

window.SalesAgentsManager = new SalesAgentsManager();

console.log('Sales Agents Manager loaded');