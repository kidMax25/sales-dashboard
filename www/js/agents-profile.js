

class AgentProfileManager {
  constructor() {
    this.agents = [];
    this.defaultAgent = null;
    this.currentAgent = null;
    this.portraitBasePath = 'www/portraits/';
    this.fallbackPortrait = 'https://ui-avatars.com/api/?name=Unknown&size=200&background=3b82f6&color=fff';
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
    
    this.agents = data.agents;
    this.defaultAgent = data.default_agent;
    
    console.log(`  ${this.agents.length} agents`);
    console.log(`  ${this.defaultAgent?.full_name}`);
    
    this.updateProfile(this.defaultAgent);
  }
  
  handleFilterChange(employeeId) {
    if (!employeeId || employeeId === '') {
      console.log('  → Showing default agent (All Agents)');
      this.updateProfile(this.defaultAgent);
    } else {
      const agent = this.agents.find(a => a.employee_id === employeeId);
      
      if (agent) {
        console.log(`  → Showing agent: ${agent.full_name}`);
        this.updateProfile(agent);
      } else {
        console.warn(`Agent not found: ${employeeId}`);
        this.updateProfile(this.defaultAgent);
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
    this.updateField('agent-role', agent.role);
    this.updateField('agent-email', agent.email);
    
  }
  
  updatePortrait(portraitFile, fullName) {
    const imgElement = document.getElementById('agent-portrait');
    if (!imgElement) return;
    
    const portraitPath = this.portraitBasePath + portraitFile;
    
    const testImg = new Image();
    
    testImg.onload = () => {
      imgElement.src = portraitPath;
      console.log(`  Portrait loaded: ${portraitFile}`);
    };
    
    testImg.onerror = () => {

      const initials = fullName
        .split(' ')
        .map(n => n[0])
        .join('');
      
      imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=3b82f6&color=fff&bold=true`;
      
      console.warn(`Portrait not found: ${portraitFile}, using fallback`);
    };
    
    testImg.src = portraitPath;
  }
  

  updateField(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value || 'N/A';
    } else {
      console.warn(` Element not found: ${elementId}`);
    }
  }
  
  
  getCurrentAgent() {
    return this.currentAgent;
  }
}


window.AgentProfileManager = new AgentProfileManager();
