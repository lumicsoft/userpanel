document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Navbar
    const navHTML = `
    <nav class="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <span class="text-2xl font-black orbitron uppercase tracking-tighter italic">Earn <span class="text-green-400">BNB</span></span>
        <div class="hidden md:flex gap-4">
            <button class="gold-btn !py-2 !px-5" onclick="location.href='index.html'">Dashboard</button>
            <button class="gold-btn !py-2 !px-5" onclick="location.href='referral.html'">Referral</button>
            <button class="gold-btn !py-2 !px-5" onclick="location.href='leadership.html'">Leadership</button>
        </div>
        <button class="gold-btn" id="connectWallet">Connect Wallet</button>
    </nav>`;

    // 2. Load Mobile Nav
    const mobileNavHTML = `
    <div class="mobile-nav md:hidden">
        <a href="index.html" class="mobile-nav-item" id="nav-dashboard">
            <i data-lucide="layout-dashboard" class="w-5 h-5 mb-1"></i>
            <span>Dashboard</span>
        </a>
        <a href="referral.html" class="mobile-nav-item" id="nav-referral">
            <i data-lucide="users" class="w-5 h-5 mb-1"></i>
            <span>Referral</span>
        </a>
        <a href="leadership.html" class="mobile-nav-item" id="nav-leadership">
            <i data-lucide="trophy" class="w-5 h-5 mb-1"></i>
            <span>Leadership</span>
        </a>
    </div>`;

    // 3. Inject into Page
    document.body.insertAdjacentHTML('afterbegin', '<div class="dots-container"><div class="dots dots-white"></div><div class="dots dots-cyan"></div></div>');
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);

    // 4. Set Active State for Mobile Nav
    const path = window.location.pathname;
    if(path.includes('index')) document.getElementById('nav-dashboard').classList.add('active');
    if(path.includes('referral')) document.getElementById('nav-referral').classList.add('active');
    if(path.includes('leadership')) document.getElementById('nav-leadership').classList.add('active');

    // Re-init Lucide Icons
    lucide.createIcons();
});

// Utility Functions
function copyLink() {
    var input = document.getElementById("refURL");
    input.select();
    navigator.clipboard.writeText(input.value);
    alert("Referral Link Copied!");
}