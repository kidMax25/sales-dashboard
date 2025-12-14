/**
 * Sidebar - Toggle functionality
 */

// Central function to handle the logic
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Logic for Desktop (Large Screens)
    if (window.innerWidth >= 1024) {
        // Simply toggle the minimized class (240px <-> 64px)
        sidebar.classList.toggle('minimized');
    } 
    // Logic for Mobile (Small Screens)
    else {
        // Toggle visibility (Slide in/out)
        sidebar.classList.toggle('open');
        
        // PER YOUR REQUEST: Ensure it shows icons only (minimized) when opening
        // If you strictly want icons only on mobile, we force the class:
        if (sidebar.classList.contains('open')) {
            sidebar.classList.add('minimized');
        } else {
            // Optional: Remove it when closing so it resets
            sidebar.classList.remove('minimized');
        }
    }
}

// Initialize Sidebar Logic
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar logic initialized with Event Delegation');

    // 1. EVENT DELEGATION (The Fix)
    // We listen to the document because the buttons are created dynamically by Shiny
    document.addEventListener('click', function(event) {
        
        // Check if the clicked element is (or is inside) one of our toggle buttons
        const toggleBtn = event.target.closest('#sidebar-toggle-desktop, #sidebar-toggle-mobile');
        
        if (toggleBtn) {
            // Stop the button from doing anything else
            event.preventDefault();
            // Run our toggle logic
            toggleSidebar();
        }
    });

    // 2. Close sidebar when clicking outside (Mobile only)
    document.addEventListener('click', function(event) {
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = event.target.closest('#sidebar-toggle-mobile');
            
            // If sidebar is open, exists, and click is NOT inside sidebar and NOT on the toggle button
            if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !toggleBtn) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // 3. Handle window resize to reset states if needed
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                if (window.innerWidth >= 1024) {
                    sidebar.classList.remove('open'); // Reset mobile state
                } else {
                    sidebar.classList.remove('minimized'); // Reset desktop state logic
                }
            }
        }, 250);
    });
});