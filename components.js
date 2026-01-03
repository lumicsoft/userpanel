document.addEventListener("DOMContentLoaded", function () {
    // 1. Inject Dots Background
    const dotsHTML = `
        <div class="dots-container">
            <div class="dots dots-white"></div>
            <div class="dots dots-cyan"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', dotsHTML);

    // 2. Inject Navbar (Top)
    const navHTML = `
        <nav class="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
            <span class="text-2xl font-black orbitron uppercase tracking-tighter italic cursor-pointer" onclick="location.href='index.html'">
                Earn <span class="text-green-400">BNB</span>
            </span>
            <div class="hidden md:flex gap-4">
                <button class="gold-btn !py-2 !px-5" onclick="location.href='index.html'">Dashboard</button>
                <button class="gold-btn !py-2 !px-5" onclick="location.href='deposits.html'">Mining</button>
                <button class="gold-btn !py-2 !px-5" onclick="location.href='referral.html'">Referral</button>
                <button class="gold-btn !py-2 !px-5" onclick="location.href='leadership.html'">Leadership</button>
                <button class="gold-btn !py-2 !px-5" onclick="location.href='history.html'">History</button>
            </div>
            <button class="gold-btn">Connect Wallet</button>
        </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 3. Inject Mobile Navigation (Bottom - Fixed 5 items)
    const mobileNavHTML = `
        <div class="mobile-nav md:hidden px-2">
            <a href="index.html" class="mobile-nav-item ${window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') ? 'active' : ''}">
                <i data-lucide="layout-dashboard" class="w-4 h-4 mb-1"></i>
                <span class="text-[8px]">Home</span>
            </a>
            <a href="deposits.html" class="mobile-nav-item ${window.location.pathname.includes('deposits.html') ? 'active' : ''}">
                <i data-lucide="hard-drive" class="w-4 h-4 mb-1"></i>
                <span class="text-[8px]">Mining</span>
            </a>
            <a href="referral.html" class="mobile-nav-item ${window.location.pathname.includes('referral.html') ? 'active' : ''}">
                <i data-lucide="users" class="w-4 h-4 mb-1"></i>
                <span class="text-[8px]">Team</span>
            </a>
            <a href="leadership.html" class="mobile-nav-item ${window.location.pathname.includes('leadership.html') ? 'active' : ''}">
                <i data-lucide="trophy" class="w-4 h-4 mb-1"></i>
                <span class="text-[8px]">Rewards</span>
            </a>
            <a href="history.html" class="mobile-nav-item ${window.location.pathname.includes('history.html') ? 'active' : ''}">
                <i data-lucide="clock" class="w-4 h-4 mb-1"></i>
                <span class="text-[8px]">History</span>
            </a>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
