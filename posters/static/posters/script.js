// 全域變數
let currentUser = null;
let offerPosters = [];
let posterPhotos = {};
let selectedCategories = [];
let currentCardIndex = 0;
let currentChatUser = null;

// 把原本的假資料改成空陣列，等待 API 填入
let mockPosters = [];

// 畫面切換
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ========== 登入 ==========
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser = document.getElementById('username').value;
    showScreen('setupStep1Screen');
});

// ========== 步驟 1：輸入想交換的海報 ==========
document.getElementById('addOfferBtn').addEventListener('click', () => {
    const input = document.getElementById('offerPoster');
    const posterName = input.value.trim();
    if (posterName) {
        offerPosters.push(posterName);
        updatePosterList();
        input.value = '';
    }
});

function updatePosterList() {
    const list = document.getElementById('offerList');
    list.innerHTML = '';
    offerPosters.forEach((poster, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${poster}
            <button onclick="removePoster(${index})">✕</button>
        `;
        list.appendChild(li);
    });
}

function removePoster(index) {
    offerPosters.splice(index, 1);
    delete posterPhotos[offerPosters[index]];
    updatePosterList();
}

// 步驟 1 下一步
document.getElementById('step1NextBtn').addEventListener('click', () => {
    if (offerPosters.length === 0) {
        alert('請至少新增一部想交換的海報！');
        return;
    }
    generatePhotoUploadFields();
    showScreen('setupStep2Screen');
});

// ========== 步驟 2：上傳海報照片 ==========
function generatePhotoUploadFields() {
    const container = document.getElementById('photoUploadList');
    container.innerHTML = '';
    
    offerPosters.forEach((posterName, index) => {
        const item = document.createElement('div');
        item.className = 'photo-upload-item';
        
        const uploadId = `upload-${index}`;
        const fileInputId = `file-${index}`;
        
        item.innerHTML = `
            <h4>${posterName}</h4>
            <label for="${fileInputId}" class="upload-btn" id="${uploadId}">
                <div class="upload-icon">📷</div>
                <div class="upload-text">點擊上傳海報照片</div>
            </label>
            <input type="file" id="${fileInputId}" accept="image/*" data-poster="${posterName}">
        `;
        
        container.appendChild(item);
        
        // 設定檔案上傳事件
        const fileInput = document.getElementById(fileInputId);
        fileInput.addEventListener('change', (e) => {
            handlePhotoUpload(e, posterName, uploadId);
        });
    });
}

function handlePhotoUpload(e, posterName, uploadId) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            posterPhotos[posterName] = event.target.result;
            
            // 更新上傳按鈕顯示
            const uploadBtn = document.getElementById(uploadId);
            uploadBtn.classList.add('has-photo');
            uploadBtn.innerHTML = `<img src="${event.target.result}" alt="${posterName}">`;
        };
        reader.readAsDataURL(file);
    }
}

// 步驟 2 按鈕
document.getElementById('step2BackBtn').addEventListener('click', () => {
    showScreen('setupStep1Screen');
});

document.getElementById('step2NextBtn').addEventListener('click', () => {
    // 檢查是否所有海報都已上傳照片
    const allUploaded = offerPosters.every(poster => posterPhotos[poster]);
    
    if (!allUploaded) {
        alert('請為每張海報上傳實體照片！');
        return;
    }
    
    showScreen('setupStep3Screen');
});

// ========== 步驟 3：選擇想要的種類 ==========
const categoryButtons = document.querySelectorAll('.category-btn');
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        
        if (btn.classList.contains('selected')) {
            btn.classList.remove('selected');
            const index = selectedCategories.indexOf(category);
            if (index > -1) {
                selectedCategories.splice(index, 1);
            }
        } else {
            if (selectedCategories.length < 3) {
                btn.classList.add('selected');
                selectedCategories.push(category);
            } else {
                alert('最多只能選擇3個種類！');
            }
        }
        
        updateSelectedCategories();
    });
});

function updateSelectedCategories() {
    const countSpan = document.getElementById('categoryCount');
    const listDiv = document.getElementById('selectedList');
    
    countSpan.textContent = `${selectedCategories.length}/3`;
    listDiv.innerHTML = '';
    
    selectedCategories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'selected-tag';
        tag.innerHTML = `
            ${category}
            <button onclick="removeCategory('${category}')">✕</button>
        `;
        listDiv.appendChild(tag);
    });
}

function removeCategory(category) {
    const index = selectedCategories.indexOf(category);
    if (index > -1) {
        selectedCategories.splice(index, 1);
    }
    
    categoryButtons.forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.remove('selected');
        }
    });
    
    updateSelectedCategories();
}

// 步驟 3 按鈕
document.getElementById('step3BackBtn').addEventListener('click', () => {
    showScreen('setupStep2Screen');
});

document.getElementById('step3CompleteBtn').addEventListener('click', () => {
    if (selectedCategories.length === 0) {
        alert('請至少選擇一個想要的海報種類！');
        return;
    }
    
    showScreen('swipeScreen');
    initializeCards();
});

// ========== 主滑動畫面 ==========
// 修改後的初始化函式
function initializeCards() {
    const cardStack = document.getElementById('cardStack');
    cardStack.innerHTML = '<p style="color:white; text-align:center;">載入中...</p>'; // 顯示載入中

    // 1. 使用 fetch 去呼叫我們剛剛寫的 Django API
    fetch('/api/posters/')
        .then(response => response.json())
        .then(data => {
            // 2. 把抓到的真資料，存進 mockPosters 變數裡
            mockPosters = data.posters;

            // 3. 清空載入文字
            cardStack.innerHTML = '';
            currentCardIndex = 0;

            // 4. 如果沒有資料
            if (mockPosters.length === 0) {
                cardStack.innerHTML = '<p style="text-align: center; color: #aaa;">目前沒有海報可交換！</p>';
                return;
            }

            // 5. 產生卡片 (這部分沿用你原本的邏輯)
            mockPosters.forEach((poster, index) => {
                const card = createCard(poster);
                // 修正 z-index 邏輯，避免數量變動時出錯
                card.style.zIndex = 1000 - index; 
                cardStack.appendChild(card);
            });

            if (mockPosters.length > 0) {
                setupCardInteraction(cardStack.firstChild);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            cardStack.innerHTML = '<p style="color:red; text-align:center;">載入失敗，請檢查網路</p>';
        });
}

function createCard(poster) {
    const card = document.createElement('div');
    card.className = 'poster-card';
    
    // 這裡把 tags 轉成 HTML span
    const categoryTags = poster.wantCategories.map(cat => 
        `<span class="card-tag">${cat}</span>`
    ).join('');
    
    card.innerHTML = `
        <img src="${poster.image}" alt="${poster.posterName}">
        
        <div class="card-info">
            <div class="card-info">
            <div>
                <h3>${poster.posterName}</h3>
                <p style="color: #888; font-size: 14px; margin-top: 4px;">
                    上傳者：${poster.user} <br>
                    <span style="color: #FFD700; font-weight: bold;">⭐ ${poster.rating}</span> 
                    <span style="font-size: 12px; margin-left: 5px;">（已完成 ${poster.tradeCount} 次交換）</span>
                </p>
            </div>

            <div>
                <p style="color: #aaa; font-size: 12px; margin-bottom: 5px;">想交換的類型：</p>
            <div class="card-tags">
                ${categoryTags}
            </div>
            </div>
        </div>
    `;
    return card;
}

function setupCardInteraction(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        card.classList.add('dragging');
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }
    
    function drag(e) {
        if (!isDragging) return;
        currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const deltaX = currentX - startX;
        const rotation = deltaX * 0.1;
        
        card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    }
    
    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 100) {
            if (deltaX > 0) {
                swipeRight(card);
            } else {
                swipeLeft(card);
            }
        } else {
            card.style.transform = '';
        }
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
    }
}

function swipeLeft(card) {
    card.style.transform = 'translateX(-150%) rotate(-30deg)';
    card.style.transition = 'transform 0.5s';
    
    setTimeout(() => {
        card.remove();
        currentCardIndex++;
        checkNextCard();
    }, 500);
}

function swipeRight(card) {
    card.style.transform = 'translateX(150%) rotate(30deg)';
    card.style.transition = 'transform 0.5s';
    
    setTimeout(() => {
        card.remove();
        currentCardIndex++;
        
        if (Math.random() > 0.5) {
            showMatch();
        } else {
            checkNextCard();
        }
    }, 500);
}

function checkNextCard() {
    const cardStack = document.getElementById('cardStack');
    if (cardStack.firstChild) {
        setupCardInteraction(cardStack.firstChild);
    } else {
        cardStack.innerHTML = '<p style="text-align: center; color: #aaa;">沒有更多海報了！</p>';
    }
}

document.getElementById('rejectBtn').addEventListener('click', () => {
    const card = document.querySelector('.poster-card');
    if (card) swipeLeft(card);
});

document.getElementById('likeBtn').addEventListener('click', () => {
    const card = document.querySelector('.poster-card');
    if (card) swipeRight(card);
});

// ========== 配對成功畫面 ==========
function showMatch() {
    const matchedPoster = mockPosters[currentCardIndex - 1];
    const firstPosterPhoto = posterPhotos[offerPosters[0]];
    
    document.getElementById('myMatchPoster').innerHTML = `<img src="${firstPosterPhoto}" alt="我的海報">`;
    document.getElementById('theirMatchPoster').innerHTML = `<img src="${matchedPoster.image}" alt="對方的海報">`;
    showScreen('matchScreen');
}

document.getElementById('startChatBtn').addEventListener('click', () => {
    currentChatUser = mockPosters[currentCardIndex - 1]?.user || '使用者';
    document.getElementById('chatUsername').textContent = currentChatUser;
    showScreen('chatScreen');
});

document.getElementById('continueSwipeBtn').addEventListener('click', () => {
    showScreen('swipeScreen');
    checkNextCard();
});

// ========== 聊天功能 ==========
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message) {
        addMessage(message, true);
        input.value = '';
        
        setTimeout(() => {
            addMessage('你好～我們來討論一下交換細節吧！', false);
        }, 1000);
    }
}

function addMessage(text, isSent) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

document.getElementById('backBtn').addEventListener('click', () => {
    showScreen('swipeScreen');
});

// ========== 標頭按鈕 ==========
document.getElementById('chatBtn').addEventListener('click', () => {
    alert('聊天列表功能開發中...');
});

document.getElementById('profileBtn').addEventListener('click', () => {
    alert('個人檔案功能開發中...');
});