/**
 * ============================================
 * CUSTOM SHINY INPUT BINDING FOR FILTERS
 * ============================================
 * This creates a proper Shiny input binding that allows
 * our custom HTML filters to communicate with Shiny's
 * reactive system without modules/namespaces
 */

// Create a custom input binding for the entire filter panel
var filterBinding = new Shiny.InputBinding();

$.extend(filterBinding, {
  
  // Find all elements that use this binding
  find: function(scope) {
    return $(scope).find('.dashboard-filters');
  },
  
  // Get the current value (called by Shiny)
  getValue: function(el) {
    return {
      startDate: $('#start_date').val() || '',
      endDate: $('#end_date').val() || '',
      agent: $('#agent_filter').val() || '',
      region: $('#region_filter').val() || '',
      category: $('#category_filter').val() || ''
    };
  },
  
  // Set value programmatically (if needed)
  setValue: function(el, value) {
    if (value.startDate) $('#start_date').val(value.startDate);
    if (value.endDate) $('#end_date').val(value.endDate);
    if (value.agent) $('#agent_filter').val(value.agent);
    if (value.region) $('#region_filter').val(value.region);
    if (value.category) $('#category_filter').val(value.category);
  },
  
  // Subscribe to events
  subscribe: function(el, callback) {
    // Listen to changes on all filter inputs
    $(el).on('change.filterBinding', 
      '#start_date, #end_date, #agent_filter, #region_filter, #category_filter',
      function(event) {
        console.log('🔔 Filter changed via binding:', event.target.id);
        callback(true); // Tell Shiny the value changed
      }
    );
    
    // Listen to reset button
    $(el).on('click.filterBinding', '#reset-filters', function(e) {
      e.preventDefault();
      
      // Reset all inputs
      $('#start_date').val('');
      $('#end_date').val('');
      $('#agent_filter').val('');
      $('#region_filter').val('');
      $('#category_filter').val('');
      
      console.log('🔔 Filters reset via binding');
      callback(true); // Tell Shiny the value changed
    });
  },
  
  // Unsubscribe from events
  unsubscribe: function(el) {
    $(el).off('.filterBinding');
  },
  
  // Return rate policy (how often to send updates)
  getRatePolicy: function() {
    return {
      policy: 'debounce',
      delay: 250 // Wait 250ms after last change
    };
  }
});

// Register the binding with Shiny
Shiny.inputBindings.register(filterBinding, 'dashboard.filters');

console.log('✅ Custom filter binding registered');