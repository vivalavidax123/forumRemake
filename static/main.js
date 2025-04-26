// ========== 1. 顶部用户区 ==========

function updateUserArea() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    const avatar = localStorage.getItem('avatar');  // 读取最新头像
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (userId && username) {
        userArea.innerHTML = `
            <img src="${avatar || '/static/avatar/sunny_avatar.jpg'}" alt="avatar" class="user-avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;object-fit:cover;">
            <span class="user-info">Welcome, ${username}</span>
            <button class="post-btn" id="writeBtn">Post</button>
            <button class="logout-btn" id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar');
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
                <div class="username" id="username" style="color:#2196f3; font-weight:bold;">No login</div>
                <div class="stats">
                  <span>Blog <b id="postCount">0</b></span>
                  <span>Following <b id="followCount">0</b></span>
                </div>
            </div>
        `;
    }
}

function renderUserProfileLogin(user) {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.innerHTML = `
            <img src="${user.avatar || '/static/avatar.png'}" alt="用户头像" class="avatar" id="avatar">
            <div class="user-info">
                <div class="username" id="username">${user.username}</div>
                <div class="stats">
                  <span>Blog <b id="postCount">${user.post_count || 0}</b></span>
                  <span>Following <b id="followCount">${user.follow_count || 0}</b></span>
                </div>
            </div>
            <input type="file" id="avatarInput" accept="image/*" style="display:none;">
            <button class="write-btn" id="changeAvatarBtn">更改头像</button>
        `;
        // 绑定事件
        document.getElementById('changeAvatarBtn').onclick = function() {
            document.getElementById('avatarInput').click();
        };
        document.getElementById('avatarInput').onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            // 限制大小和类型可选
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                return;
            }
            // 上传文件到后端
            const userId = localStorage.getItem('userId');
            const formData = new FormData();
            formData.append('user_id', userId);
            formData.append('avatar', file);

            fetch('/api/user/avatar', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 0) {
                    // 1. 更新本地头像路径
                    localStorage.setItem('avatar', data.avatar || '/static/avatar.png');
                    // 2. 立刻刷新header头像
                    updateUserArea();
                    // 3. 侧边栏图片直接更
                    document.getElementById('avatar').src = data.avatar || '/static/avatar.png';
                    alert('头像更换成功！');
                } else {
                    alert(data.msg || '头像更换失败');
                }
            })
            .catch(() => alert('网络错误，头像上传失败'));
        };
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
        if (data.status === 0 && data.data) {
            renderUserProfileLogin(data.data);
            // 关键：同步最新头像到localStorage（header用到的）
            localStorage.setItem('avatar', data.data.avatar || '/static/avatar.png');
            // 同步更新header
            updateUserArea();
        } else {
            renderUserProfileNotLogin();
        }
    })
    .catch(() => {
        renderUserProfileNotLogin();
    });

}

// 页面加载后自动调用
document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile();
});

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

    const currentUserId = localStorage.getItem('userId');

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

                    // 检查当前用户是否是帖子作者
                    const isAuthor = currentUserId && post.user_id.toString() === currentUserId.toString();
                    
                    // 添加删除按钮（仅对作者显示）
                    const deleteButton = isAuthor ? 
                        `<button class="delete-post-btn" data-post-id="${post.id}">删除</button>` : '';
                    
                    // 检查当前用户是否已点赞这篇帖子
                    let likeButton = '';
                    if (currentUserId) {
                        // 添加点赞按钮
                        likeButton = `<button class="like-post-btn" data-post-id="${post.id}">👍 ${post.like_count}</button>`;
                    } else {
                        // 未登录用户只显示点赞数
                        likeButton = `<span>👍 ${post.like_count}</span>`;
                    }
                    
                    postCard.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
                        <div style="margin-top: 10px; font-size: 14px; color: #888; display: flex; align-items: center; justify-content: space-between;">
                          <div>
                            <span>User ID: ${post.user_id}</span> | 
                            <span>Post at: ${formattedDate}</span> | 
                            ${likeButton} | 
                            <span>💬 ${post.comment_count}</span>
                          </div>
                          <div>
                            ${deleteButton}
                          </div>
                        </div>
                    `;
                    postCard.style.cursor = 'pointer';
                    
                    // 为整个卡片添加点击事件（跳转到详情页）
                    postCard.addEventListener('click', function(e) {
                        // 如果点击的不是删除按钮，才跳转到详情页
                        if (!e.target.classList.contains('delete-post-btn') && 
                            !e.target.classList.contains('like-post-btn')) {
                            window.location.href = `/blog/${post.id}`;
                        }
                    });
                    
                    postListDiv.appendChild(postCard);
                    
                    // 为删除按钮添加事件（如果存在）
                    const deleteBtn = postCard.querySelector('.delete-post-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function(e) {
                            e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
                            const postId = this.getAttribute('data-post-id');
                            if (confirm('确定要删除这篇帖子吗？此操作不可恢复！')) {
                                deletePost(postId);
                            }
                        });
                    }
                    
                    // 为点赞按钮添加事件（如果存在）
                    const likeBtn = postCard.querySelector('.like-post-btn');
                    if (likeBtn) {
                        const postId = likeBtn.getAttribute('data-post-id');
                        
                        // 检查用户是否已经点赞过该帖子
                        if (currentUserId) {
                            fetch(`/api/posts/${postId}/like/check?user_id=${currentUserId}`)
                                .then(response => response.json())
                                .then(data => {
                                    if (data.status === 0 && data.has_liked) {
                                        // 已点赞，改变按钮样式
                                        likeBtn.classList.add('liked');
                                        likeBtn.setAttribute('data-liked', 'true');
                                    }
                                })
                                .catch(error => {
                                    console.error('获取点赞状态错误:', error);
                                });
                        }
                        
                        // 添加点击事件
                        likeBtn.addEventListener('click', function(e) {
                            e.stopPropagation(); // 阻止事件冒泡，防止触发卡片的点击事件
                            
                            if (!currentUserId) {
                                alert('请先登录再点赞！');
                                return;
                            }
                            
                            // 如果已经点赞过，提示用户
                            if (this.getAttribute('data-liked') === 'true') {
                                alert('您已经点赞过这篇帖子');
                                return;
                            }
                            
                            // 发送点赞请求
                            fetch(`/api/posts/${postId}/like`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    user_id: currentUserId
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.status === 0) {
                                    // 点赞成功，更新点赞数
                                    this.innerHTML = `👍 ${data.like_count}`;
                                    // 标记为已点赞状态
                                    this.classList.add('liked');
                                    this.setAttribute('data-liked', 'true');
                                } else if (data.status === 3) {
                                    // 已点赞过
                                    alert(data.msg);
                                    this.classList.add('liked');
                                    this.setAttribute('data-liked', 'true');
                                } else {
                                    alert('点赞失败: ' + (data.msg || '未知错误'));
                                }
                            })
                            .catch(error => {
                                console.error('点赞请求错误:', error);
                                alert('网络错误，请稍后重试');
                            });
                        });
                    }
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

// 新增：删除帖子函数
function deletePost(postId) {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
        alert('请先登录！');
        return;
    }

    fetch(`/api/posts/${postId}?user_id=${currentUserId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 0) {
            alert('帖子删除成功！');
            // 重新加载帖子列表，而不是刷新整个页面
            loadPostList();
        } else {
            alert('删除失败: ' + (data.msg || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除帖子请求错误:', error);
        alert('网络错误，请稍后重试');
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