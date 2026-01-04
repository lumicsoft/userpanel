let provider, signer, contract, usdtContract;

// --- TESTNET CONFIGURATION ---
const CONTRACT_ADDRESS = "YOUR_TESTNET_CONTRACT_ADDRESS"; // Apna Testnet address yahan dalein
const USDT_ADDRESS = "0x337610d27c2425019392024265f210e69503487c"; // BSC Testnet Mock USDT
const TESTNET_CHAIN_ID = 97; // BSC Testnet ID

const CONTRACT_ABI = [
    "function register(string username, string referrerUsername) external",
    "function deposit(uint256 amount) external",
    "function claimDailyReward(uint256 amount) external",
    "function compoundDailyReward(uint256 amount) external",
    "function withdrawPrincipal() external",
    "function getLiveBalance(address uA) view returns (uint256 pendingROI, uint256 pendingCap)",
    "function users(address) view returns (address referrer, string username, bool registered, uint256 joinDate, uint256 totalActiveDeposit, uint256 teamActiveDeposit, uint256 teamTotalDeposit, uint256 totalDeposited, uint256 totalWithdrawn, uint256 totalEarnings)",
    "function usersExtra(address) view returns (uint256 rewardsReferral, uint256 rewardsOnboarding, uint256 rewardsRank, uint256 reserveDailyCapital, uint256 reserveDailyROI, uint256 reserveNetwork, uint32 teamCount, uint32 directsCount, uint32 directsQuali, uint8 rank)",
    "function getContractInfo() view returns (uint256 _launchDate, uint256 _totalRegisteredUsers, uint256 _totalActiveUsers, uint256 _totalDeposited, uint256 _totalWithdrawn)"
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
    
    // Testnet Check
    if (chainId !== TESTNET_CHAIN_ID) {
        alert("Please switch to BSC Testnet (Chain ID 97) in MetaMask!");
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

        // Agar user registered nahi hai toh console mein warn karein
        if (!user.registered) {
            console.warn("User is not registered yet!");
            updateText('total-deposit-display', "Not Registered");
            return;
        }

        updateText('total-deposit-display', `$ ${format(user.totalDeposited)}`);
        updateText('active-deposit', `$ ${format(user.totalActiveDeposit)}`);
        updateText('total-earned', `$ ${format(user.totalEarnings)}`);
        updateText('total-withdrawn', `$ ${format(user.totalWithdrawn)}`);

        const withdrawable = parseFloat(format(live.pendingROI)) + parseFloat(format(live.pendingCap));
        updateText('compounding-balance', `$ ${withdrawable.toFixed(2)}`);

        updateText('team-count', extra.teamCount.toString());
        updateText('direct-count', extra.directsCount.toString());
        updateText('rank-display', getRankName(extra.rank));

        // Referral link using username from contract
        const refUrl = `${window.location.origin}?ref=${user.username}`;
        if(document.getElementById('refURL')) document.getElementById('refURL').value = refUrl;

    } catch (err) { console.error("Data Fetch Error:", err); }
}

// Transaction Functions
async function handleDeposit(amountUSD) {
    try {
        const amount = ethers.utils.parseUnits(amountUSD.toString(), 18);
        const address = await signer.getAddress();
        
        // Check if Registered first
        const user = await contract.users(address);
        if(!user.registered) return alert("Please register first!");

        // Allowance check
        const allowance = await usdtContract.allowance(address, CONTRACT_ADDRESS);
        if (allowance.lt(amount)) {
            const appTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await appTx.wait();
        }

        const tx = await contract.deposit(amount);
        await tx.wait();
        alert("Deposit Successful!");
        location.reload();
    } catch (err) { 
        console.error(err);
        alert("Transaction failed! Check console."); 
    }
}

// Helpers
const format = (val) => ethers.utils.formatUnits(val, 18);
const updateText = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
function getRankName(r) {
    const names = ["Inviter", "Promoter", "Leader", "Partner", "Star", "Royal Star", "Crown Star"];
    return names[r] || "Unknown";
}

function updateNavbar(addr) {
    const btn = document.querySelector('.gold-btn');
    if(btn) btn.innerText = addr.substring(0,6) + "..." + addr.substring(38);
}

window.addEventListener('load', init);