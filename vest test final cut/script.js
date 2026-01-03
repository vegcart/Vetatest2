// ==================== CONFIGURATION ====================
const BACKEND_CONFIG = {
    customer: {
        url: 'https://script.google.com/macros/s/AKfycbyFTmTNikW-A8UX1p8BAul8Gt-VXS0SFd9AGZf-zmxHws9XECtz8SF8pS4WjK663XlYMg/exec'
    },
    order: {
        url: 'https://script.google.com/macros/s/AKfycbwDyWj212FDuhK2qNLhyKsaNbCSZYi_jj3kuGDwTC940oboU-sGBPT_ARflVZIx_OAOAA/exec'
    },
    items: {
        url: 'https://script.google.com/macros/s/AKfycbxSehsRy8OMaTsOShA-SgVslthwm8OGE8u49due3w0aJEahcvtKQhxjH_6xw-v4F35_CA/exec'
    }
};

const BUSINESS_WHATSAPP_NUMBER = '917017938239';
const AUTO_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MINIMUM_ORDER_AMOUNT = 20; // Minimum order amount ₹20

// ==================== DATA ====================
let products = {
    vegetables: [],
    fruits: [],
    dairy: [],
    grocery: [],
    kitchen: [],
    special: []
};

// ==================== GLOBAL VARIABLES ====================
let cart = JSON.parse(localStorage.getItem('vegCart')) || {};
let currentProduct = null;
let userProfile = JSON.parse(localStorage.getItem('vegCartUser')) || null;
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
let darkMode = localStorage.getItem('darkMode') === 'true';
let currentOrderId = null;
let autoCloseTimeout = null;
let autoUpdateInterval = null;
let isProcessingOrder = false;

// ==================== SCROLL POSITION TRACKING ====================
let lastScrollPosition = 0;
let modalOpenScrollPosition = 0;

// ==================== MOBILE BACK BUTTON SYSTEM ====================
let historyStack = ['home-page']; // Track navigation history
let currentPage = 'home-page';    // Track current page

// ==================== INITIALIZATION ====================
window.onload = async function() {
    // Disable browser scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Show loading screen
    showLoadingScreen(0);
    
    // Initialize basic UI
    initTheme();
    initConnectionHandler();
    
    // Update progress
    updateLoadingProgress(20);
    
    // Initialize cart from localStorage
    updateCartIcon();
    
    // Update progress
    updateLoadingProgress(40);
    
    if (userProfile) {
        document.getElementById('account-page').style.display = 'none';
        document.getElementById('home-page').style.display = 'block';
        document.getElementById('home-page').classList.add('active');
        document.getElementById('search-bar-container').style.display = 'block';
        updateProfileView();
        
        // Update progress
        updateLoadingProgress(60);
        
        // Load fresh products from sheet
        await loadProducts(true);
        
        // Update progress
        updateLoadingProgress(80);
        
        // Start auto-update interval
        startAutoUpdate();
    } else {
        document.getElementById('account-page').style.display = 'block';
        document.getElementById('account-page').classList.add('active');
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('home-page').classList.remove('active');
        historyStack = ['account-page'];
        currentPage = 'account-page';
    }

    // Initialize remaining UI
    initSlider();
    updateLoadingProgress(90);
    
    // Initialize back button handling
    initBackButtonSystem();
    
    // Complete loading
    updateLoadingProgress(100);
    
    // Hide loading screen after a short delay
    setTimeout(() => {
        hideLoadingScreen();
    }, 500);
};

// ==================== CONNECTION HANDLER ====================
function initConnectionHandler() {
    // Check initial connection status
    updateConnectionStatus();
    
    // Add event listeners for connection changes
    window.addEventListener('online', function() {
        updateConnectionStatus();
        showNotification('You are back online!', 'success');
    });
    
    window.addEventListener('offline', function() {
        updateConnectionStatus();
    });
    
    // Check connection status every 3 seconds
    setInterval(updateConnectionStatus, 3000);
}

function updateConnectionStatus() {
    const overlay = document.getElementById('connection-overlay');
    if (navigator.onLine) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
    }
}

// ==================== MOBILE BACK BUTTON FUNCTIONS ====================
function initBackButtonSystem() {
    // Handle browser/mobile back button
    window.addEventListener('popstate', function(event) {
        handleBackButton(event);
    });

    // Push initial state to history
    window.history.pushState({ page: currentPage }, '', '');
}

function handleBackButton(event) {
    // First check if search page is open
    if (document.getElementById('search-page').style.display !== 'none') {
        closeSearch();
        event.preventDefault();
        return;
    }
    
    // Check if quantity modal is open
    const modal = document.getElementById('qty-modal');
    if (modal.classList.contains('active')) {
        event.preventDefault();
        closeModal();
        return;
    }
    
    // Check if success/error modal is open
    if (document.getElementById('order-success').classList.contains('active')) {
        event.preventDefault();
        closeOrderSuccess();
        return;
    }
    
    if (document.getElementById('order-error').classList.contains('active')) {
        event.preventDefault();
        closeOrderError();
        return;
    }
    
    if (document.getElementById('stock-alert').classList.contains('active')) {
        event.preventDefault();
        closeStockAlert();
        return;
    }
    
    // Get the current active page
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const currentPageId = activePage.id;
    
    // Block back button for specific pages
    if (currentPageId === 'order-history-page' || 
        currentPageId === 'edit-profile-page' || 
        currentPageId === 'order-details-page') {
        event.preventDefault();
        // Push current state again to prevent any navigation
        window.history.pushState({ page: currentPageId }, '', '');
        return;
    }
    
    // Handle specific pages based on requirements
    switch(currentPageId) {
        case 'review-page':
            historyStack = ['home-page'];
            currentPage = 'home-page';
            event.preventDefault();
            goToHome();
            window.history.pushState({ page: 'home-page' }, '', '');
            break;
            
        case 'account-page':
            event.preventDefault();
            window.history.pushState({ page: 'account-page' }, '', '');
            break;
            
        case 'profile-page':
            historyStack = ['home-page'];
            currentPage = 'home-page';
            event.preventDefault();
            goToHome();
            window.history.pushState({ page: 'home-page' }, '', '');
            break;
            
        case 'category-page':
            event.preventDefault();
            goToHome();
            window.history.pushState({ page: 'home-page' }, '', '');
            break;
            
        case 'home-page':
            event.preventDefault();
            window.history.pushState({ page: 'home-page' }, '', '');
            break;
            
        default:
            event.preventDefault();
            goToHome();
            window.history.pushState({ page: 'home-page' }, '', '');
    }
}

