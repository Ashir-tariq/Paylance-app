// Initialize
let balance = 0;
let transactions = [];
let balanceVisible = true;
let darkMode = false;
let cashbackPoints = 0;
let monthlyBudget = 50000;
// OTP Registration variables
let pendingRegistration = null;
let otpTimerInterval = null;
let expenseCategories = {
    'Shopping': 0,
    'Food': 0,
    'Transport': 0,
    'Bills': 0,
    'Entertainment': 0,
    'Others': 0
};
let financialGoals = [];
let recurringPayments = [];

// Initialize app on load
window.addEventListener('load', function() {
    // Hide splash screen after 2.5 seconds
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    }, 2500);
    
    // Initialize other components
    updateBalanceDisplay();
    loadTransactions();
    updateGreeting();
    updateBiometricButton();
});

// Update biometric button visibility
function updateBiometricButton() {
    const biometricOption = document.querySelector('.biometric-option');
    if (biometricOption) {
        const isEnabled = checkBiometricStatus();
        const isSupported = window.PublicKeyCredential;
        
        if (!isSupported) {
            biometricOption.style.opacity = '0.5';
            biometricOption.style.cursor = 'not-allowed';
        } else if (isEnabled) {
            biometricOption.style.background = 'linear-gradient(135deg, rgba(108, 92, 231, 0.1), rgba(162, 155, 254, 0.1))';
            biometricOption.style.border = '2px solid var(--primary)';
        }
    }
}

// Update greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.querySelector('.greeting');
    
    if (hour < 12) {
        greetingElement.textContent = 'Good Morning';
    } else if (hour < 18) {
        greetingElement.textContent = 'Good Afternoon';
    } else {
        greetingElement.textContent = 'Good Evening';
    }
}

// Login function
function login() {
    const mobile = document.getElementById("mobileNumber").value;
    const mpin = document.getElementById("mpin").value;

    if (!mobile || mobile.length !== 11 || !mobile.startsWith("03")) {
        alert("❌ Please enter a valid mobile number (11 digits starting with 03)!");
        return;
    }
    
    if (!mpin || mpin.length !== 5) {
        alert("❌ Please enter a valid 5-digit PIN!");
        return;
    }
    
    // Get registered accounts from localStorage
    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    
    // Find account with matching mobile and PIN
    const account = accounts.find(acc => acc.mobile === mobile && acc.pin === mpin);
    
    if (account) {
        // Successful login
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        
        const maskedNumber = mobile.substring(0, 4) + "-" + "X".repeat(7);
        document.getElementById("accountNumber").textContent = maskedNumber;
        document.getElementById("userName").textContent = account.name;
        
        // Update greeting
        const greetingElement = document.querySelector('.greeting');
        const hour = new Date().getHours();
        if (hour < 12) {
            greetingElement.textContent = 'Good Morning';
        } else if (hour < 18) {
            greetingElement.textContent = 'Good Afternoon';
        } else {
            greetingElement.textContent = 'Good Evening';
        }
        
        // Save current user
        localStorage.setItem("nexpay_current_user", mobile);
        
        // Load user's balance and transactions
        loadUserData(mobile);
        
        // Save mobile number for biometric if enabled
        if (checkBiometricStatus()) {
            localStorage.setItem("nexpay_biometric_mobile", mobile);
        }
        
        updateBalanceDisplay();
        loadTransactions();
    } else {
        alert("❌ Invalid mobile number or PIN!\n\nPlease check your credentials or create a new account.");
    }
}

// Load user-specific data
function loadUserData(mobile) {
    const userBalance = localStorage.getItem(`nexpay_balance_${mobile}`);
    const userTransactions = localStorage.getItem(`nexpay_transactions_${mobile}`);
    
    if (userBalance) {
        balance = parseFloat(userBalance);
    } else {
        balance = 25000; // Default starting balance for new accounts
    }
    
    if (userTransactions) {
        transactions = JSON.parse(userTransactions);
    } else {
        transactions = [];
    }
}

// Biometric login
function biometricLogin() {
    const biometricOption = document.querySelector('.biometric-option');
    
    // Check if biometric is enabled in localStorage
    const biometricEnabled = localStorage.getItem("nexpay_biometric_enabled");
    const savedMobile = localStorage.getItem("nexpay_biometric_mobile");
    
    if (biometricEnabled !== "true") {
        alert("🔒 Biometric Not Enabled\n\nTo enable biometric login:\n1. Login with mobile & PIN\n2. Go to Profile > Security & Privacy\n3. Toggle 'Biometric Login' ON");
        return;
    }
    
    if (!savedMobile) {
        alert("No saved credentials found!\nPlease login normally first.");
        return;
    }
    
    // Add authenticating state
    biometricOption.classList.add('authenticating');
    biometricOption.innerHTML = '<i class="fas fa-fingerprint"></i><span>Authenticating...</span>';
    
    // Simulate biometric scan delay (1.5 seconds)
    setTimeout(() => {
        // Simulate successful authentication
        biometricOption.classList.remove('authenticating');
        biometricOption.classList.add('success');
        biometricOption.innerHTML = '<i class="fas fa-check-circle"></i><span>Authenticated!</span>';
        
        // Auto-fill credentials
        document.getElementById("mobileNumber").value = savedMobile;
        document.getElementById("mpin").value = "12345";
        
        // Auto-login after short delay
        setTimeout(() => {
            login();
            
            // Reset biometric button after login
            setTimeout(() => {
                biometricOption.classList.remove('success');
                biometricOption.innerHTML = '<i class="fas fa-fingerprint"></i><span>Login with Biometric</span>';
            }, 500);
        }, 800);
    }, 1500);
}

// Show biometric success animation
function showBiometricSuccess() {
    const biometricOption = document.querySelector('.biometric-option');
    if (biometricOption) {
        biometricOption.style.background = 'linear-gradient(135deg, #00B894, #55EFC4)';
        biometricOption.innerHTML = '<i class="fas fa-check-circle"></i><span>Authenticated!</span>';
        
        setTimeout(() => {
            biometricOption.style.background = '';
            biometricOption.innerHTML = '<i class="fas fa-fingerprint"></i><span>Login with Biometric</span>';
        }, 2000);
    }
}

// Authenticate with biometric (Advanced implementation for supported browsers)
async function authenticateWithBiometric() {
    try {
        // Check if Web Authentication API is available
        if (!window.PublicKeyCredential) {
            throw new Error("Web Authentication API not supported");
        }
        
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        if (!available) {
            throw new Error("Platform authenticator not available");
        }
        
        // In a real implementation, you would:
        // 1. Get challenge from server
        // 2. Call navigator.credentials.get() with publicKey options
        // 3. Send response to server for verification
        
        return true;
        
    } catch (error) {
        console.error("Biometric authentication error:", error);
        return false;
    }
}

// Enable biometric authentication
function enableBiometric() {
    // Save biometric preference
    localStorage.setItem("nexpay_biometric_enabled", "true");
    
    // Get current mobile number from input or use demo number
    const mobile = document.getElementById("mobileNumber")?.value || "03001234567";
    localStorage.setItem("nexpay_biometric_mobile", mobile);
    
    return true;
}

// Disable biometric authentication
function disableBiometric() {
    localStorage.setItem("nexpay_biometric_enabled", "false");
    localStorage.removeItem("nexpay_biometric_mobile");
}

// Check biometric status
function checkBiometricStatus() {
    const enabled = localStorage.getItem("nexpay_biometric_enabled");
    return enabled === "true";
}

