function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    if (window.innerWidth >= 1024) {
        sidebar.classList.toggle('minimized');
    } else {
        sidebar.classList.toggle('open');
        
        if (sidebar.classList.contains('open')) {
            sidebar.classList.add('minimized');
        } else {
            sidebar.classList.remove('minimized');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sidebar initialized');

    document.addEventListener('click', function(event) {
        const toggleBtn = event.target.closest('#sidebar-toggle-desktop, #sidebar-toggle-mobile');
        
        if (toggleBtn) {
            event.preventDefault();
            event.stopPropagation();
            toggleSidebar();
            console.log('Sidebar toggled');
        }
    });

    document.addEventListener('click', function(event) {
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = event.target.closest('#sidebar-toggle-mobile');
            
            if (sidebar && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !toggleBtn) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                if (window.innerWidth >= 1024) {
                    sidebar.classList.remove('open');
                } else {
                    sidebar.classList.remove('minimized');
                }
            }
        }, 250);
    });
});

if (typeof $ !== 'undefined') {
    $(document).on('shiny:connected', function() {
        setTimeout(function() {
            const desktopBtn = document.getElementById('sidebar-toggle-desktop');
            const mobileBtn = document.getElementById('sidebar-toggle-mobile');
            
            if (desktopBtn) {
                console.log('Desktop toggle button found');
            }
            if (mobileBtn) {
                console.log('Mobile toggle button found');
            }
        }, 500);
    });
}

console.log('Sidebar script loaded');