// ==================== SLIDER WITH NEW IMAGES ====================
function initSlider() {
    // UPDATED: New sample images for slider
    const images = [
        'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=800&q=80', // Fresh vegetables
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80', // Fruits basket
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'  // Organic produce
    ];
    
    const container = document.getElementById('slider');
    container.innerHTML = ''; // Clear existing images
    
    images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = index === 0 ? 'slide active' : 'slide';
        img.alt = 'Fresh Vegetables & Fruits';
        container.appendChild(img);
    });

    let currentSlide = 0;
    setInterval(() => {
        const slides = document.querySelectorAll('.slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

// ==================== SEARCH PAGE BACK BUTTON ====================
function closeSearch() {
    document.getElementById('search-page').style.display = 'none';
}

// ==================== QUANTITY MODAL FUNCTIONS ====================
function closeModal() {
    const modal = document.getElementById('qty-modal');
    
    // Close modal
    modal.classList.remove('active');
    
    // Re-enable body scroll
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.classList.remove('modal-open');
    
    updateCartIcon();
}

// ==================== LOADING SCREEN FUNCTIONS ====================
function showLoadingScreen(progress = 0) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
    loadingScreen.style.visibility = 'visible';
    
    if (progress > 0) {
        updateLoadingProgress(progress);
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

function updateLoadingProgress(percent) {
    const progressFill = document.getElementById('loading-progress-fill');
    if (progressFill) {
        progressFill.style.width = percent + '%';
        
        // Update loading text based on progress
        const loadingText = document.querySelector('.loading-subtext');
        if (loadingText) {
            if (percent < 30) {
                loadingText.textContent = 'Initializing application...';
            } else if (percent < 60) {
                loadingText.textContent = 'Checking user profile...';
            } else if (percent < 80) {
                loadingText.textContent = 'Loading products...';
            } else if (percent < 95) {
                loadingText.textContent = 'Finalizing setup...';
            } else {
                loadingText.textContent = 'Ready to shop!';
            }
        }
    }
}

// ==================== AUTO UPDATE SYSTEM ====================
function startAutoUpdate() {
    // Clear existing interval if any
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    // Set new interval for auto update (every 5 minutes)
    autoUpdateInterval = setInterval(async () => {
        if (navigator.onLine && userProfile) {
            await loadProducts(true);
            showAutoUpdateIndicator();
            showNotification('Products updated with latest stock', 'success');
        }
    }, AUTO_UPDATE_INTERVAL);
}

function showAutoUpdateIndicator() {
    const indicator = document.getElementById('auto-update-indicator');
    indicator.style.display = 'flex';
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'error' ? '#f44336' : 
                                   type === 'success' ? '#4CAF50' : 
                                   type === 'warning' ? '#FF9800' : 
                                   '#2196F3';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showStockUpdateIndicator() {
    const indicator = document.getElementById('stock-update-indicator');
    indicator.style.display = 'flex';
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// ==================== BUTTON RESET FUNCTIONS ====================
function resetOrderButton() {
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.classList.remove('processing-btn');
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = 'Place Order <i class="fas fa-check"></i>';
    }
    
    // Also reset processing screen
    document.body.classList.remove('processing');
    document.getElementById('processing-screen').style.display = 'none';
    isProcessingOrder = false;
}

function resetCreateProfileButton() {
    const createProfileBtn = document.getElementById('create-profile-btn');
    if (createProfileBtn) {
        createProfileBtn.classList.remove('processing-btn');
        createProfileBtn.disabled = false;
        createProfileBtn.textContent = 'Create Profile & Continue';
    }
}

function resetUpdateProfileButton() {
    const updateProfileBtn = document.querySelector('#edit-profile-page .btn-primary');
    if (updateProfileBtn) {
        updateProfileBtn.classList.remove('processing-btn');
        updateProfileBtn.disabled = false;
        updateProfileBtn.textContent = 'Update Profile';
    }
}

// ==================== MINIMUM ORDER AMOUNT CHECK ====================
function checkMinimumOrderAmount() {
    const total = calculateCartTotal();
    const minOrderMessage = document.getElementById('min-order-message');
    
    if (total < MINIMUM_ORDER_AMOUNT && total > 0) {
        minOrderMessage.style.display = 'block';
        return false;
    } else {
        minOrderMessage.style.display = 'none';
        return true;
    }
}

// ==================== REAL-TIME STOCK CHECK ====================
async function performRealTimeStockCheck() {
    if (!navigator.onLine) {
        return { removedItems: [], cartUpdated: false };
    }

    try {
        const response = await fetch(BACKEND_CONFIG.items.url);
        if (!response.ok) {
            throw new Error('Failed to fetch stock data');
        }

        const data = await response.json();
        if (data.status !== 'success' || !data.data) {
            throw new Error('Invalid response from server');
        }

        // Create a map of current stock from backend
        const currentStockMap = {};
        data.data.forEach(item => {
            if (item.Name && item.Stock !== undefined) {
                currentStockMap[item.Name.trim().toLowerCase()] = {
                    stock: parseFloat(item.Stock) || 0,
                    unit: (item.Unit || 'kg').toLowerCase()
                };
            }
        });

        let removedItems = [];
        let cartUpdated = false;
        const cartCopy = { ...cart };

        // Check each item in cart against current stock
        for (const productId in cartCopy) {
            const cartItem = cartCopy[productId];
            const productName = cartItem.name.trim().toLowerCase();
            
            if (!currentStockMap[productName]) {
                removedItems.push({
                    name: cartItem.name,
                    reason: 'Product no longer available'
                });
                delete cart[productId];
                cartUpdated = true;
                continue;
            }

            const currentStock = currentStockMap[productName];
            let cartQuantity = cartItem.qty;
            let productUnit = cartItem.unit.toLowerCase();
            let currentStockUnit = currentStock.unit.toLowerCase();

            // Convert to common unit for comparison
            let cartQuantityInBaseUnit = convertToBaseUnit(cartQuantity, productUnit);
            let currentStockInBaseUnit = convertToBaseUnit(currentStock.stock, currentStockUnit);

            if (cartQuantityInBaseUnit > currentStockInBaseUnit || currentStockInBaseUnit <= 0) {
                removedItems.push({
                    name: cartItem.name,
                    reason: currentStockInBaseUnit <= 0 ? 'Out of stock' : 'Insufficient stock'
                });
                delete cart[productId];
                cartUpdated = true;
                
                // Update button state on product card
                const btn = document.getElementById('btn-' + productId);
                if (btn) {
                    const product = findProductById(productId);
                    if (product) {
                        const stockStatus = getStockStatus(product.stock, product.unit);
                        if (stockStatus.status === 'out') {
                            btn.classList.remove('added');
                            btn.innerText = 'Out of Stock';
                            btn.disabled = true;
                        } else {
                            btn.classList.remove('added');
                            btn.innerText = 'ADD +';
                            btn.disabled = false;
                        }
                    }
                }
            }
        }

        // Update cart icon if cart was updated
        if (cartUpdated) {
            updateCartIcon();
            localStorage.setItem('vegCart', JSON.stringify(cart));
            
            // Update cart display if on review page
            if (document.getElementById('review-page').classList.contains('active')) {
                updateCartDisplay();
            }
        }

        return { removedItems, cartUpdated };

    } catch (error) {
        console.error('Error in real-time stock check:', error);
        showNotification('Unable to check stock. Please try again.', 'error');
        return { removedItems: [], cartUpdated: false };
    }
}

// Helper function to convert to base unit (grams/ml/pieces)
function convertToBaseUnit(quantity, unit) {
    unit = unit.toLowerCase();
    
    if (unit === 'kg' || unit === 'ltr') {
        return quantity * 1000;
    } else if (unit === 'g' || unit === 'ml' || unit === 'pcs' || unit === 'piece') {
        return quantity;
    } else if (unit === 'dozen') {
        return quantity * 12;
    } else if (unit === 'pack') {
        return quantity;
    }
    
    return quantity;
}

function showStockAlert(removedItems) {
    const stockAlert = document.getElementById('stock-alert');
    const removedList = document.getElementById('removed-items-list');
    
    removedList.innerHTML = '';
    removedItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} (${item.reason})`;
        removedList.appendChild(li);
    });
    
    stockAlert.classList.add('active');
}

function closeStockAlert() {
    document.getElementById('stock-alert').classList.remove('active');
    if (document.getElementById('review-page').classList.contains('active')) {
        goToReview();
    }
}

// ==================== ORDER CANCELLATION SYSTEM ====================
function setupCancelButton(orderId, orderTime) {
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-order-btn';
    cancelButton.innerHTML = '<i class="fab fa-whatsapp"></i> Cancel Order';
    
    const orderDate = new Date(orderTime);
    const currentTime = new Date();
    const timeDiff = currentTime - orderDate;
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeDiff < fiveMinutes) {
        cancelButton.onclick = function() {
            const message = `Hi, I am ${userProfile.name} (${userProfile.phone}), I Request cancel this Order ${orderId}`;
            const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        };
        
        const timeLeft = fiveMinutes - timeDiff;
        setTimeout(() => {
            cancelButton.style.display = 'none';
        }, timeLeft);
        
        return cancelButton;
    }
    
    return null;
}

// ==================== PRODUCT MANAGEMENT ====================
async function loadProducts(forceRefresh = false) {
    if (!navigator.onLine) {
        showNotification('No internet connection. Please check your network.', 'error');
        return;
    }

    try {
        const response = await fetch(BACKEND_CONFIG.items.url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            // Clear existing products
            products = {
                vegetables: [],
                fruits: [],
                dairy: [],
                grocery: [],
                kitchen: [],
                special: []
            };

            // Process the data from sheet
            data.data.forEach(item => {
                if (!item.Name) return;
                
                const product = {
                    id: item.id || generateId(item.Name),
                    name: item.Name || '',
                    hindi: item.Hindi || item.Name || '',
                    price: parseFloat(item.Price) || 0,
                    unit: item.Unit || 'kg',
                    stock: parseFloat(item.Stock) || 0,
                    img: item.ImageURL || getDefaultImage(item.Category),
                    category: item.Category || 'vegetables',
                    customQuantity: item.CustomQuantity || '250,500,1000,2000'
                };

                // Normalize unit
                product.unit = product.unit.toLowerCase().trim();
                
                // Add to appropriate category
                const category = product.category.toLowerCase();
                if (products[category]) {
                    products[category].push(product);
                } else {
                    products.vegetables.push(product);
                }
            });

            // Update UI
            initSpecialItems();
            
            // Update current page if it's a product page
            updateCurrentPageProducts();
            
        } else {
            throw new Error(data.message || 'Invalid data format from sheet');
        }

    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Failed to load products. Please check your connection.', 'error');
    }
}

function updateCurrentPageProducts() {
    const currentPage = document.querySelector('.page.active');
    if (!currentPage) return;
    
    const pageId = currentPage.id;
    
    if (pageId === 'category-page') {
        const catTitle = document.getElementById('cat-title').textContent;
        const catKey = getCategoryKeyByName(catTitle);
        const list = products[catKey] || [];
        renderProducts(list, 'cat-products');
    } else if (pageId === 'home-page') {
        initSpecialItems();
    }
    
    // Also update search page if open
    if (document.getElementById('search-page').style.display !== 'none') {
        performSearch();
    }
}

function generateId(name) {
    return 'p' + Math.random().toString(36).substr(2, 9) + 
           '_' + name.replace(/\s+/g, '').toLowerCase();
}

function getDefaultImage(category) {
    const defaultImages = {
        vegetables: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=400&q=80',
        fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
        dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80',
        grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        kitchen: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=400&q=80',
        special: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=400&q=80'
    };
    return defaultImages[category?.toLowerCase()] || defaultImages.vegetables;
}

function getStockStatus(stock, unit) {
    const formattedStock = stock.toFixed(2);
    
    if (stock <= 0) {
        return { status: 'out', text: 'Out of Stock' };
    } else if (stock < 2) {
        return { status: 'low', text: `Only ${formattedStock} ${unit} left` };
    } else {
        return { status: 'available', text: `${formattedStock} ${unit} available` };
    }
}

function findProductById(productId) {
    for (const category in products) {
        if (products[category]) {
            const product = products[category].find(p => p.id === productId);
            if (product) return product;
        }
    }
    return null;
}

// ==================== THEME MANAGEMENT ====================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (darkMode) {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.checked = false;
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    
    if (darkMode) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// ==================== NAVIGATION FUNCTIONS ====================
function switchPage(pageId) {
    // Always scroll to top when switching pages
    window.scrollTo(0, 0);
    
    // Add to history stack
    if (pageId !== currentPage) {
        historyStack.push(pageId);
        currentPage = pageId;
    }
    
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.classList.add('active');
    }
    
    const searchBarContainer = document.getElementById('search-bar-container');
    if (pageId === 'home-page') {
        searchBarContainer.style.display = 'block';
    } else {
        searchBarContainer.style.display = 'none';
    }
    
    // Floating cart visibility control
    const floatCart = document.getElementById('floating-cart');
    if (pageId === 'home-page' || pageId === 'category-page') {
        if (Object.keys(cart).length > 0) {
            floatCart.style.display = 'flex';
        } else {
            floatCart.style.display = 'none';
        }
    } else {
        floatCart.style.display = 'none';
    }
    
    if (pageId === 'review-page') {
        updateCartDisplay();
        // Check minimum order amount
        checkMinimumOrderAmount();
        resetOrderButton();
    }
    
    // Update cart icon for all pages
    updateCartIcon();
    
    // Push state to history for back button
    window.history.pushState({ page: pageId }, '', '');
}

function goBack() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const currentPageId = activePage.id;
    
    // Block back button for specific pages
    if (currentPageId === 'order-history-page' || 
        currentPageId === 'edit-profile-page' || 
        currentPageId === 'order-details-page') {
        return;
    }
    
    // Handle specific pages based on requirements
    switch(currentPageId) {
        case 'category-page':
        case 'review-page':
        case 'profile-page':
        case 'edit-profile-page':
        case 'order-history-page':
        case 'order-details-page':
            goToHome();
            break;
            
        case 'account-page':
            goToHome();
            break;
            
        default:
            goToHome();
    }
}

function goToHome() {
    switchPage('home-page');
}

function openProfile() {
    if (userProfile) {
        updateProfilePage();
        switchPage('profile-page');
    } else {
        switchPage('account-page');
    }
}

function openEditProfile() {
    document.getElementById('edit-u-name').value = userProfile.name;
    document.getElementById('edit-u-phone').value = userProfile.phone;
    document.getElementById('edit-u-landmark').value = userProfile.landmark;
    document.getElementById('edit-u-village').value = userProfile.village;
    
    switchPage('edit-profile-page');
}

function checkUser() {
    if (userProfile) {
        document.getElementById('new-user-form').style.display = 'none';
        document.getElementById('existing-user-view').style.display = 'block';
        updateProfileView();
        switchPage('home-page');
        
        // Start auto-update interval
        startAutoUpdate();
    } else {
        document.getElementById('new-user-form').style.display = 'block';
        document.getElementById('existing-user-view').style.display = 'none';
        switchPage('account-page');
    }
}

// ==================== PROFILE MANAGEMENT ====================
async function createProfile() {
    const name = document.getElementById('u-name').value.trim();
    const phone = document.getElementById('u-phone').value.trim();
    const landmark = document.getElementById('u-landmark').value.trim();
    const village = document.getElementById('u-village').value;

    if (!name || !phone || !landmark || !village) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }

    if (!navigator.onLine) {
        showNotification('No internet connection. Please check your network.', 'error');
        return;
    }

    const btn = document.getElementById('create-profile-btn');
    btn.classList.add('processing-btn');
    btn.disabled = true;

    try {
        const customerData = { 
            name, 
            phone, 
            landmark, 
            village,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(BACKEND_CONFIG.customer.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            userProfile = customerData;
            localStorage.setItem('vegCartUser', JSON.stringify(userProfile));
            
            showNotification('Profile created successfully!', 'success');
            
            // Load fresh products
            await loadProducts(true);
            
            // Start auto-update
            startAutoUpdate();
            
            setTimeout(() => {
                checkUser();
            }, 1000);
        } else {
            throw new Error(result.message || 'Failed to save profile');
        }
        
    } catch (error) {
        console.error('Profile creation error:', error);
        showNotification(`Profile creation failed: ${error.message}`, 'error');
        resetCreateProfileButton();
    } finally {
        resetCreateProfileButton();
    }
}

async function updateProfile() {
    const name = document.getElementById('edit-u-name').value.trim();
    const phone = document.getElementById('edit-u-phone').value.trim();
    const landmark = document.getElementById('edit-u-landmark').value.trim();
    const village = document.getElementById('edit-u-village').value;

    if (!name || !phone || !landmark || !village) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }

    if (!navigator.onLine) {
        showNotification('No internet connection. Please check your network.', 'error');
        return;
    }

    const btn = document.querySelector('#edit-profile-page .btn-primary');
    btn.classList.add('processing-btn');
    btn.disabled = true;

    try {
        const customerData = { 
            name, 
            phone, 
            landmark, 
            village,
            timestamp: new Date().toISOString(),
            action: 'update'
        };

        const response = await fetch(BACKEND_CONFIG.customer.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            userProfile = customerData;
            localStorage.setItem('vegCartUser', JSON.stringify(userProfile));
            
            showNotification('Profile updated successfully!', 'success');
            
            setTimeout(() => {
                updateProfilePage();
                switchPage('profile-page');
            }, 1000);
        } else {
            throw new Error(result.message || 'Failed to update profile');
        }
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification(`Profile update failed: ${error.message}`, 'error');
        resetUpdateProfileButton();
    } finally {
        resetUpdateProfileButton();
    }
}

function editProfile() {
    document.getElementById('new-user-form').style.display = 'block';
    document.getElementById('existing-user-view').style.display = 'none';
    document.getElementById('u-name').value = userProfile.name;
    document.getElementById('u-phone').value = userProfile.phone;
    document.getElementById('u-landmark').value = userProfile.landmark;
    document.getElementById('u-village').value = userProfile.village;
}

function updateProfileView() {
    document.getElementById('d-name').innerText = userProfile.name;
    document.getElementById('d-phone').innerText = userProfile.phone;
    document.getElementById('d-address').innerText = userProfile.village + ", " + userProfile.landmark;
}

function updateProfilePage() {
    document.getElementById('profile-name').innerText = userProfile.name;
    document.getElementById('profile-phone').innerText = userProfile.phone;
}

// ==================== HOME PAGE FUNCTIONS ====================
function initSpecialItems() {
    const container = document.getElementById('special-scroll');
    container.innerHTML = '';
    
    const specialItems = products.special.slice(0, 6);
    
    specialItems.forEach(p => {
        const stockStatus = getStockStatus(p.stock, p.unit);
        
        const item = document.createElement('div');
        item.className = 'special-item';
        
        if (stockStatus.status === 'out') {
            item.innerHTML += `<div class="out-of-stock-badge">Out of Stock</div>`;
        } else if (stockStatus.status === 'low') {
            item.innerHTML += `<div class="low-stock-badge">Low Stock</div>`;
        }
        
        item.innerHTML += `
            <img src="${p.img}" onerror="this.src='${getDefaultImage(p.category)}'">
            <div class="p-name">${p.name}</div>
            <div class="p-price">₹${p.price}/${p.unit}</div>
            <button class="btn-add" onclick="openQtyModal('${p.id}')" id="btn-${p.id}"
                    ${stockStatus.status === 'out' ? 'disabled' : ''}>
                ${stockStatus.status === 'out' ? 'Out of Stock' : 'ADD +'}
            </button>
        `;
        container.appendChild(item);
    });
}

function openCategory(catKey, catName) {
    document.getElementById('cat-title').innerText = catName;
    const list = products[catKey] || [];
    renderProducts(list, 'cat-products');
    switchPage('category-page');
}

function getCategoryKeyByName(name) {
    const categoryMap = {
        'सब्जियां': 'vegetables',
        'फल': 'fruits',
        'डेरी उत्पाद': 'dairy',
        'परचून': 'grocery',
        'किचन': 'kitchen',
        'Special': 'special'
    };
    return categoryMap[name] || 'vegetables';
}

function renderProducts(list, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <i class="fas fa-box-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>No products available in this category</p>
            </div>
        `;
        return;
    }
    
    list.forEach(p => {
        const inCart = cart[p.id];
        const stockStatus = getStockStatus(p.stock, p.unit);
        const isOutOfStock = stockStatus.status === 'out';
        
        let btnText = 'ADD +';
        let btnClass = 'btn-add';
        
        if (isOutOfStock) {
            btnText = 'Out of Stock';
            btnClass += ' disabled';
        } else if (inCart) {
            btnText = `${formatQty(inCart.qty, p.unit)} Added`;
            btnClass += ' added';
        }
        
        const item = document.createElement('div');
        item.className = 'product-item';
        
        if (stockStatus.status === 'out') {
            item.innerHTML += `<div class="out-of-stock-badge">Out of Stock</div>`;
        } else if (stockStatus.status === 'low') {
            item.innerHTML += `<div class="low-stock-badge">Low Stock</div>`;
        }
        
        item.innerHTML += `
            <img src="${p.img}" class="product-img" 
                 onerror="this.src='${getDefaultImage(p.category)}'">
            <div class="product-details">
                <div class="p-name">${p.name}</div>
                <div class="p-hindi">${p.hindi}</div>
                <div class="p-price">₹${p.price}/${p.unit}</div>
                <div class="p-stock ${stockStatus.status}">
                    <i class="fas fa-${stockStatus.status === 'out' ? 'times-circle' : 
                                    stockStatus.status === 'low' ? 'exclamation-circle' : 
                                    'check-circle'}"></i>
                    ${stockStatus.text}
                </div>
                <button class="${btnClass}" onclick="openQtyModal('${p.id}')" 
                        id="btn-${p.id}" ${isOutOfStock ? 'disabled' : ''}>
                    ${btnText}
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// ==================== SEARCH FUNCTIONS ====================
function openSearch() {
    lastScrollPosition = window.pageYOffset;
    
    document.getElementById('search-page').style.display = 'block';
    document.getElementById('search-input').focus();
    performSearch();
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const container = document.getElementById('search-results');
    container.innerHTML = '';

    if(query.length < 2) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-light);">
                <p>Type at least 2 characters to search</p>
            </div>
        `;
        return;
    }

    if (!recentSearches.includes(query)) {
        recentSearches.unshift(query);
        if (recentSearches.length > 3) {
            recentSearches.pop();
        }
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }

    let results = [];
    Object.keys(products).forEach(key => {
        if (products[key]) {
            products[key].forEach(p => {
                if(p.name.toLowerCase().includes(query) || p.hindi.toLowerCase().includes(query)) {
                    results.push(p);
                }
            });
        }
    });

    renderProducts(results, 'search-results');
}

// ==================== CART FUNCTIONS ====================
function openQtyModal(pid) {
    // Save current scroll position before opening modal
    modalOpenScrollPosition = window.pageYOffset;
    lastScrollPosition = window.pageYOffset;
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    let found = null;
    Object.keys(products).forEach(k => {
        if (products[k]) {
            const item = products[k].find(i => i.id === pid);
            if(item) found = item;
        }
    });
    
    currentProduct = found;

    if (!currentProduct) {
        showNotification('Product not found!', 'error');
        // Re-enable body scroll
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
        return;
    }

    const stockStatus = getStockStatus(currentProduct.stock, currentProduct.unit);
    if (stockStatus.status === 'out') {
        showNotification('This product is out of stock!', 'error');
        // Re-enable body scroll
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
        return;
    }

    document.getElementById('modal-p-name').innerText = currentProduct.name + " (" + currentProduct.hindi + ")";
    
    const stockInfo = document.getElementById('modal-stock-info');
    stockInfo.textContent = `Stock: ${currentProduct.stock.toFixed(2)} ${currentProduct.unit} available`;
    stockInfo.className = `stock-info ${stockStatus.status}`;
    
    const slider = document.getElementById('qty-slider');
    const presets = document.getElementById('qty-presets');
    const confirmBtn = document.getElementById('confirm-add-btn');
    presets.innerHTML = '';

    slider.oninput = null;

    // Set slider limits based on unit type
    let maxLimit = 5;
    let step = 1;
    let min = 0.05;
    let max = Math.min(maxLimit, currentProduct.stock);
    
    if (currentProduct.unit === 'kg' || currentProduct.unit === 'ltr') {
        step = 0.05;
        min = 0.05;
        max = Math.min(maxLimit, currentProduct.stock);
    } else if (currentProduct.unit === 'dozen') {
        step = 0.5;
        min = 0.5;
        max = Math.min(maxLimit, currentProduct.stock);
    } else if (currentProduct.unit === 'pcs' || currentProduct.unit === 'pack') {
        step = 1;
        min = 1;
        max = Math.min(maxLimit, currentProduct.stock);
    }

    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = cart[pid] ? cart[pid].qty : min;

    // Create preset buttons with display in grams/kg format
    const presetValues = getPresetValuesForUnit(currentProduct.unit);
    
    presetValues.forEach(val => {
        if (val <= max) {
            const pill = document.createElement('div');
            pill.className = 'qty-pill';
            let displayText = '';
            if (currentProduct.unit === 'kg' || currentProduct.unit === 'ltr') {
                if (val < 1) {
                    displayText = (val * 1000) + (currentProduct.unit === 'kg' ? 'g' : 'ml');
                } else {
                    displayText = val.toFixed(2) + ' ' + currentProduct.unit;
                }
            } else {
                displayText = val + ' ' + currentProduct.unit;
            }
            pill.innerText = displayText;
            pill.onclick = () => { 
                updateSlider(val); 
                updateActivePill(pill); 
            };
            presets.appendChild(pill);
        }
    });

    document.getElementById('qty-modal').classList.add('active');
    updateModalUI();

    slider.oninput = function() {
        updateModalUI();
        document.querySelectorAll('.qty-pill').forEach(p => p.classList.remove('active'));
    };

    if (cart[pid]) {
        confirmBtn.textContent = 'Update Cart';
    } else {
        confirmBtn.textContent = 'Add to Cart';
    }
}

function getPresetValuesForUnit(unit) {
    if (unit === 'kg' || unit === 'ltr') {
        return [0.1, 0.25, 0.5, 2];
    } else if (unit === 'dozen') {
        return [0.5, 1, 2, 3];
    } else {
        return [1, 2, 3, 5];
    }
}

function changeSliderValue(direction) {
    const slider = document.getElementById('qty-slider');
    const step = parseFloat(slider.step);
    const currentValue = parseFloat(slider.value);
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    
    let newValue = currentValue + (direction * step);
    
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    slider.value = newValue;
    updateModalUI();
    document.querySelectorAll('.qty-pill').forEach(p => p.classList.remove('active'));
}

function updateSlider(val) {
    const slider = document.getElementById('qty-slider');
    slider.value = val;
    updateModalUI();
}

function updateActivePill(activePill) {
    document.querySelectorAll('.qty-pill').forEach(p => p.classList.remove('active'));
    activePill.classList.add('active');
}

function updateModalUI() {
    const val = parseFloat(document.getElementById('qty-slider').value);
    const unit = currentProduct.unit;
    const confirmBtn = document.getElementById('confirm-add-btn');
    
    // Format quantity display
    let displayQty = '';
    if (unit === 'kg' || unit === 'ltr') {
        if (val < 1) {
            displayQty = (val * 1000).toFixed(0) + (unit === 'kg' ? 'g' : 'ml');
        } else {
            displayQty = val.toFixed(2) + ' ' + unit;
        }
    } else if (unit === 'dozen') {
        if (val < 1) {
            displayQty = (val * 12).toFixed(0) + ' pcs';
        } else {
            displayQty = val.toFixed(1) + ' dozen';
        }
    } else {
        displayQty = Math.round(val) + ' ' + unit;
    }
    
    document.getElementById('live-qty').innerText = displayQty;

    let price = calculateItemPrice(currentProduct.price, val, unit);
    document.getElementById('live-price').innerText = "Price: ₹" + Math.ceil(price);

    let exceedsStock = false;
    if (val > currentProduct.stock) {
        exceedsStock = true;
        confirmBtn.disabled = true;
        confirmBtn.textContent = `Max ${currentProduct.stock.toFixed(2)} ${unit} available`;
    }

    if (!exceedsStock) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = cart[currentProduct.id] ? 'Update Cart' : 'Add to Cart';
    }
}

function confirmAddToCart() {
    const val = parseFloat(document.getElementById('qty-slider').value);
    const unit = currentProduct.unit;
    
    // Check if quantity exceeds stock
    if (val > currentProduct.stock) {
        showNotification('Quantity exceeds available stock!', 'error');
        return;
    }

    // Update or add to cart
    cart[currentProduct.id] = {
        ...currentProduct,
        qty: val
    };
    
    // Save cart to localStorage
    localStorage.setItem('vegCart', JSON.stringify(cart));
    
    closeModal();
    updateCartIcon();
    
    // Update button on product card
    const btn = document.getElementById('btn-' + currentProduct.id);
    if(btn) {
        btn.classList.add('added');
        btn.innerText = formatQty(val, currentProduct.unit) + " Added";
    }
    
    // Update cart display if we're on the cart page
    if (document.getElementById('review-page').classList.contains('active')) {
        updateCartDisplay();
    }
    
    showNotification('Item added to cart!', 'success');
}

function calculateItemPrice(price, qty, unit) {
    // Price calculation with unit conversion
    if (unit === 'kg' || unit === 'ltr') {
        return price * qty;
    } else if (unit === 'g' || unit === 'ml') {
        return (price / 1000) * qty;
    } else {
        return price * qty;
    }
}

function updateCartIcon() {
    const keys = Object.keys(cart);
    let count = keys.length;
    let total = 0;

    keys.forEach(k => {
        const item = cart[k];
        total += calculateItemPrice(item.price, item.qty, item.unit);
    });

    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = "₹" + Math.ceil(total);

    const floatCart = document.getElementById('floating-cart');
    const currentPage = document.querySelector('.page.active').id;
    
    // Floating cart only on home and category pages
    if (count > 0 && (currentPage === 'home-page' || currentPage === 'category-page')) {
        floatCart.style.display = 'flex';
    } else {
        floatCart.style.display = 'none';
    }
}

function updateCartDisplay() {
    const list = document.getElementById('order-items-list');
    const totalSection = document.getElementById('final-total');
    
    if (Object.keys(cart).length === 0) {
        list.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <h3>Your cart is empty</h3>
                <p>Add some delicious vegetables and fruits to get started!</p>
                <button class="btn-start-shopping" onclick="goToHome()">
                    Start Shopping <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        totalSection.innerText = '₹0';
        return;
    }

    list.innerHTML = '';
    let total = 0;

    Object.keys(cart).forEach(k => {
        const item = cart[k];
        let itemTotal = calculateItemPrice(item.price, item.qty, item.unit);
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-qty">${formatQty(item.qty, item.unit)}</div>
            </div>
            <div class="cart-item-price">₹${Math.ceil(itemTotal)}</div>
            <div class="cart-actions">
                <button class="action-btn edit-btn" onclick="openEditModal('${item.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn remove-btn" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(div);
    });

    totalSection.innerText = "₹" + Math.ceil(total);
    
    // Check minimum order amount
    checkMinimumOrderAmount();
    
    // Update delivery address
    if (userProfile) {
        document.getElementById('deliver-to-address').innerText = 
            userProfile.name + ", " + userProfile.village + ", " + userProfile.landmark;
    }
}

function formatQty(val, unit) {
    if(unit === 'kg' || unit === 'ltr') {
        if(val < 1) {
            const gramValue = val * 1000;
            return Math.round(gramValue) + " " + (unit === 'kg' ? 'g' : 'ml');
        }
        return val.toFixed(2) + " " + unit;
    }
    
    if(unit === 'dozen') {
        if (val < 1) {
            const pieces = val * 12;
            return pieces + " pcs";
        }
        return val + " Dozen";
    }
    
    return Math.round(val) + " " + unit;
}

// ==================== ORDER REVIEW ====================
function goToReview() {
    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }
    
    // Check minimum order amount
    if (!checkMinimumOrderAmount()) {
        showNotification(`Minimum order amount is ₹${MINIMUM_ORDER_AMOUNT}`, 'error');
    }
    
    resetOrderButton();
    switchPage('review-page');
}

function openEditModal(productId) {
    const product = cart[productId];
    if (product) {
        currentProduct = product;
        openQtyModal(productId);
    }
}

function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
        localStorage.setItem('vegCart', JSON.stringify(cart));
        
        // Update cart display
        updateCartDisplay();
        updateCartIcon();
        
        // Update button on product card
        const btn = document.getElementById('btn-' + productId);
        if(btn) {
            const product = findProductById(productId);
            if (product) {
                const stockStatus = getStockStatus(product.stock, product.unit);
                if (stockStatus.status === 'out') {
                    btn.classList.remove('added');
                    btn.innerText = 'Out of Stock';
                    btn.disabled = true;
                } else {
                    btn.classList.remove('added');
                    btn.innerText = 'ADD +';
                    btn.disabled = false;
                }
            }
        }
        
        showNotification('Removed from cart', 'warning');
    }
}

