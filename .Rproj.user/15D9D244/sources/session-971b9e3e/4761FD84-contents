/**
 * Navigation - Handle page switching
 */

function navigateToPage(pageName) {
    console.log('Navigating to:', pageName);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page shown:', pageName);
        
        // Trigger Shiny binding if page was just loaded
        if (typeof Shiny !== 'undefined') {
            setTimeout(() => {
                Shiny.bindAll(targetPage);
            }, 100);
        }
    } else {
        console.error('Page not found:', pageName + '-page');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'});
    
    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
        sidebar.classList.remove('open');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Navigation initialized');
    
    // Set initial page
    setTimeout(() => {
        navigateToPage('dashboard');
    }, 100);
});