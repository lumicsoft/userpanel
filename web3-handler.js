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
    "function usersExtra(address) view returns (uint256 rewardsReferral, uint256 rewardsOnboarding, uint256 rewardsRank, uint256 reserveDailyCapital, uint256 reserveDailyROI, uint256 reserveNetwork, uint32 teamCount, uint32 directsCount, uint32 directsQuali, uint8 rank)",
    "event Registered(address indexed user, address indexed referrer, string username)",
    "event Deposited(address indexed user, uint256 amount)",
    "event Compounded(address indexed user, uint256 amount)",
    "event RewardClaimed(address indexed user, uint256 amount, string rewardType)"
];

const USDT_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
];

// --- INITIALIZATION ---
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
    
    // Page specific triggers
    if(document.getElementById('team-table-body')) fetchTeamReport(address, 1);
    if(document.getElementById('history-container')) {
        // Default history load
        window.showHistory('deposit'); 
    }
}

// --- DATA FETCHING ---
async function fetchAllData(address) {
    try {
        const [user, extra, live] = await Promise.all([
            contract.users(address),
            contract.usersExtra(address),
            contract.getLiveBalance(address)
        ]);

        if (!user.registered) return;

        updateText('total-deposit-display', `$ ${format(user.totalDeposited)}`);
        updateText('active-deposit', `$ ${format(user.totalActiveDeposit)}`);
        updateText('total-earned', `$ ${format(user.totalEarnings)}`);
        updateText('total-withdrawn', `$ ${format(user.totalWithdrawn)}`);
        updateText('team-count', extra.teamCount.toString());
        updateText('direct-count', extra.directsCount.toString());
        updateText('level-earnings', `$ ${format(extra.rewardsReferral)}`);

        const withdrawable = (parseFloat(format(live.pendingROI)) + parseFloat(format(live.pendingCap))).toFixed(2);
        updateText('withdrawable-display', `$ ${withdrawable}`);
        updateText('compounding-balance', `$ ${withdrawable}`);
        updateText('ref-balance-display', `$ ${withdrawable}`);
        updateText('rank-display', getRankName(extra.rank));

        const refUrl = `${window.location.origin}/register.html?ref=${user.username}`;
        if(document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

    } catch (err) { console.error("Data Fetch Error:", err); }
}

// --- HISTORY LOGIC (NEW) ---
async function fetchBlockchainHistory(type) {
    if (!contract || !signer) return [];
    const address = await signer.getAddress();
    let logs = [];

    try {
        let filter;
        if (type === 'deposit') filter = contract.filters.Deposited(address);
        else if (type === 'compounding') filter = contract.filters.Compounded(address);
        else if (type === 'income') filter = contract.filters.RewardClaimed(address);

        const events = await contract.queryFilter(filter, -10000); // Scans last 10k blocks

        return events.map(e => ({
            date: `Block ${e.blockNumber}`,
            time: "Confirmed",
            amount: format(e.args.amount),
            type: e.args.rewardType || type.toUpperCase(),
            tp: type === 'compounding' ? "0.25%" : "DYNAMIC",
            color: type === 'income' ? 'text-yellow-500' : 'text-gray-400'
        })).reverse();
    } catch (err) {
        console.error("History Error:", err);
        return [];
    }
}

// --- TEAM REPORT ---
async function fetchTeamReport(userAddress, level) {
    const tableBody = document.getElementById('team-table-body');
    if(!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-yellow-500 animate-pulse">Fetching Team Data...</td></tr>`;

    try {
        const filter = contract.filters.Registered(null, userAddress);
        const logs = await contract.queryFilter(filter);

        if(logs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500">No members found</td></tr>`;
            return;
        }

        tableBody.innerHTML = "";
        for (let log of logs) {
            const memberAddr = log.args.user;
            const memberData = await contract.users(memberAddr);
            
            const row = document.createElement('tr');
            row.className = "border-b border-white/5 hover:bg-white/5 transition-all";
            row.innerHTML = `
                <td class="p-4 text-green-400 font-mono">${memberAddr.substring(0,6)}...${memberAddr.substring(38)}</td>
                <td>Level ${level}</td>
                <td>$ ${format(memberData.totalDeposited)}</td>
                <td>$ ${format(memberData.teamTotalDeposit)}</td>
                <td>$ ${format(memberData.totalActiveDeposit)}</td>
                <td class="text-yellow-500">$ 0.00</td>
                <td>${new Date(memberData.joinDate * 1000).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        }
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500">Error loading data</td></tr>`;
    }
}

// --- UTILITIES ---
const format = (val) => ethers.utils.formatUnits(val || 0, 18);
const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
const getRankName = (r) => ["Inviter", "Promoter", "Leader", "Partner", "Star", "Royal Star", "Crown Star"][r] || "NONE (-)";

function loadLevelData(val) {
    signer.getAddress().then(addr => fetchTeamReport(addr, val));
}

// --- ACTIONS ---
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

// Global linking for HTML
window.fetchBlockchainHistory = fetchBlockchainHistory;
window.showHistory = async function(type) {
    const container = document.getElementById('history-container');
    if(!container) return;
    
    // UI selection
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + type).classList.add('active');
    
    container.innerHTML = `<div class="p-10 text-center animate-pulse text-yellow-500">SCANNING BLOCKCHAIN...</div>`;
    
    const logs = await fetchBlockchainHistory(type);
    if(logs.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-gray-500">NO DATA FOUND</div>`;
        return;
    }

    container.innerHTML = logs.map(item => `
        <div class="history-card">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-black ${item.color} uppercase">${item.type}</p>
                    <p class="text-[10px] font-bold text-gray-500 uppercase mt-1">${item.date}</p>
                </div>
                <div class="text-right">
                    <h3 class="text-lg font-black orbitron ${type === 'income' ? 'text-green-400' : 'text-white'}">
                        ${type === 'income' ? '+' : ''}$ ${item.amount}
                    </h3>
                </div>
            </div>
        </div>
    `).join('');
};

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);
