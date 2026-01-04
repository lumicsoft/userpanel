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
    "event Registered(address indexed user, address indexed referrer, string username)" // Event listener ke liye zaroori
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
    
    // Agar referral page par hain, toh team report load karein
    if(document.getElementById('team-table-body')) {
        fetchTeamReport(address, 1);
    }
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

        // Stats update logic
        updateText('total-deposit-display', `$ ${format(user.totalDeposited)}`);
        updateText('active-deposit', `$ ${format(user.totalActiveDeposit)}`);
        updateText('total-earned', `$ ${format(user.totalEarnings)}`);
        updateText('total-withdrawn', `$ ${format(user.totalWithdrawn)}`);
        updateText('team-count', extra.teamCount.toString());
        updateText('direct-count', extra.directsCount.toString());
        updateText('level-earnings', `$ ${format(extra.rewardsReferral)}`); // Example mapping

        const withdrawable = (parseFloat(format(live.pendingROI)) + parseFloat(format(live.pendingCap))).toFixed(2);
        updateText('withdrawable-display', `$ ${withdrawable}`);
        updateText('compounding-balance', `$ ${withdrawable}`);
        updateText('ref-balance-display', `$ ${withdrawable}`);

        updateText('rank-display', getRankName(extra.rank));

        const refUrl = `${window.location.origin}/register.html?ref=${user.username}`;
        if(document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

    } catch (err) { console.error("Data Fetch Error:", err); }
}

// --- TEAM REPORT EVENT LISTENER LOGIC ---
async function fetchTeamReport(userAddress, level) {
    const tableBody = document.getElementById('team-table-body');
    if(!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-yellow-500 animate-pulse">Fetching Team Data from Blockchain...</td></tr>`;

    try {
        // Step 1: Filter "Registered" events where this user is the referrer
        const filter = contract.filters.Registered(null, userAddress);
        const logs = await contract.queryFilter(filter);

        if(logs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">No members found at Level ${level}</td></tr>`;
            return;
        }

        tableBody.innerHTML = ""; // Clear loader

        // Step 2: Loop through events and fetch user details
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
        console.error("Event Fetch Error:", err);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Error loading blockchain data</td></tr>`;
    }
}

// Select box level change handler
function loadLevelData(val) {
    signer.getAddress().then(addr => fetchTeamReport(addr, val));
}

// Actions
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

const format = (val) => ethers.utils.formatUnits(val || 0, 18);
const updateText = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };

function getRankName(r) {
    const names = ["Inviter", "Promoter", "Leader", "Partner", "Star", "Royal Star", "Crown Star"];
    return names[r] || "N/A";
}

function updateNavbar(addr) {
    const btn = document.getElementById('connect-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);
