/**
 * Filters - Handle dashboard filter interactions
 */

function getFilterValues() {
    return {
        startDate: document.getElementById('start_date')?.value || '',
        endDate: document.getElementById('end_date')?.value || '',
        agent: document.getElementById('agent_filter')?.value || '',
        region: document.getElementById('region_filter')?.value || '',
        category: document.getElementById('category_filter')?.value || ''
    };
}

function applyFilters() {
    const filters = getFilterValues();
    console.log('Applying filters:', filters);
    
    // Send to Shiny if available
    if (typeof Shiny !== 'undefined') {
        Shiny.setInputValue('dashboard_filters', filters, {priority: 'event'});
    }
    
    // You can add visual feedback here
    showNotification('Filters applied successfully', 'success');
}

function resetFilters() {
    console.log('Resetting filters');
    
    // Reset all filter inputs
    const startDate = document.getElementById('start_date');
    const endDate = document.getElementById('end_date');
    const agentFilter = document.getElementById('agent_filter');
    const regionFilter = document.getElementById('region_filter');
    const categoryFilter = document.getElementById('category_filter');
    
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (agentFilter) agentFilter.value = '';
    if (regionFilter) regionFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    
    // Reset agent profile to default
    if (typeof updateAgentProfile === 'function') {
        updateAgentProfile('agent1');
    }
    
    // Send reset to Shiny
    if (typeof Shiny !== 'undefined') {
        Shiny.setInputValue('filters_reset', Math.random(), {priority: 'event'});
    }
    
    showNotification('Filters reset', 'info');
}

function showNotification(message, type = 'info') {
    // Simple notification (you can enhance this with a library)
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You can add a visual notification here
    // For now, we'll just log it
}

// Bind Shiny inputs for filters
function bindFilterInputs() {
    const filters = ['start_date', 'end_date', 'agent_filter', 'region_filter', 'category_filter'];
    
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', function() {
                if (typeof Shiny !== 'undefined') {
                    Shiny.setInputValue(filterId, this.value);
                }
            });
        }
    });
}

// Initialize filters
document.addEventListener('DOMContentLoaded', function() {
    console.log('Filters initialized');
    
    // Reset button
    const resetButton = document.getElementById('reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }
    
    // Auto-apply filters when changed
    const filterInputs = document.querySelectorAll('#accordion-filters select, #accordion-filters input');
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Small delay to allow UI to update
            setTimeout(applyFilters, 100);
        });
    });
    
    // Bind Shiny inputs
    if (typeof Shiny !== 'undefined') {
        bindFilterInputs();
    }
});