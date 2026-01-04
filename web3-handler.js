let provider, signer, contract, usdtContract;

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "YOUR_TESTNET_CONTRACT_ADDRESS"; 
const USDT_ADDRESS = "0x337610d27c2425019392024265f210e69503487c"; 
const TESTNET_CHAIN_ID = 97; 

const CONTRACT_ABI = [
    "function register(string username, string referrerUsername) external",
    "function deposit(uint256 amount) external",
    "function claimDailyReward(uint256 amount) external",
    "function compoundDailyReward(uint256 amount) external",
    "function withdrawPrincipal() external",
    "function getLiveBalance(address uA) view returns (uint256 pendingROI, uint256 pendingCap)",
    "function users(address) view returns (address referrer, string username, bool registered, uint256 joinDate, uint256 totalActiveDeposit, uint256 teamActiveDeposit, uint256 teamTotalDeposit, uint256 totalDeposited, uint256 totalWithdrawn, uint256 totalEarnings)",
    "function usersExtra(address) view returns (uint256 rewardsReferral, uint256 rewardsOnboarding, uint256 rewardsRank, uint256 reserveDailyCapital, uint256 reserveDailyROI, uint256 reserveNetwork, uint32 teamCount, uint32 directsCount, uint32 directsQuali, uint8 rank)"
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
];

async function init() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) setupApp(accounts[0]);
    }
}

async function connectWallet() {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        setupApp(accounts[0]);
    } catch (err) { console.error("Login failed", err); }
}

async function setupApp(address) {
    const { chainId } = await provider.getNetwork();
    if (chainId !== TESTNET_CHAIN_ID) {
        alert("Please switch to BSC Testnet!");
        return;
    }

    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    
    updateNavbar(address);
    fetchAllData(address);
}

async function fetchAllData(address) {
    try {
        const [user, extra, live] = await Promise.all([
            contract.users(address),
            contract.usersExtra(address),
            contract.getLiveBalance(address)
        ]);

        if (!user.registered) {
            updateText('total-deposit-display', "$ 0.00");
            return;
        }

        // --- Dashboard Main Stats ---
        updateText('total-deposit-display', `$ ${format(user.totalDeposited)}`);
        updateText('active-deposit', `$ ${format(user.totalActiveDeposit)}`);
        updateText('total-earned', `$ ${format(user.totalEarnings)}`);
        updateText('total-withdrawn', `$ ${format(user.totalWithdrawn)}`);
        updateText('capital-investment-display', `$ ${format(user.totalActiveDeposit)}`);
        updateText('capital-withdrawn-display', `$ ${format(user.totalWithdrawn)}`);

        // --- Live Calculations ---
        const pendingROI = parseFloat(format(live.pendingROI));
        const pendingCap = parseFloat(format(live.pendingCap));
        const withdrawable = (pendingROI + pendingCap).toFixed(2);

        updateText('withdrawable-display', `$ ${withdrawable}`);
        updateText('compounding-balance', `$ ${withdrawable}`);
        updateText('projected-return', `$ ${(parseFloat(format(user.totalActiveDeposit)) * 0.05).toFixed(2)}`); // Assuming 5% daily

        // --- Rank & Status ---
        updateText('rank-display', getRankName(extra.rank));
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge && user.totalActiveDeposit.gt(0)) {
            statusBadge.innerText = "● Active Status";
            statusBadge.classList.replace('text-red-500', 'text-green-400');
            statusBadge.classList.replace('bg-red-500/20', 'bg-green-500/20');
        }

        // --- Referral Link ---
        const refUrl = `${window.location.origin}/register.html?ref=${user.username}`;
        if(document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

    } catch (err) { console.error("Data Fetch Error:", err); }
}

// --- Dashboard Actions ---
async function handleClaim() {
    try {
        const tx = await contract.claimDailyReward(0);
        await tx.wait();
        location.reload();
    } catch (err) { console.error(err); }
}

async function handleCompoundDaily() {
    try {
        const tx = await contract.compoundDailyReward(0);
        await tx.wait();
        location.reload();
    } catch (err) { console.error(err); }
}

async function handleCapitalWithdraw() {
    try {
        const tx = await contract.withdrawPrincipal();
        await tx.wait();
        location.reload();
    } catch (err) { console.error(err); }
}

// Helpers
const format = (val) => ethers.utils.formatUnits(val || 0, 18);
const updateText = (id, val) => { 
    const el = document.getElementById(id);
    if(el) el.innerText = val; 
};

function getRankName(r) {
    const names = ["Inviter", "Promoter", "Leader", "Partner", "Star", "Royal Star", "Crown Star"];
    return names[r] || "N/A";
}

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);
