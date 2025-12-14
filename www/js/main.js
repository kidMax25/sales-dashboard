/**
 * Main - Global utilities and initialization
 */

// Wait for Shiny to be ready
if (typeof $ !== 'undefined') {
    $(document).on('shiny:connected', function() {
        console.log('Shiny connected');
    });
}

// Global utilities
const DashboardUtils = {
    
    // Format currency
    formatCurrency: function(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    },
    
    // Format number
    formatNumber: function(value) {
        return new Intl.NumberFormat('en-US').format(value);
    },
    
    // Format date
    formatDate: function(date) {
        return new Intl.DateTimeFormat('en-US').format(new Date(date));
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Log initialization
console.log('Northwind Traders Dashboard initialized');
console.log('ShinyX Architecture loaded');

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
});

// Performance monitoring
window.addEventListener('load', function() {
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime + 'ms');
    }
});