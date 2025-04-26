// ========== 1. 顶部用户区 ==========

function updateUserArea() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (userId && username) {
        userArea.innerHTML = `
            <span class="user-info">Welcome, ${username}</span>
            <button class="post-btn" id="writeBtn">Post</button>
            <button class="logout-btn" id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            window.location.reload();
        });
        document.getElementById('writeBtn').addEventListener('click', function() {
            window.location.href = '/write';
        });
    } else {
        userArea.innerHTML = `
            <button id="loginBtn">Login</button>
            <button id="registerBtn" style="margin-left: 10px;">Register</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', function() {
            window.location.href = '/login';
        });
        document.getElementById('registerBtn').addEventListener('click', function() {
            window.location.href = '/register';
        });
    }
}


// ========== 2. 右侧栏：用户卡片渲染 ==========

function renderUserProfileLoading() {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.innerHTML = `<div style="text-align:center; padding: 30px;">加载中...</div>`;
    }
}

function renderUserProfileNotLogin() {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.innerHTML = `
            <img src="/static/avatar.png" class="avatar" id="avatar">
            <div class="user-info">
                <div class="username" id="username" style="color:#2196f3; font-weight:bold;">Without login in</div>
                <div class="stats">
                  <span>Blog <b id="postCount">0</b></span>
                  <span>Following <b id="followCount">0</b></span>
                </div>
            </div>
            <button class="write-btn" onclick="window.location.href='/login'">Login in</button>
        `;
    }
}

function renderUserProfileLogin(user) {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.innerHTML = `
            <img src="${user.avatar || '/static/avatar.png'}" alt="image" class="avatar" id="avatar">
            <div class="user-info">
                <div class="username" id="username" style="color:#2196f3; font-weight:bold;">${user.username}</div>
                <div class="stats">
                  <span>Blog <b id="postCount">${user.post_count || 0}</b></span>
                  <span>Following <b id="followCount">${user.follow_count || 0}</b></span>
                </div>
            </div>
            <button class="write-btn" onclick="window.location.href='/write'">Write Blog</button>
        `;
    }
}

// 动态加载右侧用户卡片
function loadUserProfile() {
    renderUserProfileLoading();
    const userId = localStorage.getItem('userId');
    if (!userId) {
        renderUserProfileNotLogin();
        return;
    }
    fetch(`/api/profile?user_id=${encodeURIComponent(userId)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 0 && data.user) {
                renderUserProfileLogin(data.user);
            } else {
                renderUserProfileNotLogin();
            }
        })
        .catch(() => {
            renderUserProfileNotLogin();
        });
}

// ========== 3. 帖子列表渲染 ==========

function loadPostList() {
    const searchInput = document.getElementById('searchInput');
    const urlParams = new URLSearchParams(window.location.search);
    const searchKey = urlParams.get('key');
    let apiUrl = '/api/posts';
    if (searchKey) {
        apiUrl += `?key=${encodeURIComponent(searchKey)}`;
        if (searchInput) searchInput.value = searchKey;
    }
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const postListDiv = document.getElementById('postList');
            if (!postListDiv) return;
            if (data.status === 0) {
                postListDiv.innerHTML = '';
                if (data.posts.length === 0) {
                    postListDiv.innerHTML = '<div class="question-card"><h3>暂无帖子</h3><p>快来发布第一篇帖子吧！</p></div>';
                    return;
                }
                data.posts.forEach(post => {
                    const date = new Date(post.create_time);
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                    const postCard = document.createElement('div');
                    postCard.className = 'question-card';
                    postCard.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
                        <div style="margin-top: 10px; font-size: 14px; color: #888;">
                          <span>User ID: ${post.user_id}</span> | 
                          <span>Post at: ${formattedDate}</span> | 
                          <span>👍 ${post.like_count}</span> | 
                          <span>💬 ${post.comment_count}</span>
                        </div>
                    `;
                    postCard.style.cursor = 'pointer';
                    postCard.addEventListener('click', function() {
                        window.location.href = `/blog/${post.id}`;
                    });
                    postListDiv.appendChild(postCard);
                });
            } else {
                postListDiv.innerHTML = '<div class="question-card"><h3>Loading Failed</h3><p>' + (data.msg || 'Try again') + '</p></div>';
            }
        })
        .catch(error => {
            console.error('Internet Error:', error);
            const postListDiv = document.getElementById('postList');
            if (postListDiv) {
                postListDiv.innerHTML =
                    '<div class="question-card"><h3>Loading Failed</h3><p>Please Check internet connect </p></div>';
            }
        });
}

// ========== 4. 搜索功能 ==========

function bindSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    window.location.href = `/?key=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
}

// ========== 5. 首页导航按钮（可选） ==========

function bindHomeLink() {
    const homeLink = document.getElementById('homeLink');
    if (homeLink) {
        homeLink.addEventListener('click', function() {
            window.location.href = '/';
        });
    }
}

// ========== 6. 页面初始化 ==========

document.addEventListener('DOMContentLoaded', function () {
    updateUserArea();
    loadUserProfile();
    loadPostList();
    bindSearchInput();
    bindHomeLink();
});
