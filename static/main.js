// 1. 顶部用户区域动态渲染
function updateUserArea() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (userId && username) {
        userArea.innerHTML = `
            <span class="user-info">欢迎，${username}</span>
            <button id="writeBtn" style="margin-left: 10px; background:#28a745;">发帖</button>
            <button id="logoutBtn" class="logout-btn">退出</button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                window.location.reload();
            });
        }
        const writeBtn = document.getElementById('writeBtn');
        if (writeBtn) {
            writeBtn.addEventListener('click', function() {
                window.location.href = '/write';
            });
        }
    } else {
        userArea.innerHTML = `
            <button id="loginBtn">登录</button>
            <button id="registerBtn" style="margin-left: 10px;">注册</button>
        `;
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                window.location.href = '/login';
            });
        }
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', function() {
                window.location.href = '/register';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // 2. 顶部用户区初始化
    updateUserArea();

    // 3. 首页导航按钮（如果有）
    const homeLink = document.getElementById('homeLink');
    if (homeLink) {
        homeLink.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // 4. 搜索框
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

    // 5. 加载帖子列表
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
                          <span>用户ID: ${post.user_id}</span> | 
                          <span>发布于: ${formattedDate}</span> | 
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
                postListDiv.innerHTML = '<div class="question-card"><h3>加载帖子失败</h3><p>' + (data.msg || '请重试') + '</p></div>';
            }
        })
        .catch(error => {
            console.error('网络错误:', error);
            const postListDiv = document.getElementById('postList');
            if (postListDiv) {
                postListDiv.innerHTML =
                    '<div class="question-card"><h3>加载失败</h3><p>请检查网络连接后重试</p></div>';
            }
        });

    // 6. （可选）动态右侧用户卡片，如果你有API可用就写，没有可以注释掉
    // fetch('/api/profile') ... // 根据你的后端实现决定要不要加
});