// Toggle password visibility
function togglePassword() {
    const mpinInput = document.getElementById("mpin");
    const icon = document.querySelector(".toggle-password");
    
    if (mpinInput.type === "password") {
        mpinInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        mpinInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// Toggle balance visibility
function toggleBalance() {
    const balanceElement = document.getElementById("balance");
    const icon = document.querySelector(".balance-toggle");
    
    balanceVisible = !balanceVisible;
    
    if (balanceVisible) {
        balanceElement.textContent = formatCurrency(balance);
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        balanceElement.textContent = "****";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

// Format currency
function formatCurrency(amount) {
    return amount.toLocaleString('en-PK');
}

// Update balance display
function updateBalanceDisplay() {
    const balanceElement = document.getElementById("balance");
    if (balanceVisible) {
        balanceElement.textContent = formatCurrency(balance);
    }
    
    // Save balance for current user
    const currentUser = localStorage.getItem("nexpay_current_user");
    if (currentUser) {
        localStorage.setItem(`nexpay_balance_${currentUser}`, balance);
    }
}

// Show notifications
function showNotifications() {
    alert("Notifications:\n• Payment received: Rs 5,000\n• Bill reminder: Electricity due\n• New feature available!");
}

// Show QR Code
function showQRCode() {
    alert("QR Code Scanner would open here!");
}

// Show profile
function showProfile() {
    showPage('profile');
}

// Update profile display with current user data
function updateProfileDisplay() {
    const currentUser = localStorage.getItem("nexpay_current_user");
    
    if (!currentUser) {
        return;
    }
    
    // Get user account data
    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    const userAccount = accounts.find(acc => acc.mobile === currentUser);
    
    if (userAccount) {
        // Update profile name
        const profileNameElement = document.getElementById("profileName");
        if (profileNameElement) {
            profileNameElement.textContent = userAccount.name;
        }
        
        // Update profile phone with formatting
        const profilePhoneElement = document.getElementById("profilePhone");
        if (profilePhoneElement) {
            const formattedPhone = formatPhoneNumber(currentUser);
            profilePhoneElement.textContent = formattedPhone;
        }
        
        // Update transaction count
        const userTransactions = JSON.parse(localStorage.getItem(`nexpay_transactions_${currentUser}`)) || [];
        const transactionCountElement = document.querySelector('.profile-stats .stat-box:first-child .stat-number');
        if (transactionCountElement) {
            transactionCountElement.textContent = userTransactions.length;
        }
    }
}

// Update card holder names with current user
function updateCardHolderNames() {
    const currentUser = localStorage.getItem("nexpay_current_user");
    
    if (!currentUser) {
        return;
    }
    
    // Get user account data
    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    const userAccount = accounts.find(acc => acc.mobile === currentUser);
    
    if (userAccount) {
        // Update all card holder names
        const cardHolderElements = document.querySelectorAll('.card-holder-name');
        cardHolderElements.forEach(element => {
            element.textContent = userAccount.name.toUpperCase();
        });
    }
}

// Format phone number for display
function formatPhoneNumber(mobile) {
    // Format: +92 300 1234567
    if (mobile.startsWith('03')) {
        return '+92 ' + mobile.substring(1, 4) + ' ' + mobile.substring(4);
    }
    return mobile;
}

// Show page navigation
function showPage(pageName) {
    // Hide all pages
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('cardsPage').style.display = 'none';
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('analyticsPage').style.display = 'none';
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page and activate nav item
    switch(pageName) {
        case 'home':
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('navHome').classList.add('active');
            break;
        case 'analytics':
            document.getElementById('analyticsPage').style.display = 'block';
            document.getElementById('navAnalytics').classList.add('active');
            break;
        case 'cards':
            document.getElementById('cardsPage').style.display = 'block';
            document.getElementById('navCards').classList.add('active');
            updateCardHolderNames(); // Update card holder names
            break;
        case 'profile':
            document.getElementById('profilePage').style.display = 'block';
            document.getElementById('navProfile').classList.add('active');
            updateProfileDisplay(); // Update profile with current user data
            break;
    }
}

// Card actions
function cardAction(action) {
    switch(action) {
        case 'freeze':
            showModal('freezeCard');
            break;
        case 'limit':
            showModal('cardLimit');
            break;
        case 'details':
            showModal('cardDetails');
            break;
    }
}

// Analytics functions
function changePeriod(period) {
    // Remove active class from all period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Update analytics data based on period
    showSuccessAnimation(`Showing ${period} analytics`);
}

function downloadReport() {
    showSuccessAnimation('Downloading analytics report...');
}

// Logout function
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        // Clear current user
        localStorage.removeItem("nexpay_current_user");
        
        // Hide all pages
        document.getElementById("dashboard").style.display = "none";
        document.getElementById("cardsPage").style.display = "none";
        document.getElementById("profilePage").style.display = "none";
        document.getElementById("analyticsPage").style.display = "none";
        
        // Show login page
        document.getElementById("loginPage").style.display = "flex";
        
        // Clear login fields
        document.getElementById("mobileNumber").value = "";
        document.getElementById("mpin").value = "";
        
        // Reset balance and transactions
        balance = 0;
        transactions = [];
    }
}

// Show modal for transactions
function showModal(type) {
    const modal = document.getElementById("transactionModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    
    let content = "";
    
    switch(type) {
        case "sendMoney":
            modalTitle.textContent = "Send Money";
            content = `
                <div class="form-group">
                    <label>Recipient Mobile Number</label>
                    <input type="tel" id="recipientNumber" placeholder="03XXXXXXXXX" maxlength="11">
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" id="sendAmount" placeholder="Enter amount">
                </div>
                <div class="form-group">
                    <label>Purpose (Optional)</label>
                    <input type="text" id="sendPurpose" placeholder="e.g., Payment, Gift">
                </div>
                <button class="btn-submit" onclick="processSendMoney()">
                    <i class="fas fa-paper-plane"></i> Send Money
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "requestMoney":
            modalTitle.textContent = "Request Money";
            content = `
                <div class="form-group">
                    <label>From Mobile Number</label>
                    <input type="tel" id="requestNumber" placeholder="03XXXXXXXXX" maxlength="11">
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" id="requestAmount" placeholder="Enter amount">
                </div>
                <div class="form-group">
                    <label>Reason</label>
                    <input type="text" id="requestReason" placeholder="Why are you requesting?">
                </div>
                <button class="btn-submit" onclick="processRequestMoney()">
                    <i class="fas fa-hand-holding-usd"></i> Send Request
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "mobileLoad":
            modalTitle.textContent = "Mobile Recharge";
            content = `
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="loadNumber" placeholder="03XXXXXXXXX" maxlength="11">
                </div>
                <div class="form-group">
                    <label>Select Package</label>
                    <select id="loadPackage">
                        <option value="100">Rs 100 - Daily Package</option>
                        <option value="200">Rs 200 - Weekly Package</option>
                        <option value="500">Rs 500 - Monthly Package</option>
                        <option value="1000">Rs 1000 - Premium Package</option>
                    </select>
                </div>
                <button class="btn-submit" onclick="processMobileLoad()">
                    <i class="fas fa-mobile-alt"></i> Recharge Now
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "billPayment":
            modalTitle.textContent = "Pay Bill";
            content = `
                <div class="form-group">
                    <label>Bill Type</label>
                    <select id="billType">
                        <option value="Electricity">Electricity Bill</option>
                        <option value="Gas">Gas Bill</option>
                        <option value="Internet">Internet Bill</option>
                        <option value="Water">Water Bill</option>
                        <option value="Education">Education Fee</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Consumer Number</label>
                    <input type="number" id="consumerNumber" placeholder="Enter consumer number" inputmode="numeric" pattern="[0-9]*">
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" id="billAmount" placeholder="Enter amount">
                </div>
                <button class="btn-submit" onclick="processBillPayment()">
                    <i class="fas fa-check-circle"></i> Pay Bill
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "addMoney":
            modalTitle.textContent = "Add Money";
            content = `
                <div class="form-group">
                    <label>Select Method</label>
                    <select id="addMethod">
                        <option value="Bank">Bank Transfer</option>
                        <option value="Card">Debit/Credit Card</option>
                        <option value="Agent">NexPay Agent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" id="addAmount" placeholder="Enter amount">
                </div>
                <button class="btn-submit" onclick="processAddMoney()">
                    <i class="fas fa-plus-circle"></i> Add Money
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "investment":
            modalTitle.textContent = "Investment Plans";
            content = `
                <div class="form-group">
                    <label>Select Plan</label>
                    <select id="investmentPlan">
                        <option value="low">Low Risk - 5% Annual Return</option>
                        <option value="medium">Medium Risk - 10% Annual Return</option>
                        <option value="high">High Risk - 15% Annual Return</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Investment Amount (Rs)</label>
                    <input type="number" id="investAmount" placeholder="Minimum Rs 5,000">
                </div>
                <button class="btn-submit" onclick="alert('Investment feature coming soon!')">
                    <i class="fas fa-chart-line"></i> Invest Now
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "savings":
            modalTitle.textContent = "Savings Account";
            content = `
                <div class="form-group">
                    <label>Savings Goal</label>
                    <input type="text" id="savingsGoal" placeholder="e.g., Emergency Fund">
                </div>
                <div class="form-group">
                    <label>Target Amount (Rs)</label>
                    <input type="number" id="targetAmount" placeholder="Enter target">
                </div>
                <div class="form-group">
                    <label>Monthly Deposit (Rs)</label>
                    <input type="number" id="monthlyDeposit" placeholder="Enter amount">
                </div>
                <button class="btn-submit" onclick="alert('Savings feature coming soon!')">
                    <i class="fas fa-piggy-bank"></i> Create Savings
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "insurance":
            modalTitle.textContent = "Insurance Plans";
            content = `
                <div class="form-group">
                    <label>Insurance Type</label>
                    <select id="insuranceType">
                        <option value="health">Health Insurance</option>
                        <option value="life">Life Insurance</option>
                        <option value="vehicle">Vehicle Insurance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Coverage Amount (Rs)</label>
                    <input type="number" id="coverageAmount" placeholder="Enter coverage">
                </div>
                <button class="btn-submit" onclick="alert('Insurance feature coming soon!')">
                    <i class="fas fa-shield-alt"></i> Get Quote
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "splitBill":
            modalTitle.textContent = "Split Bill";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-receipt" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Split expenses with friends</p>
                </div>
                <div class="form-group">
                    <label>Total Amount (Rs)</label>
                    <input type="number" id="splitAmount" placeholder="Enter total amount">
                </div>
                <div class="form-group">
                    <label>Number of People</label>
                    <input type="number" id="splitPeople" placeholder="How many people?" min="2" max="10" value="2">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="splitDescription" placeholder="e.g., Dinner, Movie tickets">
                </div>
                <button class="btn-submit" onclick="processSplitBill()">
                    <i class="fas fa-calculator"></i> Calculate Split
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "rewards":
            modalTitle.textContent = "Cashback & Rewards";
            const points = cashbackPoints;
            const redeemable = Math.floor(points / 100) * 10;
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-gift" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--primary); margin-bottom: 10px;">${points} Points</h3>
                    <p style="color: #666; margin-bottom: 20px;">You can redeem Rs ${redeemable}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h4 style="margin-bottom: 10px;">How to Earn Points:</h4>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                            Send Money: 1 point per Rs 100
                        </li>
                        <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                            Bill Payment: 2 points per Rs 100
                        </li>
                        <li style="padding: 8px 0;">
                            <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                            Mobile Recharge: 1.5 points per Rs 100
                        </li>
                    </ul>
                </div>
                <button class="btn-submit" onclick="redeemCashback()" ${points < 100 ? 'disabled' : ''}>
                    <i class="fas fa-gift"></i> Redeem Rs ${redeemable}
                </button>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "budgetPlanner":
            modalTitle.textContent = "Budget Planner";
            content = `
                <div class="form-group">
                    <label>Monthly Budget (Rs)</label>
                    <input type="number" id="monthlyBudgetInput" placeholder="Enter monthly budget" value="${monthlyBudget}">
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <h4 style="margin-bottom: 10px;">Current Month:</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>Total Spent:</span>
                        <span style="font-weight: 700; color: var(--danger);">Rs ${calculateMonthlySpent()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Remaining:</span>
                        <span style="font-weight: 700; color: var(--success);">Rs ${monthlyBudget - calculateMonthlySpent()}</span>
                    </div>
                </div>
                <button class="btn-submit" onclick="updateBudget()">
                    <i class="fas fa-save"></i> Save Budget
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "addGoal":
            modalTitle.textContent = "Add Financial Goal";
            content = `
                <div class="form-group">
                    <label>Goal Name</label>
                    <input type="text" id="goalName" placeholder="e.g., New Phone, Vacation">
                </div>
                <div class="form-group">
                    <label>Target Amount (Rs)</label>
                    <input type="number" id="goalTarget" placeholder="Enter target amount">
                </div>
                <div class="form-group">
                    <label>Current Savings (Rs)</label>
                    <input type="number" id="goalCurrent" placeholder="Amount saved so far" value="0">
                </div>
                <div class="form-group">
                    <label>Target Date</label>
                    <input type="date" id="goalDate">
                </div>
                <button class="btn-submit" onclick="addFinancialGoal()">
                    <i class="fas fa-plus"></i> Add Goal
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "currencyConverter":
            modalTitle.textContent = "Currency Converter";
            content = `
                <div class="form-group">
                    <label>Amount (PKR)</label>
                    <input type="number" id="convertAmount" placeholder="Enter amount in PKR" oninput="convertCurrency()">
                </div>
                <div class="form-group">
                    <label>Convert To</label>
                    <select id="convertTo" onchange="convertCurrency()">
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="AED">UAE Dirham (AED)</option>
                        <option value="SAR">Saudi Riyal (SAR)</option>
                        <option value="INR">Indian Rupee (INR)</option>
                    </select>
                </div>
                <div class="converter-result" id="converterResult">
                    <div class="converter-amount">0.00</div>
                    <div class="converter-rate">Exchange rate will appear here</div>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "expenseTracker":
            modalTitle.textContent = "Expense Tracker";
            content = `
                <div style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 15px;">Expenses by Category</h4>
                    ${Object.keys(expenseCategories).map(category => `
                        <div class="expense-category">
                            <div class="expense-category-icon" style="background: ${getCategoryColor(category)};">
                                <i class="fas ${getCategoryIcon(category)}"></i>
                            </div>
                            <div class="expense-category-info">
                                <div class="expense-category-name">${category}</div>
                            </div>
                            <div class="expense-category-amount">Rs ${expenseCategories[category]}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "recurringPayments":
            modalTitle.textContent = "Recurring Payments";
            content = `
                <div style="margin-bottom: 20px;">
                    ${recurringPayments.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-redo"></i>
                            <p>No recurring payments</p>
                            <span>Set up automatic payments</span>
                        </div>
                    ` : recurringPayments.map((payment, index) => `
                        <div class="recurring-item">
                            <div class="recurring-info">
                                <div class="recurring-title">${payment.title}</div>
                                <div class="recurring-schedule">${payment.schedule}</div>
                            </div>
                            <div class="recurring-amount">Rs ${payment.amount}</div>
                            <div class="recurring-toggle">
                                <label class="switch">
                                    <input type="checkbox" ${payment.active ? 'checked' : ''} onchange="toggleRecurring(${index})">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-submit" onclick="showModal('addRecurring')">
                    <i class="fas fa-plus"></i> Add Recurring Payment
                </button>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "addRecurring":
            modalTitle.textContent = "Add Recurring Payment";
            content = `
                <div class="form-group">
                    <label>Payment Title</label>
                    <input type="text" id="recurringTitle" placeholder="e.g., Netflix Subscription">
                </div>
                <div class="form-group">
                    <label>Amount (Rs)</label>
                    <input type="number" id="recurringAmount" placeholder="Enter amount">
                </div>
                <div class="form-group">
                    <label>Frequency</label>
                    <select id="recurringFrequency">
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly" selected>Monthly</option>
                        <option value="Yearly">Yearly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" id="recurringDate">
                </div>
                <button class="btn-submit" onclick="addRecurringPayment()">
                    <i class="fas fa-plus"></i> Add Payment
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "nearbyATM":
            modalTitle.textContent = "Nearby ATMs & Agents";
            content = `
                <div class="map-container">
                    <div class="map-placeholder">
                        <i class="fas fa-map-marked-alt"></i>
                        <p>Map View</p>
                        <small>Enable location to see nearby ATMs</small>
                    </div>
                </div>
                <div class="atm-list">
                    <div class="atm-item" onclick="alert('Navigate to this location')">
                        <div class="atm-icon">
                            <i class="fas fa-university"></i>
                        </div>
                        <div class="atm-details">
                            <div class="atm-name">HBL ATM - Main Branch</div>
                            <div class="atm-address">Blue Area, Islamabad</div>
                        </div>
                        <div class="atm-distance">1.2 km</div>
                    </div>
                    <div class="atm-item" onclick="alert('Navigate to this location')">
                        <div class="atm-icon">
                            <i class="fas fa-store"></i>
                        </div>
                        <div class="atm-details">
                            <div class="atm-name">NexPay Agent - Jinnah Super</div>
                            <div class="atm-address">Jinnah Super Market, F-7</div>
                        </div>
                        <div class="atm-distance">2.5 km</div>
                    </div>
                    <div class="atm-item" onclick="alert('Navigate to this location')">
                        <div class="atm-icon">
                            <i class="fas fa-university"></i>
                        </div>
                        <div class="atm-details">
                            <div class="atm-name">MCB ATM - F-6 Markaz</div>
                            <div class="atm-address">F-6 Markaz, Islamabad</div>
                        </div>
                        <div class="atm-distance">3.1 km</div>
                    </div>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "searchTransactions":
            modalTitle.textContent = "Search Transactions";
            content = `
                <div class="form-group">
                    <label>Search</label>
                    <input type="text" id="searchQuery" placeholder="Search by name, amount, or date" oninput="filterTransactions()">
                </div>
                <div class="form-group">
                    <label>Filter by Type</label>
                    <select id="filterType" onchange="filterTransactions()">
                        <option value="all">All Transactions</option>
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                        <option value="bill">Bill Payments</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date Range</label>
                    <input type="date" id="filterDateFrom" onchange="filterTransactions()">
                    <input type="date" id="filterDateTo" onchange="filterTransactions()" style="margin-top: 10px;">
                </div>
                <div id="filteredTransactions" class="transaction-list" style="max-height: 300px; overflow-y: auto;">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>Start searching</p>
                    </div>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "scanQR":
            modalTitle.textContent = "Scan QR Code";
            content = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-qrcode" style="font-size: 80px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Position QR code within the frame</p>
                    <button class="btn-submit" onclick="alert('QR Scanner would activate camera here!')">
                        <i class="fas fa-camera"></i> Open Camera
                    </button>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "freezeCard":
            modalTitle.textContent = "Freeze Card";
            content = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-snowflake" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Temporarily freeze your card to prevent unauthorized transactions</p>
                    <div class="form-group">
                        <label>Select Card</label>
                        <select id="cardSelect">
                            <option value="4532">Visa **** 4532</option>
                            <option value="8721">Mastercard **** 8721</option>
                        </select>
                    </div>
                </div>
                <button class="btn-submit" onclick="processCardFreeze()">
                    <i class="fas fa-snowflake"></i> Freeze Card
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "cardLimit":
            modalTitle.textContent = "Set Card Limit";
            content = `
                <div class="form-group">
                    <label>Select Card</label>
                    <select id="limitCardSelect">
                        <option value="4532">Visa **** 4532</option>
                        <option value="8721">Mastercard **** 8721</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Daily Limit (Rs)</label>
                    <input type="number" id="dailyLimit" placeholder="Enter daily limit" value="50000">
                </div>
                <div class="form-group">
                    <label>Monthly Limit (Rs)</label>
                    <input type="number" id="monthlyLimit" placeholder="Enter monthly limit" value="500000">
                </div>
                <button class="btn-submit" onclick="processCardLimit()">
                    <i class="fas fa-check"></i> Update Limit
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "cardDetails":
            modalTitle.textContent = "Card Details";
            content = `
                <div class="form-group">
                    <label>Select Card</label>
                    <select id="detailsCardSelect" onchange="showCardDetails()">
                        <option value="4532">Visa **** 4532</option>
                        <option value="8721">Mastercard **** 8721</option>
                    </select>
                </div>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin: 20px 0;">
                    <div style="margin-bottom: 15px;">
                        <span style="color: #999; font-size: 12px; display: block; margin-bottom: 5px;">Card Number</span>
                        <span style="font-size: 16px; font-weight: 600;">5234 8765 4321 4532</span>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <span style="color: #999; font-size: 12px; display: block; margin-bottom: 5px;">CVV</span>
                        <span style="font-size: 16px; font-weight: 600;">***</span>
                        <i class="fas fa-eye" style="margin-left: 10px; cursor: pointer; color: var(--primary);"></i>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <span style="color: #999; font-size: 12px; display: block; margin-bottom: 5px;">Expiry</span>
                            <span style="font-size: 16px; font-weight: 600;">12/25</span>
                        </div>
                        <div>
                            <span style="color: #999; font-size: 12px; display: block; margin-bottom: 5px;">Status</span>
                            <span style="font-size: 14px; font-weight: 600; color: var(--success);">Active</span>
                        </div>
                    </div>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "addCard":
            modalTitle.textContent = "Add New Card";
            content = `
                <div class="form-group">
                    <label>Card Type</label>
                    <select id="cardType">
                        <option value="virtual">Virtual Card</option>
                        <option value="physical">Physical Card</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Card Name</label>
                    <input type="text" id="cardName" placeholder="e.g., Shopping Card">
                </div>
                <div class="form-group">
                    <label>Card Design</label>
                    <select id="cardDesign">
                        <option value="purple">Purple Gradient</option>
                        <option value="blue">Blue Gradient</option>
                        <option value="pink">Pink Gradient</option>
                    </select>
                </div>
                <button class="btn-submit" onclick="processAddCard()">
                    <i class="fas fa-plus"></i> Create Card
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "personalInfo":
            modalTitle.textContent = "Personal Information";
            
            // Get current user data
            const currentUserMobile = localStorage.getItem("nexpay_current_user");
            const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
            const currentUserAccount = accounts.find(acc => acc.mobile === currentUserMobile);
            
            const userName = currentUserAccount ? currentUserAccount.name : "User";
            const userEmail = currentUserAccount ? currentUserAccount.email : "";
            const userCnic = currentUserAccount ? currentUserAccount.cnic : "";
            
            content = `
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="fullName" placeholder="Enter full name" value="${userName}">
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="profileMobile" placeholder="Mobile number" value="${currentUserMobile || ''}" readonly style="background: #f5f5f5; cursor: not-allowed;">
                    <small style="color: #999; font-size: 12px; display: block; margin-top: 5px;">Mobile number cannot be changed</small>
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="email" placeholder="Enter email" value="${userEmail}">
                </div>
                <div class="form-group">
                    <label>CNIC Number</label>
                    <input type="text" id="profileCnic" placeholder="CNIC" value="${userCnic}" readonly style="background: #f5f5f5; cursor: not-allowed;">
                    <small style="color: #999; font-size: 12px; display: block; margin-top: 5px;">CNIC cannot be changed</small>
                </div>
                <button class="btn-submit" onclick="updatePersonalInfo()">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "security":
            modalTitle.textContent = "Security & Privacy";
            const biometricChecked = checkBiometricStatus() ? 'checked' : '';
            const twoFactorChecked = localStorage.getItem("nexpay_2fa_enabled") === "true" ? 'checked' : '';
            content = `
                <div class="form-group">
                    <label>Change PIN</label>
                    <input type="password" id="currentPin" placeholder="Current PIN (12345)" maxlength="5">
                    <input type="password" id="newPin" placeholder="New PIN (5 digits)" maxlength="5" style="margin-top: 10px;">
                    <input type="password" id="confirmPin" placeholder="Confirm New PIN" maxlength="5" style="margin-top: 10px;">
                </div>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <span style="font-weight: 600; display: block; margin-bottom: 3px;">Biometric Login</span>
                        <span style="font-size: 12px; color: #999;">Use fingerprint/face to login</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="biometricToggle" ${biometricChecked} onchange="toggleBiometric(this)">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px;">
                    <div style="flex: 1;">
                        <span style="font-weight: 600; display: block; margin-bottom: 3px;">Two-Factor Authentication</span>
                        <span style="font-size: 12px; color: #999;">Extra security layer via SMS</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="twoFactorToggle" ${twoFactorChecked} onchange="toggle2FA(this)">
                        <span class="slider"></span>
                    </label>
                </div>
                <button class="btn-submit" onclick="updateSecurity()">
                    <i class="fas fa-shield-alt"></i> Update Security
                </button>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "notifications":
            modalTitle.textContent = "Notification Settings";
            content = `
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <div>
                        <span style="font-weight: 600; display: block; margin-bottom: 3px;">Transaction Alerts</span>
                        <span style="font-size: 12px; color: #999;">Get notified for all transactions</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <div>
                        <span style="font-weight: 600; display: block; margin-bottom: 3px;">Payment Reminders</span>
                        <span style="font-size: 12px; color: #999;">Bill payment reminders</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <div>
                        <span style="font-weight: 600; display: block; margin-bottom: 3px;">Promotional Offers</span>
                        <span style="font-size: 12px; color: #999;">Special deals and offers</span>
                    </div>
                    <label class="switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                    </label>
                </div>
                <button class="btn-submit" onclick="updateNotifications()">
                    <i class="fas fa-bell"></i> Save Preferences
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "linkedAccounts":
            modalTitle.textContent = "Linked Accounts";
            content = `
                <div style="margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-university" style="font-size: 24px; color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <span style="font-weight: 600; display: block;">HBL Bank</span>
                                <span style="font-size: 12px; color: #999;">Account: ****1234</span>
                            </div>
                            <button style="background: var(--danger); color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">Remove</button>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-credit-card" style="font-size: 24px; color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <span style="font-weight: 600; display: block;">Visa Card</span>
                                <span style="font-size: 12px; color: #999;">Card: ****5678</span>
                            </div>
                            <button style="background: var(--danger); color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer;">Remove</button>
                        </div>
                    </div>
                </div>
                <button class="btn-submit" onclick="alert('Add new account feature coming soon!')">
                    <i class="fas fa-plus"></i> Link New Account
                </button>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "referral":
            modalTitle.textContent = "Refer & Earn";
            content = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-gift" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">Earn Rs 500 per Referral!</h3>
                    <p style="color: #666; margin-bottom: 20px;">Share your referral code with friends and family</p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin-bottom: 20px;">
                        <span style="font-size: 12px; color: #999; display: block; margin-bottom: 5px;">Your Referral Code</span>
                        <span style="font-size: 24px; font-weight: 700; color: var(--primary); letter-spacing: 2px;">NEXPAY2024</span>
                    </div>
                    <button class="btn-submit" onclick="copyReferralCode()">
                        <i class="fas fa-copy"></i> Copy Code
                    </button>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "help":
            modalTitle.textContent = "Help & Support";
            content = `
                <div style="margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-question-circle" style="font-size: 24px; color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <span style="font-weight: 600; display: block;">FAQs</span>
                                <span style="font-size: 12px; color: #999;">Frequently asked questions</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-phone" style="font-size: 24px; color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <span style="font-weight: 600; display: block;">Call Support</span>
                                <span style="font-size: 12px; color: #999;">+92 300 1234567</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-envelope" style="font-size: 24px; color: var(--primary);"></i>
                            <div style="flex: 1;">
                                <span style="font-weight: 600; display: block;">Email Support</span>
                                <span style="font-size: 12px; color: #999;">support@nexpay.com</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                        </div>
                    </div>
                </div>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "settings":
            modalTitle.textContent = "Settings";
            content = `
                <div style="margin-bottom: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <span style="font-weight: 600; display: block; margin-bottom: 10px;">Language</span>
                        <select style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 10px;">
                            <option>English</option>
                            <option>Urdu</option>
                        </select>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <span style="font-weight: 600; display: block; margin-bottom: 10px;">Currency</span>
                        <select style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 10px;">
                            <option>PKR - Pakistani Rupee</option>
                            <option>USD - US Dollar</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <span style="font-weight: 600;">Dark Mode</span>
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <button class="btn-submit" onclick="updateSettings()">
                    <i class="fas fa-save"></i> Save Settings
                </button>
                <button class="btn-cancel" onclick="closeModal()">Close</button>
            `;
            break;
            
        case "forgotPin":
            modalTitle.textContent = "Forgot PIN?";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-lock" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Don't worry! We'll help you reset your PIN.</p>
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="forgotMobile" placeholder="Enter your mobile number" maxlength="11">
                </div>
                <div class="form-group">
                    <label>CNIC Number</label>
                    <input type="text" id="forgotCnic" placeholder="Enter CNIC (without dashes)" maxlength="13">
                </div>
                <div class="form-group">
                    <label>Date of Birth</label>
                    <input type="date" id="forgotDob">
                </div>
                <button class="btn-submit" onclick="processForgotPin()">
                    <i class="fas fa-paper-plane"></i> Send Reset Code
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "verifyOtp":
            modalTitle.textContent = "Verify OTP";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-mobile-alt" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 10px;">We've sent a 6-digit code to</p>
                    <p style="font-weight: 600; color: var(--dark); margin-bottom: 20px;" id="otpMobile">03XX-XXXXXXX</p>
                </div>
                <div style="background: #d1ecf1; padding: 12px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #0dcaf0;">
                    <i class="fas fa-info-circle" style="color: #0dcaf0; margin-right: 8px;"></i>
                    <span style="font-size: 13px; color: #055160;">
                        <strong>DEMO MODE:</strong> The OTP was shown in the previous alert message. 
                        In production, it would be sent via SMS.
                    </span>
                </div>
                <div class="form-group">
                    <label>Enter OTP Code</label>
                    <input type="text" id="otpCode" placeholder="Enter 6-digit code" maxlength="6" inputmode="numeric" pattern="[0-9]*" style="text-align: center; font-size: 24px; letter-spacing: 8px; font-weight: 600;">
                </div>
                <div style="text-align: center; margin: 15px 0;">
                    <span style="color: #999; font-size: 14px;">Didn't receive code? </span>
                    <a href="#" onclick="event.preventDefault(); resendOtp()" style="color: var(--primary); font-weight: 600; text-decoration: none;">Resend OTP</a>
                </div>
                <button class="btn-submit" onclick="verifyOtp()">
                    <i class="fas fa-check"></i> Verify Code
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "verifyRegistration":
            modalTitle.textContent = "Verify Your Account";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-mobile-alt" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 10px;">We've sent a 6-digit code to</p>
                    <p style="font-weight: 600; color: var(--dark); margin-bottom: 20px;" id="otpMobile">03XX-XXXXXXX</p>
                </div>
                <div style="background: #d1ecf1; padding: 12px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #0dcaf0;">
                    <i class="fas fa-info-circle" style="color: #0dcaf0; margin-right: 8px;"></i>
                    <span style="font-size: 13px; color: #055160;">
                        <strong>DEMO MODE:</strong> The OTP was shown in the previous alert message.
                    </span>
                </div>
                <div class="form-group">
                    <label>Enter OTP Code</label>
                    <input type="text" id="regOtpCode" placeholder="Enter 6-digit code" maxlength="6" inputmode="numeric" pattern="[0-9]*" style="text-align: center; font-size: 24px; letter-spacing: 8px; font-weight: 600;">
                </div>
                <div style="text-align: center; margin: 15px 0;">
                    <span style="color: #999; font-size: 14px;">Didn't receive code? </span>
                    <a href="#" onclick="event.preventDefault(); resendRegistrationOtp()" style="color: var(--primary); font-weight: 600; text-decoration: none;">Resend OTP</a>
                </div>
                <button class="btn-submit" onclick="completeRegistration()">
                    <i class="fas fa-check"></i> Verify & Create Account
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "resetPin":
            modalTitle.textContent = "Reset PIN";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-key" style="font-size: 60px; color: var(--success); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Create a new 5-digit PIN</p>
                </div>
                <div class="form-group">
                    <label>New PIN</label>
                    <input type="password" id="resetNewPin" placeholder="Enter new 5-digit PIN" maxlength="5" inputmode="numeric" pattern="[0-9]*">
                </div>
                <div class="form-group">
                    <label>Confirm PIN</label>
                    <input type="password" id="resetConfirmPin" placeholder="Re-enter new PIN" maxlength="5" inputmode="numeric" pattern="[0-9]*">
                </div>
                <div style="background: #fff3cd; padding: 12px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                    <i class="fas fa-exclamation-triangle" style="color: #ffc107; margin-right: 8px;"></i>
                    <span style="font-size: 13px; color: #856404;">Remember your PIN. You'll need it to login.</span>
                </div>
                <button class="btn-submit" onclick="processResetPin()">
                    <i class="fas fa-check-circle"></i> Reset PIN
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
            
        case "register":
            modalTitle.textContent = "Create Account";
            content = `
                <div style="text-align: center; padding: 20px 0;">
                    <i class="fas fa-user-plus" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
                    <p style="color: #666; margin-bottom: 20px;">Join Paylance in minutes!</p>
                </div>
                
               
                
                <div style="background: #d1ecf1; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #0dcaf0;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <i class="fas fa-shield-alt" style="color: #0dcaf0; font-size: 20px;"></i>
                        <span style="font-weight: 600; color: #055160;">Full Account Registration</span>
                    </div>
                    <p style="font-size: 13px; color: #055160; margin-bottom: 0;">
                        Complete registration with verification for full features
                    </p>
                </div>
                
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="regName" placeholder="Enter your full name">
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="regMobile" placeholder="03XXXXXXXXX" maxlength="11">
                </div>
                <div class="form-group">
                    <label>CNIC Number</label>
                    <input type="text" id="regCnic" placeholder="Enter CNIC (without dashes)" maxlength="13">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="regEmail" placeholder="your.email@example.com">
                </div>
                <div class="form-group">
                    <label>Create PIN (5 digits)</label>
                    <input type="password" id="regPin" placeholder="Enter 5-digit PIN" maxlength="5">
                </div>
                <button class="btn-submit" onclick="processRegister()">
                    <i class="fas fa-user-check"></i> Create Account
                </button>
                <button class="btn-cancel" onclick="closeModal()">Cancel</button>
            `;
            break;
    }
    
    modalBody.innerHTML = content;
    modal.style.display = "flex";
}

// Close modal
function closeModal() {
    document.getElementById("transactionModal").style.display = "none";
}

// Process Send Money
function processSendMoney() {
    const recipient = document.getElementById("recipientNumber").value;
    const amount = parseFloat(document.getElementById("sendAmount").value);
    const purpose = document.getElementById("sendPurpose").value || "Money Transfer";
    
    if (!recipient || recipient.length !== 11 || !recipient.startsWith("03")) {
        alert("Please enter a valid mobile number!");
        return;
    }
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    
    if (amount > balance) {
        alert("Insufficient balance!");
        return;
    }
    
    balance -= amount;
    updateBalanceDisplay();
    
    addTransaction({
        type: "sent",
        title: purpose,
        recipient: recipient,
        amount: amount,
        date: new Date().toLocaleString()
    });
    
    closeModal();
    showSuccessAnimation(`Rs ${formatCurrency(amount)} sent successfully to ${recipient}`);
}

// Process Request Money
function processRequestMoney() {
    const number = document.getElementById("requestNumber").value;
    const amount = parseFloat(document.getElementById("requestAmount").value);
    const reason = document.getElementById("requestReason").value || "Payment Request";
    
    if (!number || number.length !== 11 || !number.startsWith("03")) {
        alert("Please enter a valid mobile number!");
        return;
    }
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    
    closeModal();
    showSuccessAnimation(`Request for Rs ${formatCurrency(amount)} sent to ${number}`);
}

// Process Mobile Load
function processMobileLoad() {
    const number = document.getElementById("loadNumber").value;
    const amount = parseFloat(document.getElementById("loadPackage").value);
    
    if (!number || number.length !== 11 || !number.startsWith("03")) {
        alert("Please enter a valid mobile number!");
        return;
    }
    
    if (amount > balance) {
        alert("Insufficient balance!");
        return;
    }
    
    balance -= amount;
    updateBalanceDisplay();
    
    addTransaction({
        type: "bill",
        title: "Mobile Recharge",
        recipient: number,
        amount: amount,
        date: new Date().toLocaleString()
    });
    
    closeModal();
    showSuccessAnimation(`Mobile recharged with Rs ${formatCurrency(amount)}`);
}

// Process Bill Payment
function processBillPayment() {
    const billType = document.getElementById("billType").value;
    const consumerNumber = document.getElementById("consumerNumber").value;
    const amount = parseFloat(document.getElementById("billAmount").value);
    
    if (!consumerNumber || isNaN(consumerNumber)) {
        alert("Please enter a valid consumer number (numbers only)!");
        return;
    }
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    
    if (amount > balance) {
        alert("Insufficient balance!");
        return;
    }
    
    balance -= amount;
    updateBalanceDisplay();
    
    addTransaction({
        type: "bill",
        title: `${billType} Bill`,
        recipient: consumerNumber,
        amount: amount,
        date: new Date().toLocaleString()
    });
    
    closeModal();
    showSuccessAnimation(`${billType} bill paid successfully!`);
}

// Process Add Money
function processAddMoney() {
    const method = document.getElementById("addMethod").value;
    const amount = parseFloat(document.getElementById("addAmount").value);
    
    if (!amount || amount <= 0) {
        alert("Please enter a valid amount!");
        return;
    }
    
    balance += amount;
    updateBalanceDisplay();
    
    addTransaction({
        type: "received",
        title: `Added via ${method}`,
        recipient: "NexPay Account",
        amount: amount,
        date: new Date().toLocaleString()
    });
    
    closeModal();
    showSuccessAnimation(`Rs ${formatCurrency(amount)} added successfully!`);
}

// Add transaction to history
function addTransaction(transaction) {
    transactions.unshift(transaction);
    
    if (transactions.length > 20) {
        transactions = transactions.slice(0, 20);
    }
    
    // Save transactions for current user
    const currentUser = localStorage.getItem("nexpay_current_user");
    if (currentUser) {
        localStorage.setItem(`nexpay_transactions_${currentUser}`, JSON.stringify(transactions));
    }
    
    loadTransactions();
}

// Load transactions
function loadTransactions() {
    const transactionList = document.getElementById("transactionList");
    
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet</p>
                <span>Start your first transaction</span>
            </div>
        `;
        return;
    }
    
    let html = "";
    transactions.slice(0, 5).forEach(transaction => {
        const iconClass = transaction.type === "received" ? "received" : 
                         transaction.type === "sent" ? "sent" : "bill";
        const icon = transaction.type === "received" ? "fa-arrow-down" : 
                    transaction.type === "sent" ? "fa-arrow-up" : "fa-file-invoice";
        const amountClass = transaction.type === "received" ? "credit" : "debit";
        const amountSign = transaction.type === "received" ? "+" : "-";
        
        html += `
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-date">${transaction.date}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountSign}Rs ${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    });
    
    transactionList.innerHTML = html;
}

// Show success animation
function showSuccessAnimation(message) {
    const popup = document.getElementById("successPopup");
    const messageElement = document.getElementById("successMessage");
    
    messageElement.textContent = message;
    popup.style.display = "flex";
    
    setTimeout(() => {
        popup.style.display = "none";
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("transactionModal");
    if (event.target.classList.contains('modal-overlay')) {
        closeModal();
    }
}

// Card action processing functions
function processCardFreeze() {
    const cardSelect = document.getElementById("cardSelect").value;
    closeModal();
    showSuccessAnimation(`Card ending in ${cardSelect} has been frozen successfully!`);
}

function processCardLimit() {
    const dailyLimit = document.getElementById("dailyLimit").value;
    const monthlyLimit = document.getElementById("monthlyLimit").value;
    
    if (!dailyLimit || !monthlyLimit) {
        alert("Please enter both daily and monthly limits!");
        return;
    }
    
    closeModal();
    showSuccessAnimation(`Card limits updated successfully!\nDaily: Rs ${formatCurrency(parseFloat(dailyLimit))}\nMonthly: Rs ${formatCurrency(parseFloat(monthlyLimit))}`);
}

function showCardDetails() {
    // This function can be used to dynamically update card details
    console.log("Card details updated");
}

function processAddCard() {
    const cardName = document.getElementById("cardName").value;
    const cardType = document.getElementById("cardType").value;
    
    if (!cardName) {
        alert("Please enter a card name!");
        return;
    }
    
    closeModal();
    showSuccessAnimation(`${cardType === 'virtual' ? 'Virtual' : 'Physical'} card "${cardName}" created successfully!`);
}

// Profile action processing functions
function updatePersonalInfo() {
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    
    if (!fullName || fullName.length < 3) {
        alert("❌ Please enter a valid full name (minimum 3 characters)!");
        return;
    }
    
    if (!email || !email.includes("@")) {
        alert("❌ Please enter a valid email address!");
        return;
    }
    
    // Get current user
    const currentUserMobile = localStorage.getItem("nexpay_current_user");
    if (!currentUserMobile) {
        alert("❌ No user logged in!");
        return;
    }
    
    // Update user account data
    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    const userIndex = accounts.findIndex(acc => acc.mobile === currentUserMobile);
    
    if (userIndex !== -1) {
        accounts[userIndex].name = fullName;
        accounts[userIndex].email = email;
        
        // Save updated accounts
        localStorage.setItem("nexpay_accounts", JSON.stringify(accounts));
        
        // Update display name on dashboard
        const userNameElement = document.getElementById("userName");
        if (userNameElement) {
            userNameElement.textContent = fullName;
        }
        
        // Update profile display
        updateProfileDisplay();
        
        closeModal();
        showSuccessAnimation("✅ Personal information updated successfully!");
    } else {
        alert("❌ User account not found!");
    }
}

function toggleBiometric(checkbox) {
    if (checkbox.checked) {
        // Enable biometric
        const confirmEnable = confirm("🔐 Enable Biometric Login?\n\nYou'll be able to login using:\n• Fingerprint sensor\n• Face recognition\n• Other biometric methods\n\nYour credentials will be saved securely on this device.");
        
        if (confirmEnable) {
            const success = enableBiometric();
            if (success) {
                // Don't close modal, just show success
                alert("✅ Biometric Enabled!\n\nYou can now use biometric login on the login screen.");
            } else {
                checkbox.checked = false;
            }
        } else {
            checkbox.checked = false;
        }
    } else {
        // Disable biometric
        const confirmDisable = confirm("⚠️ Disable Biometric Login?\n\nYou'll need to use your PIN to login.\n\nAre you sure?");
        
        if (confirmDisable) {
            disableBiometric();
            alert("🔓 Biometric Disabled\n\nBiometric login has been turned off.");
        } else {
            checkbox.checked = true;
        }
    }
}

function toggle2FA(checkbox) {
    if (checkbox.checked) {
        const confirm2FA = confirm("📱 Enable Two-Factor Authentication?\n\nYou'll receive an SMS code for each login.\n\nContinue?");
        if (confirm2FA) {
            localStorage.setItem("nexpay_2fa_enabled", "true");
            alert("✅ 2FA Enabled!\n\nYou'll receive SMS codes for login verification.");
        } else {
            checkbox.checked = false;
        }
    } else {
        const disable2FA = confirm("⚠️ Disable Two-Factor Authentication?\n\nThis will reduce your account security.\n\nAre you sure?");
        if (disable2FA) {
            localStorage.setItem("nexpay_2fa_enabled", "false");
            alert("🔓 2FA Disabled");
        } else {
            checkbox.checked = true;
        }
    }
}

function updateSecurity() {
    const currentPin = document.getElementById("currentPin").value;
    const newPin = document.getElementById("newPin").value;
    const confirmPin = document.getElementById("confirmPin").value;
    
    if (currentPin && newPin && confirmPin) {
        // Validate current PIN (demo: 12345)
        if (currentPin !== "12345") {
            alert("❌ Current PIN is incorrect!");
            return;
        }
        
        if (newPin.length !== 5) {
            alert("❌ New PIN must be exactly 5 digits!");
            return;
        }
        
        if (newPin === currentPin) {
            alert("❌ New PIN must be different from current PIN!");
            return;
        }
        
        if (newPin !== confirmPin) {
            alert("❌ New PIN and Confirm PIN don't match!");
            return;
        }
        
        closeModal();
        showSuccessAnimation("✅ PIN changed successfully!");
    } else if (currentPin || newPin || confirmPin) {
        alert("⚠️ Please fill all PIN fields to change your PIN");
    } else {
        closeModal();
        showSuccessAnimation("✅ Security settings saved!");
    }
}

function updateNotifications() {
    closeModal();
    showSuccessAnimation("Notification preferences saved successfully!");
}

function copyReferralCode() {
    const code = "NEXPAY2024";
    navigator.clipboard.writeText(code).then(() => {
        showSuccessAnimation("Referral code copied to clipboard!");
    }).catch(() => {
        alert("Referral Code: " + code);
    });
}

function updateSettings() {
    closeModal();
    showSuccessAnimation("Settings updated successfully!");
}

// Forgot PIN processing
async function processForgotPin() {
    const mobile = document.getElementById("forgotMobile").value;
    const cnic = document.getElementById("forgotCnic").value;
    const dob = document.getElementById("forgotDob").value;
    
    if (!mobile || mobile.length !== 11 || !mobile.startsWith("03")) {
        alert("❌ Please enter a valid mobile number!");
        return;
    }
    
    if (!cnic || cnic.length !== 13) {
        alert("❌ Please enter a valid 13-digit CNIC number!");
        return;
    }
    
    if (!dob) {
        alert("❌ Please select your date of birth!");
        return;
    }
    
    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("temp_reset_mobile", mobile);
    
    // Send SMS OTP (for notification only)
    await sendSMSOTP(mobile, otp);
    
    // Close current modal
    closeModal();
    
    // Show processing message
    showSuccessAnimation("⏳ Verifying your information...");
    
    // Auto-verify and show reset PIN screen after 2 seconds
    setTimeout(() => {
        showModal('resetPin');
    }, 2000);
}

// Verify OTP
function verifyOtp() {
    const otpCode = document.getElementById("otpCode").value;
    const savedOtp = localStorage.getItem("temp_otp");
    
    if (!otpCode || otpCode.length !== 6) {
        alert("❌ Please enter a valid 6-digit OTP code!");
        return;
    }
    
    // Verify OTP matches
    if (otpCode === savedOtp) {
        closeModal();
        
        setTimeout(() => {
            showModal('resetPin');
        }, 300);
        
        showSuccessAnimation("✅ OTP verified successfully!");
        localStorage.removeItem("temp_otp");
    } else {
        alert("❌ Invalid OTP code!\n\nPlease check the code and try again.");
    }
}

// Resend OTP
async function resendOtp() {
    const mobile = localStorage.getItem("temp_reset_mobile") || localStorage.getItem("temp_reg_mobile");
    
    if (!mobile) {
        alert("❌ Session expired. Please start again.");
        closeModal();
        return;
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("temp_otp", otp);
    
    // Send SMS OTP
    await sendSMSOTP(mobile, otp);
    
    showSuccessAnimation("📱 New OTP sent successfully!");
}

// Reset PIN
function processResetPin() {
    const newPin = document.getElementById("resetNewPin").value;
    const confirmPin = document.getElementById("resetConfirmPin").value;
    
    if (!newPin || newPin.length !== 5) {
        alert("❌ PIN must be exactly 5 digits!");
        return;
    }
    
    if (!confirmPin) {
        alert("❌ Please confirm your PIN!");
        return;
    }
    
    if (newPin !== confirmPin) {
        alert("❌ PINs don't match! Please try again.");
        return;
    }
    
    // Check if PIN is all same digits
    if (/^(\d)\1{4}$/.test(newPin)) {
        alert("⚠️ Please choose a stronger PIN (avoid 11111, 22222, etc.)");
        return;
    }
    
    // Save new PIN (in production, this would be sent to server)
    localStorage.setItem("nexpay_pin", newPin);
    
    closeModal();
    showSuccessAnimation("✅ PIN reset successful!\n\nYou can now login with your new PIN.");
    
    // Clear temp data
    localStorage.removeItem("temp_reset_mobile");
}

// Register new account with simple verification
// ── UPDATED processRegister — Flask OTP bhejta hai ──────
async function processRegister() {
    const name   = document.getElementById("regName").value.trim();
    const mobile = document.getElementById("regMobile").value.trim();
    const cnic   = document.getElementById("regCnic").value.trim();
    const email  = document.getElementById("regEmail").value.trim();
    const pin    = document.getElementById("regPin").value.trim();

    // Validations
    if (!name || name.length < 3) {
        alert("❌ Please enter your full name (minimum 3 characters)!"); return;
    }
    if (!mobile || mobile.length !== 11 || !mobile.startsWith("03")) {
        alert("❌ Please enter a valid mobile number!"); return;
    }

    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    if (accounts.find(acc => acc.mobile === mobile)) {
        alert("❌ This mobile number is already registered!\n\nPlease login or use a different number."); return;
    }
    if (!cnic || cnic.length !== 13) {
        alert("❌ Please enter a valid 13-digit CNIC number!"); return;
    }
    if (!email || !email.includes("@")) {
        alert("❌ Please enter a valid email address!"); return;
    }
    if (!pin || pin.length !== 5) {
        alert("❌ PIN must be exactly 5 digits!"); return;
    }
    if (/^(\d)\1{4}$/.test(pin)) {
        alert("⚠️ Please choose a stronger PIN (avoid 11111, 22222, etc.)"); return;
    }

    // Data temporarily save karo
    pendingRegistration = { name, mobile, cnic, email, pin };

    // Flask se OTP bhijwao
    try {
        showSuccessAnimation("⏳ Sending OTP to your email...");
        
        const res = await fetch("/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
            closeModal();           // registration modal band karo
            showOtpModal(email);    // OTP modal kholo
        } else {
            alert("❌ Failed to send OTP: " + (data.message || "Unknown error"));
        }
    } catch (err) {
        alert("❌ Server error!\n\nMake sure Flask server is running:\npython app.py");
    }
}

// ── OTP Modal Open ───────────────────────────────────────
function showOtpModal(email) {
    document.getElementById("otpEmailDisplay").textContent = email;
    const modal = document.getElementById("otpModal");
    modal.style.display = "flex";
    // Boxes clear karo
    ["otp1","otp2","otp3","otp4","otp5","otp6"].forEach(id => {
        document.getElementById(id).value = "";
    });
    document.getElementById("otp1").focus();
    startOtpTimer(5 * 60); // 5 minute
}

// ── OTP Modal Close ──────────────────────────────────────
function closeOtpModal() {
    document.getElementById("otpModal").style.display = "none";
    clearInterval(otpTimerInterval);
    pendingRegistration = null;
}

// ── OTP Box Navigation ───────────────────────────────────
function otpMove(current, nextId) {
    current.value = current.value.replace(/[^0-9]/g, "");
    if (current.value.length === 1 && nextId) {
        document.getElementById(nextId).focus();
    }
}
function otpBack(event, prevId) {
    if (event.key === "Backspace" && event.target.value === "" && prevId) {
        document.getElementById(prevId).focus();
    }
}

// ── Countdown Timer ──────────────────────────────────────
function startOtpTimer(seconds) {
    clearInterval(otpTimerInterval);
    let remaining = seconds;
    const timerEl  = document.getElementById("timerCount");
    const timerBox = document.getElementById("otpTimerBox");
    timerBox.style.color = "#fdcb6e";

    otpTimerInterval = setInterval(() => {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        timerEl.textContent = `${m}:${s.toString().padStart(2,"0")}`;
        remaining--;

        if (remaining < 0) {
            clearInterval(otpTimerInterval);
            timerEl.textContent = "Expired";
            timerBox.style.color = "#d63031";
        }
    }, 1000);
}

// ── Resend OTP ───────────────────────────────────────────
async function resendOtpEmail() {
    if (!pendingRegistration) return;

    try {
        const res = await fetch("/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: pendingRegistration.email })
        });
        if (res.ok) {
            showSuccessAnimation("✅ New OTP sent to " + pendingRegistration.email);
            startOtpTimer(5 * 60);
            ["otp1","otp2","otp3","otp4","otp5","otp6"].forEach(id => {
                document.getElementById(id).value = "";
            });
            document.getElementById("otp1").focus();
        } else {
            alert("❌ Failed to resend OTP. Try again.");
        }
    } catch (err) {
        alert("❌ Server error. Make sure Flask is running.");
    }
}

// ── Verify OTP aur Account Banao ─────────────────────────
async function verifyOtpAndRegister() {
    if (!pendingRegistration) {
        alert("❌ Session expired. Please register again."); return;
    }

    const otp = ["otp1","otp2","otp3","otp4","otp5","otp6"]
        .map(id => document.getElementById(id).value.trim())
        .join("");

    if (otp.length !== 6) {
        alert("❌ Please enter complete 6-digit OTP!"); return;
    }

    try {
        const res = await fetch("/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: pendingRegistration.email,
                otp: otp
            })
        });
        const data = await res.json();

        if (data.status === "success") {
            // Timer band karo
            clearInterval(otpTimerInterval);
            document.getElementById("otpModal").style.display = "none";

            // ✅ Account create karo localStorage mein
            const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
            const { name, mobile, cnic, email, pin } = pendingRegistration;

            const newAccount = {
                name, mobile, cnic, email, pin,
                createdAt: new Date().toISOString()
            };
            accounts.push(newAccount);
            localStorage.setItem("nexpay_accounts", JSON.stringify(accounts));
            localStorage.setItem(`nexpay_balance_${mobile}`, "25000");
            localStorage.setItem(`nexpay_transactions_${mobile}`, JSON.stringify([]));

            pendingRegistration = null;

            // Success message
            showSuccessAnimation(`🎉 Account Created! Welcome ${name}!`);
            
            setTimeout(() => {
                alert(`🎉 Account Created Successfully!\n\nWelcome ${name}!\n\n• Mobile: ${mobile}\n• Email: ${email}\n• Starting Balance: Rs 25,000\n\nYou can now login!`);
                // Login fields auto-fill
                document.getElementById("mobileNumber").value = mobile;
                document.getElementById("mpin").value = pin;
            }, 1000);

        } else {
            // Wrong OTP
            alert("❌ Invalid OTP! Please try again.");
            ["otp1","otp2","otp3","otp4","otp5","otp6"].forEach(id => {
                document.getElementById(id).value = "";
            });
            document.getElementById("otp1").focus();
        }
    } catch (err) {
        alert("❌ Server error. Please try again.");
    }
}

// Resend Email OTP
async function resendEmailOTP() {
    alert("📧 Resend feature is not available in simple verification mode.");
}

// Create demo account (instant access)
function createDemoAccount() {
    closeModal();
    
    // Show success message
    showSuccessAnimation("🎉 Demo Account Created!\n\nYou can now login with:\nMobile: 03001234567\nPIN: 12345");
    
    // Auto-fill login credentials
    setTimeout(() => {
        document.getElementById("mobileNumber").value = "03001234567";
        document.getElementById("mpin").value = "12345";
    }, 2000);
}

// Complete registration after OTP verification
function completeRegistration() {
    const otpCode = document.getElementById("regOtpCode").value;
    const tempRegData = JSON.parse(localStorage.getItem("temp_registration"));
    
    if (!tempRegData) {
        alert("❌ Session expired. Please register again.");
        closeModal();
        return;
    }
    
    if (!otpCode || otpCode.length !== 6) {
        alert("❌ Please enter a valid 6-digit OTP code!");
        return;
    }
    
    // Verify OTP
    if (otpCode !== tempRegData.otp) {
        alert("❌ Invalid OTP code!\n\nPlease check the code and try again.");
        return;
    }
    
    // Create account
    const accounts = JSON.parse(localStorage.getItem("nexpay_accounts")) || [];
    
    const newAccount = {
        name: tempRegData.name,
        mobile: tempRegData.mobile,
        cnic: tempRegData.cnic,
        email: tempRegData.email,
        pin: tempRegData.pin,
        createdAt: new Date().toISOString()
    };
    
    accounts.push(newAccount);
    localStorage.setItem("nexpay_accounts", JSON.stringify(accounts));
    
    // Initialize user balance and transactions
    localStorage.setItem(`nexpay_balance_${tempRegData.mobile}`, "25000");
    localStorage.setItem(`nexpay_transactions_${tempRegData.mobile}`, JSON.stringify([]));
    
    // Clear temp data
    localStorage.removeItem("temp_registration");
    
    closeModal();
    
    // Show success and auto-fill login
    alert(`🎉 Account Created Successfully!\n\nWelcome ${tempRegData.name}!\n\nYour account has been created with:\n• Mobile: ${tempRegData.mobile}\n• Starting Balance: Rs 25,000\n\nYou can now login!`);
    
    // Auto-fill login credentials
    setTimeout(() => {
        document.getElementById("mobileNumber").value = tempRegData.mobile;
        document.getElementById("mpin").value = tempRegData.pin;
    }, 1000);
}

// Resend registration OTP
async function resendRegistrationOtp() {
    const tempRegData = JSON.parse(localStorage.getItem("temp_registration"));
    
    if (!tempRegData) {
        alert("❌ Session expired. Please register again.");
        closeModal();
        return;
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    tempRegData.otp = otp;
    localStorage.setItem("temp_registration", JSON.stringify(tempRegData));
    
    // Send SMS OTP
    await sendSMSOTP(tempRegData.mobile, otp);
    
    showSuccessAnimation("📱 New OTP sent successfully!");
}

// Remove demo account creation (no longer needed)
function createDemoAccount() {
    alert("⚠️ Demo accounts are no longer available.\n\nPlease create a real account by filling the registration form.\n\nIt only takes a minute!");
}


// NEW FEATURES FUNCTIONS

// Dark Mode Toggle
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('nexpay_dark_mode', darkMode);
    showSuccessAnimation(darkMode ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
}

// Load dark mode preference
function loadDarkMode() {
    const savedMode = localStorage.getItem('nexpay_dark_mode');
    if (savedMode === 'true') {
        darkMode = true;
        document.body.classList.add('dark-mode');
    }
}

// Split Bill
function processSplitBill() {
    const amount = parseFloat(document.getElementById('splitAmount').value);
    const people = parseInt(document.getElementById('splitPeople').value);
    const description = document.getElementById('splitDescription').value;
    
    if (!amount || amount <= 0) {
        alert('❌ Please enter a valid amount!');
        return;
    }
    
    if (!people || people < 2) {
        alert('❌ Please enter at least 2 people!');
        return;
    }
    
    const perPerson = (amount / people).toFixed(2);
    
    closeModal();
    
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('transactionModal');
    
    modalTitle.textContent = 'Bill Split Result';
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-check-circle" style="font-size: 60px; color: var(--success); margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 10px;">${description || 'Bill Split'}</h3>
            <p style="color: #666; margin-bottom: 20px;">Total: Rs ${amount}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin: 20px 0;">
                <h2 style="color: var(--primary); margin-bottom: 10px;">Rs ${perPerson}</h2>
                <p style="color: #666;">per person (${people} people)</p>
            </div>
            <div class="split-participants">
                ${Array.from({length: people}, (_, i) => `
                    <div class="participant-item">
                        <span class="participant-name">Person ${i + 1}</span>
                        <span class="participant-share">Rs ${perPerson}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <button class="btn-submit" onclick="closeModal()">Done</button>
    `;
    
    modal.style.display = 'flex';
}

// Cashback System
function addCashback(amount) {
    const points = Math.floor(amount / 100);
    cashbackPoints += points;
    localStorage.setItem('nexpay_cashback', cashbackPoints);
    updateCashbackDisplay();
}

function updateCashbackDisplay() {
    const cashbackElement = document.getElementById('cashbackPoints');
    if (cashbackElement) {
        cashbackElement.textContent = `${cashbackPoints} Points`;
    }
}

function redeemCashback() {
    if (cashbackPoints < 100) {
        alert('❌ You need at least 100 points to redeem!');
        return;
    }
    
    const redeemAmount = Math.floor(cashbackPoints / 100) * 10;
    balance += redeemAmount;
    cashbackPoints = cashbackPoints % 100;
    
    localStorage.setItem('nexpay_cashback', cashbackPoints);
    updateBalanceDisplay();
    updateCashbackDisplay();
    
    closeModal();
    showSuccessAnimation(`🎉 Redeemed Rs ${redeemAmount}!`);
}

// Budget Planner
function calculateMonthlySpent() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear &&
                   (t.type === 'sent' || t.type === 'bill');
        })
        .reduce((sum, t) => sum + t.amount, 0);
}

function updateBudget() {
    const newBudget = parseFloat(document.getElementById('monthlyBudgetInput').value);
    
    if (!newBudget || newBudget <= 0) {
        alert('❌ Please enter a valid budget amount!');
        return;
    }
    
    monthlyBudget = newBudget;
    localStorage.setItem('nexpay_budget', monthlyBudget);
    
    closeModal();
    updateBudgetDisplay();
    showSuccessAnimation('✅ Budget updated successfully!');
}

function updateBudgetDisplay() {
    const spent = calculateMonthlySpent();
    const percentage = (spent / monthlyBudget) * 100;
    
    const spentElement = document.getElementById('monthlySpent');
    const fillElement = document.getElementById('budgetFill');
    const limitElement = document.getElementById('budgetLimit');
    
    if (spentElement) spentElement.textContent = `Rs ${formatCurrency(spent)}`;
    if (fillElement) {
        fillElement.style.width = `${Math.min(percentage, 100)}%`;
        if (percentage > 90) {
            fillElement.style.background = 'linear-gradient(135deg, var(--danger), #FF7675)';
        } else if (percentage > 70) {
            fillElement.style.background = 'linear-gradient(135deg, var(--warning), #FFEAA7)';
        }
    }
    if (limitElement) limitElement.textContent = formatCurrency(monthlyBudget);
}

// Financial Goals
function addFinancialGoal() {
    const name = document.getElementById('goalName').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const date = document.getElementById('goalDate').value;
    
    if (!name || !target || !date) {
        alert('❌ Please fill all fields!');
        return;
    }
    
    const goal = {
        id: Date.now(),
        name,
        target,
        current,
        date,
        createdAt: new Date().toISOString()
    };
    
    financialGoals.push(goal);
    localStorage.setItem('nexpay_goals', JSON.stringify(financialGoals));
    
    closeModal();
    updateGoalsDisplay();
    showSuccessAnimation('✅ Goal added successfully!');
}

function updateGoalsDisplay() {
    const goalsList = document.getElementById('goalsList');
    
    if (!goalsList) return;
    
    if (financialGoals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullseye"></i>
                <p>No goals yet</p>
                <span>Set your first financial goal</span>
            </div>
        `;
        return;
    }
    
    goalsList.innerHTML = financialGoals.map(goal => {
        const percentage = (goal.current / goal.target) * 100;
        return `
            <div class="goal-card" onclick="showGoalDetails(${goal.id})">
                <div class="goal-header">
                    <span class="goal-title">${goal.name}</span>
                    <span class="goal-amount">Rs ${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</span>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="goal-footer">
                    <span>${Math.round(percentage)}% Complete</span>
                    <span>Target: ${new Date(goal.date).toLocaleDateString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function showGoalDetails(goalId) {
    const goal = financialGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = goal.name;
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas fa-bullseye" style="font-size: 60px; color: var(--primary); margin-bottom: 20px;"></i>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 15px; margin: 20px 0;">
                <h3 style="color: var(--primary);">Rs ${formatCurrency(goal.current)}</h3>
                <p style="color: #666;">of Rs ${formatCurrency(goal.target)}</p>
            </div>
            <div class="form-group">
                <label>Add to Goal (Rs)</label>
                <input type="number" id="goalAddAmount" placeholder="Enter amount">
            </div>
        </div>
        <button class="btn-submit" onclick="addToGoal(${goal.id})">
            <i class="fas fa-plus"></i> Add Money
        </button>
        <button class="btn-cancel" onclick="deleteGoal(${goal.id})" style="background: var(--danger);">
            <i class="fas fa-trash"></i> Delete Goal
        </button>
        <button class="btn-cancel" onclick="closeModal()">Close</button>
    `;
    
    modal.style.display = 'flex';
}

function addToGoal(goalId) {
    const amount = parseFloat(document.getElementById('goalAddAmount').value);
    
    if (!amount || amount <= 0) {
        alert('❌ Please enter a valid amount!');
        return;
    }
    
    const goal = financialGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    goal.current += amount;
    localStorage.setItem('nexpay_goals', JSON.stringify(financialGoals));
    
    closeModal();
    updateGoalsDisplay();
    showSuccessAnimation(`✅ Added Rs ${amount} to ${goal.name}!`);
}

function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    financialGoals = financialGoals.filter(g => g.id !== goalId);
    localStorage.setItem('nexpay_goals', JSON.stringify(financialGoals));
    
    closeModal();
    updateGoalsDisplay();
    showSuccessAnimation('Goal deleted');
}

// Currency Converter
function convertCurrency() {
    const amount = parseFloat(document.getElementById('convertAmount').value);
    const currency = document.getElementById('convertTo').value;
    
    if (!amount || amount <= 0) {
        document.getElementById('converterResult').innerHTML = `
            <div class="converter-amount">0.00</div>
            <div class="converter-rate">Enter amount to convert</div>
        `;
        return;
    }
    
    // Exchange rates (approximate)
    const rates = {
        'USD': 0.0036,
        'EUR': 0.0033,
        'GBP': 0.0028,
        'AED': 0.013,
        'SAR': 0.013,
        'INR': 0.30
    };
    
    const rate = rates[currency];
    const converted = (amount * rate).toFixed(2);
    
    document.getElementById('converterResult').innerHTML = `
        <div class="converter-amount">${converted} ${currency}</div>
        <div class="converter-rate">1 PKR = ${rate} ${currency}</div>
    `;
}

// Expense Tracker
function getCategoryColor(category) {
    const colors = {
        'Shopping': 'linear-gradient(135deg, #667EEA, #764BA2)',
        'Food': 'linear-gradient(135deg, #F093FB, #F5576C)',
        'Transport': 'linear-gradient(135deg, #4FACFE, #00F2FE)',
        'Bills': 'linear-gradient(135deg, #43E97B, #38F9D7)',
        'Entertainment': 'linear-gradient(135deg, #FA709A, #FEE140)',
        'Others': 'linear-gradient(135deg, #30CFD0, #330867)'
    };
    return colors[category] || colors['Others'];
}

function getCategoryIcon(category) {
    const icons = {
        'Shopping': 'fa-shopping-bag',
        'Food': 'fa-utensils',
        'Transport': 'fa-car',
        'Bills': 'fa-file-invoice',
        'Entertainment': 'fa-film',
        'Others': 'fa-ellipsis-h'
    };
    return icons[category] || icons['Others'];
}

// Recurring Payments
function addRecurringPayment() {
    const title = document.getElementById('recurringTitle').value;
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const frequency = document.getElementById('recurringFrequency').value;
    const date = document.getElementById('recurringDate').value;
    
    if (!title || !amount || !date) {
        alert('❌ Please fill all fields!');
        return;
    }
    
    const payment = {
        id: Date.now(),
        title,
        amount,
        schedule: frequency,
        date,
        active: true
    };
    
    recurringPayments.push(payment);
    localStorage.setItem('nexpay_recurring', JSON.stringify(recurringPayments));
    
    closeModal();
    showSuccessAnimation('✅ Recurring payment added!');
    
    // Show the recurring payments modal again
    setTimeout(() => showModal('recurringPayments'), 500);
}

function toggleRecurring(index) {
    recurringPayments[index].active = !recurringPayments[index].active;
    localStorage.setItem('nexpay_recurring', JSON.stringify(recurringPayments));
    showSuccessAnimation(recurringPayments[index].active ? 'Payment activated' : 'Payment paused');
}

// Transaction Search & Filter
function filterTransactions() {
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const type = document.getElementById('filterType').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    
    let filtered = transactions;
    
    // Filter by type
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }
    
    // Filter by search query
    if (query) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(query) ||
            t.amount.toString().includes(query) ||
            t.date.includes(query)
        );
    }
    
    // Filter by date range
    if (dateFrom) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(dateFrom));
    }
    if (dateTo) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(dateTo));
    }
    
    // Display filtered results
    const container = document.getElementById('filteredTransactions');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(t => {
        const iconClass = t.type === "received" ? "received" : 
                         t.type === "sent" ? "sent" : "bill";
        const icon = t.type === "received" ? "fa-arrow-down" : 
                    t.type === "sent" ? "fa-arrow-up" : "fa-file-invoice";
        const amountClass = t.type === "received" ? "credit" : "debit";
        const amountSign = t.type === "received" ? "+" : "-";
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${t.title}</div>
                    <div class="transaction-date">${t.date}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountSign}Rs ${formatCurrency(t.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Load all data on startup
function loadAllData() {
    // Load cashback
    const savedCashback = localStorage.getItem('nexpay_cashback');
    if (savedCashback) {
        cashbackPoints = parseInt(savedCashback);
        updateCashbackDisplay();
    }
    
    // Load budget
    const savedBudget = localStorage.getItem('nexpay_budget');
    if (savedBudget) {
        monthlyBudget = parseFloat(savedBudget);
    }
    updateBudgetDisplay();
    
    // Load goals
    const savedGoals = localStorage.getItem('nexpay_goals');
    if (savedGoals) {
        financialGoals = JSON.parse(savedGoals);
        updateGoalsDisplay();
    }
    
    // Load recurring payments
    const savedRecurring = localStorage.getItem('nexpay_recurring');
    if (savedRecurring) {
        recurringPayments = JSON.parse(savedRecurring);
    }
    
    // Load dark mode
    loadDarkMode();
}
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-theme');
    
    // Update icon
    if (body.classList.contains('dark-theme')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('nexpay_theme', 'dark');
        showSuccessAnimation('🌙 Dark Theme Enabled');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('nexpay_theme', 'light');
        showSuccessAnimation('☀️ Light Theme Enabled');
    }
}
function showNotifications() {
    alert("Notifications:\n• Payment received: Rs 5,000\n• Bill reminder: Electricity due\n• New feature available!");
}
function showQRCode() {
    alert("QR Code Scanner would open here!");
}

// Update the window load event
window.addEventListener('load', function() {
    // Hide splash screen after 2.5 seconds
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    }, 2500);
    
    // Initialize other components
    updateBalanceDisplay();
    loadTransactions();
    updateGreeting();
    updateBiometricButton();
    loadAllData();
});