function calculateCartTotal() {
    let total = 0;
    Object.keys(cart).forEach(k => {
        const item = cart[k];
        total += calculateItemPrice(item.price, item.qty, item.unit);
    });
    return total;
}

// ==================== ORDER PLACEMENT ====================
async function placeOrder() {
    if (isProcessingOrder) {
        showNotification('Please wait, order is being processed...', 'warning');
        return;
    }

    if (Object.keys(cart).length === 0) {
        showNotification('Your cart is empty!', 'warning');
        return;
    }

    // Check minimum order amount
    const total = calculateCartTotal();
    if (total < MINIMUM_ORDER_AMOUNT) {
        showNotification(`Minimum order amount is ₹${MINIMUM_ORDER_AMOUNT}. Please add more items.`, 'error');
        return;
    }

    if (!userProfile) {
        showNotification('Please create a profile first', 'error');
        switchPage('account-page');
        return;
    }

    if (!navigator.onLine) {
        showNotification('No internet connection. Cannot place order.', 'error');
        return;
    }

    isProcessingOrder = true;
    
    // Show processing screen
    document.body.classList.add('processing');
    document.getElementById('processing-screen').style.display = 'flex';
    
    // Change button to processing state
    const placeOrderBtn = document.getElementById('place-order-btn');
    placeOrderBtn.classList.add('processing-btn');
    placeOrderBtn.disabled = true;

    try {
        // Step 1: Perform real-time stock check
        const { removedItems, cartUpdated } = await performRealTimeStockCheck();
        
        // Step 2: If items were removed due to stock issues, show alert
        if (removedItems.length > 0) {
            // Hide processing screen
            document.body.classList.remove('processing');
            document.getElementById('processing-screen').style.display = 'none';
            
            // Show stock alert popup
            showStockAlert(removedItems);
            
            // Update cart display
            updateCartDisplay();
            updateCartIcon();
            
            isProcessingOrder = false;
            resetOrderButton();
            return;
        }
        
        // Step 3: If cart is empty after stock check
        if (Object.keys(cart).length === 0) {
            document.body.classList.remove('processing');
            document.getElementById('processing-screen').style.display = 'none';
            
            showNotification('All items in your cart are out of stock. Please add available items.', 'error');
            goToHome();
            isProcessingOrder = false;
            resetOrderButton();
            return;
        }

        // Step 4: Prepare order data
        const orderData = {
            name: userProfile.name,
            phone: userProfile.phone,
            landmark: userProfile.landmark,
            village: userProfile.village,
            items: Object.keys(cart).map(key => {
                const item = cart[key];
                return {
                    id: item.id,
                    name: item.name,
                    hindi: item.hindi,
                    quantity: item.qty,
                    unit: item.unit,
                    price: item.price
                };
            }),
            total: Math.ceil(calculateCartTotal()),
            timestamp: new Date().toISOString()
        };

        // Step 5: Send to order backend
        const orderResponse = await fetch(BACKEND_CONFIG.order.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            throw new Error(`Order server responded with ${orderResponse.status}`);
        }

        const orderResult = await orderResponse.json();

        if (orderResult.status === 'success') {
            // Store cart keys before clearing to reset buttons
            const cartKeys = Object.keys(cart);
            
            // Clear cart after successful order
            cart = {};
            localStorage.setItem('vegCart', JSON.stringify(cart));
            
            // Update cart display
            updateCartDisplay();
            updateCartIcon();
            
            // Reset all product buttons that were in cart
            cartKeys.forEach(productId => {
                const btn = document.getElementById('btn-' + productId);
                if (btn) {
                    const product = findProductById(productId);
                    if (product) {
                        const stockStatus = getStockStatus(product.stock, product.unit);
                        if (stockStatus.status === 'out') {
                            btn.classList.remove('added');
                            btn.innerText = 'Out of Stock';
                            btn.disabled = true;
                        } else {
                            btn.classList.remove('added');
                            btn.innerText = 'ADD +';
                            btn.disabled = false;
                        }
                    }
                }
            });
            
            // Hide processing screen
            document.body.classList.remove('processing');
            document.getElementById('processing-screen').style.display = 'none';
            
            // Show success message with order ID
            document.getElementById('order-success-message').textContent = 
                'Your order has been placed successfully!';
            document.getElementById('order-id-display').textContent = 
                `Order ID: ${orderResult.orderId || 'N/A'}`;
            
            // Close cart page and show success popup
            switchPage('home-page');
            document.getElementById('order-success').classList.add('active');
            
            currentOrderId = orderResult.orderId;
            
            // Save order to localStorage for history
            saveOrderToLocal({
                ...orderData,
                date: new Date().toISOString(),
                orderId: orderResult.orderId || 'ORD' + Date.now(),
                status: 'Confirmed'
            });
            
            // Reload products to get updated stock
            await loadProducts(true);
            
            // Auto close popup after 4 seconds
            if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
            autoCloseTimeout = setTimeout(() => {
                closeOrderSuccess();
            }, 4000);
            
        } else {
            throw new Error(orderResult.message || 'Failed to place order');
        }
        
    } catch (error) {
        console.error("Order placement error:", error);
        
        // Hide processing screen
        document.body.classList.remove('processing');
        document.getElementById('processing-screen').style.display = 'none';
        
        // Show error message
        document.getElementById('error-message').textContent = 
            `Order failed: ${error.message}. Please try again.`;
        document.getElementById('order-error').classList.add('active');
        
        // Auto close error popup after 4 seconds
        if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
        autoCloseTimeout = setTimeout(() => {
            closeOrderError();
        }, 4000);
        
    } finally {
        isProcessingOrder = false;
        
        // Always reset button state
        resetOrderButton();
    }
}

