class AgentProfileManager {
  constructor() {
    this.agents = [];
    this.defaultAgent = null;
    this.currentAgent = null;
    this.portraitBasePath = '/portraits/';
    this.fallbackPortrait = 'https://ui-avatars.com/api/?name=Unknown&size=200&background=3b82f6&color=fff';
    this.cachedData = null;
    
    // Hardcoded default manager for "All Agents" view
    this.hardcodedDefault = {
      employee_id: 'default',
      full_name: 'Stephen Thorpe',
      role: 'Sales Manager',
      email: 'stephen.thorpe@company.com',
      portrait: 'stephen-thorpe.jpg'
    };
    
    this.roleColors = {
      'sales manager': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'manager': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'vice president': { bg: 'bg-red-100', text: 'text-red-700' },
      'sales representative': { bg: 'bg-green-100', text: 'text-green-700' }
    };
    
    this.init();
  }
  
  init() {
    if (window.ShinyBridge) {
      window.ShinyBridge.on('agent_data', (data) => this.handleAgentData(data));
    }
    
    this.waitForElements();
  }
  
  waitForElements() {
    const checkElements = () => {
      const container = document.getElementById('agent-profile-container');
      const agentFilter = document.getElementById('agent_filter');
      
      if (container) {
        if (agentFilter) {
          agentFilter.addEventListener('change', (e) => {
            this.handleFilterChange(e.target.value);
          });
        }
        
        if (this.cachedData) {
          this.processAgentData(this.cachedData);
        } else {
          // Show hardcoded default on initial load
          this.updateProfile(this.hardcodedDefault);
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
        console.error('Agent profile container not found after 5 seconds');
      }
    }, 100);
  }
  
  handleAgentData(data) {
    if (!data || !data.agents) {
      return;
    }
    
    this.cachedData = data;
    this.processAgentData(data);
  }
  
  processAgentData(data) {
    const container = document.getElementById('agent-profile-container');
    if (!container) {
      return;
    }
    
    this.agents = data.agents;
    this.defaultAgent = data.default_agent;
    
    console.log('Loaded ' + this.agents.length + ' agents');
    console.log('Default agent: ' + this.defaultAgent?.full_name);
    
    // Always show hardcoded default instead of the one from data
    this.updateProfile(this.hardcodedDefault);
  }
  
  handleFilterChange(employeeId) {
    if (!employeeId || employeeId === '') {
      console.log('Showing default agent (All Agents)');
      // Show hardcoded default for "All Agents"
      this.updateProfile(this.hardcodedDefault);
    } else {
      const agent = this.agents.find(a => a.employee_id === employeeId);
      
      if (agent) {
        console.log('Showing agent: ' + agent.full_name);
        this.updateProfile(agent);
      } else {
        console.warn('Agent not found: ' + employeeId);
        this.updateProfile(this.hardcodedDefault);
      }
    }
  }
  
  updateProfile(agent) {
    if (!agent) {
      console.warn('No agent to display');
      return;
    }
    
    this.currentAgent = agent;
    
    this.updatePortrait(agent.portrait, agent.full_name);
    this.updateField('agent-name', agent.full_name);
    this.updateRole(agent.role);
    this.updateEmail(agent.email); 
    
    console.log('Profile updated: ' + agent.full_name);
  }
  
  updatePortrait(portraitFile, fullName) {
    const imgElement = document.getElementById('agent-portrait');
    if (!imgElement) return;
    
    const portraitPath = this.portraitBasePath + portraitFile;
    const testImg = new Image();
    
    testImg.onload = () => {
      imgElement.src = portraitPath;
      console.log('Portrait loaded: ' + portraitFile);
    };
    
    testImg.onerror = () => {
      const initials = fullName.split(' ').map(n => n[0]).join('');
      imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=3b82f6&color=fff&bold=true`;
      console.warn('Portrait not found: ' + portraitFile + ', using fallback');
    };
    
    testImg.src = portraitPath;
  }
  
  updateRole(role) {
    const roleElement = document.getElementById('agent-role');
    if (!roleElement) {
      console.warn('Role element not found');
      return;
    }

    // Normalize role string
    let cleanRole = role || 'N/A';

    // If role contains "Vice President", force it to just "Vice President"
    if (/vice president/i.test(cleanRole)) {
      cleanRole = 'Vice President';
    }

    const roleLower = cleanRole.toLowerCase();
    let colors = { bg: 'bg-gray-100', text: 'text-gray-700' };

    if (roleLower.includes('sales manager') || roleLower.includes('manager')) {
      colors = this.roleColors['manager'];
    } else if (roleLower.includes('vice president') || roleLower.includes('vp')) {
      colors = this.roleColors['vice president'];
    } else if (roleLower.includes('sales representative') || roleLower.includes('representative')) {
      colors = this.roleColors['sales representative'];
    }

    roleElement.textContent = cleanRole;
    roleElement.className = `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${colors.bg} ${colors.text}`;

    console.log('Role updated: ' + cleanRole + ' (' + colors.bg + ')');
  }
  
  updateEmail(email) {
    const emailElement = document.getElementById('agent-email');
    if (!emailElement) {
      console.warn('Email element not found');
      return;
    }
    
    const displayEmail = email || 'No email on file';
    const isValidEmail = email && email.includes('@');
    
    if (isValidEmail) {
      emailElement.href = `mailto:${email}`;
      emailElement.className = 'flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer';
      const span = emailElement.querySelector('span');
      if (span) span.textContent = email;
    } else {
      emailElement.href = '#';
      emailElement.className = 'flex items-center gap-2 text-xs text-gray-500 pointer-events-none';
      const span = emailElement.querySelector('span');
      if (span) span.textContent = displayEmail;
      emailElement.onclick = (e) => e.preventDefault();
    }
  }
  
  updateField(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value || 'N/A';
    } else {
      console.warn('Element not found: ' + elementId);
    }
  }
  
  getCurrentAgent() {
    return this.currentAgent;
  }
  
  // Method to reset to default (can be called by reset button)
  resetToDefault() {
    this.updateProfile(this.hardcodedDefault);
  }
}

window.AgentProfileManager = new AgentProfileManager();

console.log('Agent Profile Manager loaded');