function closeOrderSuccess() {
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
    document.getElementById('order-success').classList.remove('active');
    
    resetOrderButton();
    goToHome();
}

function closeOrderError() {
    if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
    document.getElementById('order-error').classList.remove('active');
    
    resetOrderButton();
}

// ==================== ORDER HISTORY ====================
function saveOrderToLocal(orderData) {
    let orders = JSON.parse(localStorage.getItem('userOrders')) || [];
    orders.unshift(orderData);
    
    // Keep only last 50 orders
    if (orders.length > 50) {
        orders = orders.slice(0, 50);
    }
    
    localStorage.setItem('userOrders', JSON.stringify(orders));
}

function viewOrderHistory() {
    // Get orders from localStorage
    let orders = JSON.parse(localStorage.getItem('userOrders')) || [];
    
    const container = document.getElementById('order-history-list');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="action-card">
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet.</p>
                <button class="btn-secondary" onclick="goToHome()">Start Shopping</button>
            </div>
        `;
        switchPage('order-history-page');
        return;
    }
    
    orders.forEach((order, index) => {
        const orderDate = new Date(order.date).toLocaleDateString('hi-IN');
        const orderTime = new Date(order.date).toLocaleTimeString('hi-IN', {hour: '2-digit', minute:'2-digit'});
        
        const orderCard = document.createElement('div');
        orderCard.className = 'action-card';
        orderCard.style.marginBottom = '15px';
        orderCard.innerHTML = `
            <h3>Order #${order.orderId || 'N/A'}</h3>
            <p><strong>Date:</strong> ${orderDate} at ${orderTime}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            <p><strong>Items:</strong> ${order.items.length} items</p>
            <p><strong>Status:</strong> ${order.status || 'Confirmed'}</p>
        `;
        
        // Add cancel button for recent orders (within 5 minutes)
        const cancelButton = setupCancelButton(order.orderId, order.date);
        if (cancelButton) {
            orderCard.appendChild(cancelButton);
        }
        
        const detailsButton = document.createElement('button');
        detailsButton.className = 'btn-secondary';
        detailsButton.textContent = 'View Details';
        detailsButton.onclick = () => viewOrderDetails(index);
        orderCard.appendChild(detailsButton);
        
        container.appendChild(orderCard);
    });
    
    switchPage('order-history-page');
}

function viewOrderDetails(orderIndex) {
    let orders = JSON.parse(localStorage.getItem('userOrders')) || [];
    const order = orders[orderIndex];
    
    if (!order) {
        showNotification('Order details not found!', 'error');
        return;
    }
    
    const orderDate = new Date(order.date).toLocaleDateString('hi-IN');
    const orderTime = new Date(order.date).toLocaleTimeString('hi-IN', {hour: '2-digit', minute:'2-digit'});
    
    const container = document.getElementById('order-details-content');
    container.innerHTML = `
        <div class="action-card" style="margin-bottom: 15px;">
            <h3>Order #${order.orderId || 'N/A'}</h3>
            <p><strong>Date:</strong> ${orderDate} at ${orderTime}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            <p><strong>Delivery Address:</strong> ${order.name}, ${order.village}, ${order.landmark}</p>
            <p><strong>Status:</strong> ${order.status || 'Confirmed'}</p>
        </div>
        <h3 style="margin: 15px 0 10px;">Items Ordered:</h3>
    `;
    
    order.items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        const itemTotal = calculateItemPrice(item.price, item.quantity, item.unit);
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-qty">${formatQty(item.quantity, item.unit)}</div>
            </div>
            <div class="cart-item-price">₹${Math.ceil(itemTotal)}</div>
        `;
        container.appendChild(itemDiv);
    });
    
    // Add cancel button for recent orders
    const cancelButton = setupCancelButton(order.orderId, order.date);
    if (cancelButton) {
        container.appendChild(cancelButton);
    }
    
    switchPage('order-details-page');
}

// ==================== HELPER FUNCTIONS ====================
function contactSupport() {
    alert("Customer Support:\n\n📱 Phone: +91-9876543210\n✉️ Email: support@vegcart.com\n\nWe're available 9 AM - 9 PM, 7 days a week.");
}

function openAbout() {
    alert("VegCart - Fresh Vegetables & Fruits Delivery\n\nWe deliver fresh vegetables and fruits directly to your doorstep. Serving villages around the area with quality products and timely delivery.\n\n📞 Contact: +91-9876543210\n📍 Location: Kalyanpur\n⏰ Delivery: 10 AM - 8 PM Daily");
}