// 全局变量
let currentUserId = null;
let currentUsername = null;
let postAuthorId = null;
let isFollowing = false; // 新增：跟踪是否已关注作者

// 登录区渲染及事件绑定
function updateUserArea() {
    currentUserId = localStorage.getItem('userId');
    currentUsername = localStorage.getItem('username');
    const avatar = localStorage.getItem('avatar');
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (currentUserId && currentUsername) {
        userArea.innerHTML = `
            <img src="${avatar || '/static/avatars/sunny_avatar.jpg'}" alt="avatar" class="user-avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;object-fit:cover;">
            <button class="logout-btn" id="logoutBtn">退出</button>
        `;
        document.getElementById('logoutBtn').onclick = function() {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar');
            window.location.reload();
        };

    } else {
        userArea.innerHTML = `
            <button id="loginBtn">登录</button>
            <button id="registerBtn" style="margin-left: 10px;">注册</button>
        `;
        document.getElementById('loginBtn').onclick = () => window.location.href = '/login';
        document.getElementById('registerBtn').onclick = () => window.location.href = '/register';
    }
}

// 页面初始化，加载帖子、评论、绑定事件
document.addEventListener('DOMContentLoaded', function () {
    updateUserArea();

    // 加载帖子详情
    loadPostDetail();

    // 加载评论列表
    loadComments();

    // 返回首页
    document.getElementById('homeLink').addEventListener('click', function() {
        window.location.href = '/';
    });

    // 点赞功能
    document.getElementById('likeBtn').addEventListener('click', function() {
        if (!currentUserId) {
            alert('请先登录再点赞！');
            return;
        }
        if (this.getAttribute('data-liked') === 'true') {
            alert('您已经点赞过这篇帖子');
            return;
        }
        fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: currentUserId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                document.getElementById('likeCount').innerText = data.like_count;
                this.style.background = '#e0e9ff';
                this.style.color = '#003eb3';
                this.setAttribute('data-liked', 'true');
            } else if (data.status === 3) {
                alert(data.msg);
                this.setAttribute('data-liked', 'true');
                this.style.background = '#e0e9ff';
                this.style.color = '#003eb3';
            } else {
                alert('点赞失败: ' + (data.msg || '未知错误'));
            }
        })
        .catch(error => {
            console.error('点赞请求错误:', error);
        });
    });

    // 删除帖子功能
    document.getElementById('deleteBtn').addEventListener('click', function() {
        if (confirm('确定要删除这篇帖子吗？此操作不可恢复！')) {
            deletePost();
        }
    });

    // 提交评论
    document.getElementById('submitComment').addEventListener('click', submitComment);
    
    // 关注/取消关注作者按钮 - 新增
    document.getElementById('followBtn').addEventListener('click', toggleFollow);
});

// 新增：切换关注状态
function toggleFollow() {
    if (!currentUserId) {
        alert('请先登录再关注用户！');
        return;
    }
    
    if (currentUserId == postAuthorId) {
        alert('不能关注自己哦！');
        return;
    }
    
    const followBtn = document.getElementById('followBtn');
    const apiEndpoint = isFollowing ? '/api/unfollow' : '/api/follow';
    
    fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            follower_id: currentUserId,
            followee_id: postAuthorId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 0) {
            isFollowing = !isFollowing;
            updateFollowButtonStatus();
        } else {
            alert((isFollowing ? '取消关注' : '关注') + '失败: ' + (data.msg || '未知错误'));
        }
    })
    .catch(error => {
        console.error('关注请求错误:', error);
        alert('网络错误，请稍后重试');
    });
}

// 新增：更新关注按钮状态
function updateFollowButtonStatus() {
    const followBtn = document.getElementById('followBtn');
    if (isFollowing) {
        followBtn.textContent = '已关注';
        followBtn.classList.add('following');
    } else {
        followBtn.textContent = '关注';
        followBtn.classList.remove('following');
    }
}

// 新增：检查是否已关注作者
function checkFollowStatus() {
    if (!currentUserId || !postAuthorId || currentUserId == postAuthorId) {
        // 未登录、无作者ID或自己的帖子不需要检查
        return;
    }
    
    fetch(`/api/following?user_id=${currentUserId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0 && data.followings) {
                // 检查当前作者是否在关注列表中
                isFollowing = data.followings.some(user => user.id == postAuthorId);
                updateFollowButtonStatus();
            }
        })
        .catch(error => {
            console.error('获取关注状态错误:', error);
        });
}

// 检查帖子点赞状态
function checkPostLikeStatus() {
    if (currentUserId) {
        fetch(`/api/posts/${postId}/like/check?user_id=${currentUserId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 0 && data.has_liked) {
                    const likeBtn = document.getElementById('likeBtn');
                    likeBtn.style.background = '#e0e9ff';
                    likeBtn.style.color = '#003eb3';
                    likeBtn.setAttribute('data-liked', 'true');
                }
            })
            .catch(error => {
                console.error('获取点赞状态错误:', error);
            });
    }
}

// 加载帖子详情
function loadPostDetail() {
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                const post = data.post;
                postAuthorId = post.user_id;
                document.getElementById('post-title').innerText = post.title;
                document.getElementById('post-content').innerText = post.content;
                document.getElementById('likeCount').innerText = post.like_count;
                // 获取作者信息
                fetch(`/api/user?user_id=${post.user_id}`)
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.status === 0) {
                            const authorName = userData.user.username || `用户ID: ${post.user_id}`;
                            document.getElementById('author-name').innerText = authorName;
                            document.getElementById('sidebar-username').innerText = authorName;
                            
                            // 如果有头像，更新头像
                            if (userData.user.avatar) {
                                document.getElementById('authorAvatar').style.backgroundImage = `url('${userData.user.avatar}')`;
                            }
                            
                            // 检查关注状态 - 新增
                            checkFollowStatus();
                            
                            // 自己的帖子不显示关注按钮
                            if (currentUserId && currentUserId == post.user_id) {
                                document.getElementById('followBtn').style.display = 'none';
                            }
                        }
                    });
                // 设置发布日期
                const date = new Date(post.create_time);
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                document.getElementById('post-date').innerText = formattedDate;
                document.title = `${post.title} - 简易论坛`;
                // 是否显示删除按钮
                if (currentUserId && currentUserId == post.user_id) {
                    document.getElementById('deleteBtn').style.display = 'inline-flex';
                }
                // 检查点赞状态
                setTimeout(checkPostLikeStatus, 500);
            } else {
                alert('加载帖子失败: ' + (data.msg || '未知错误'));
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('加载帖子详情错误:', error);
            document.getElementById('post-content').innerText = '加载失败，请刷新页面重试';
        });
}

// 删除帖子
function deletePost() {
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
            window.location.href = '/';
        } else {
            alert('删除失败: ' + (data.msg || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除帖子请求错误:', error);
        alert('网络错误，请稍后重试');
    });
}

// 为评论点赞按钮添加事件
function addLikeEventToComment(commentElement, commentId) {
    const likeSpan = commentElement.querySelector('.comment-meta span:last-child');
    if (likeSpan) {
        likeSpan.setAttribute('data-comment-id', commentId);
        if (currentUserId) {
            fetch(`/api/comments/${commentId}/like/check?user_id=${currentUserId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 0 && data.has_liked) {
                        likeSpan.style.color = '#056de8';
                        likeSpan.style.fontWeight = 'bold';
                        likeSpan.setAttribute('data-liked', 'true');
                    }
                });
        }
        const newLikeSpan = likeSpan.cloneNode(true);
        likeSpan.parentNode.replaceChild(newLikeSpan, likeSpan);
        newLikeSpan.addEventListener('click', function() {
            if (!currentUserId) {
                alert('请先登录再点赞！');
                return;
            }
            if (this.getAttribute('data-liked') === 'true') {
                alert('您已经点赞过这条评论');
                return;
            }
            fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 0) {
                    this.innerHTML = `👍 ${data.like_count}`;
                    this.style.color = '#056de8';
                    this.style.fontWeight = 'bold';
                    this.setAttribute('data-liked', 'true');
                } else if (data.status === 3) {
                    alert(data.msg);
                    this.style.color = '#056de8';
                    this.style.fontWeight = 'bold';
                    this.setAttribute('data-liked', 'true');
                } else {
                    alert('点赞失败: ' + (data.msg || '未知错误'));
                }
            });
        });
    }
}

// 加载评论列表
function loadComments() {
    if (window.isLoadingComments) return;
    window.isLoadingComments = true;
    fetch(`/api/comments?post_id=${postId}`)
        .then(response => {
            if (!response.ok) throw new Error('网络响应异常，状态码: ' + response.status);
            return response.json();
        })
        .then(data => {
            window.isLoadingComments = false;
            const comments = data.status === 0 ? data.comments || [] : [];
            const commentListDiv = document.getElementById('commentList');
            const noCommentsDiv = document.getElementById('noComments');
            if (comments.length === 0) {
                if (noCommentsDiv) noCommentsDiv.style.display = 'block';
                if (commentListDiv) commentListDiv.innerHTML = '';
                return;
            }
            if (noCommentsDiv) noCommentsDiv.style.display = 'none';
            if (commentListDiv) commentListDiv.innerHTML = '';
            comments.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
            comments.forEach(comment => {
                try {
                    const date = new Date(comment.create_time || new Date());
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    const commentDiv = document.createElement('div');
                    commentDiv.className = 'comment-item';
                    commentDiv.dataset.id = comment.id;
                    commentDiv.innerHTML = `
                        <div class="comment-user">用户ID: ${comment.user_id}</div>
                        <div class="comment-content">${comment.content || ''}</div>
                        <div class="comment-meta">
                            <span>${formattedDate}</span>
                            <span style="margin-left:10px; cursor:pointer;">👍 ${comment.like_count || 0}</span>
                        </div>
                    `;
                    commentListDiv.appendChild(commentDiv);
                    addLikeEventToComment(commentDiv, comment.id);
                    // 异步获取用户名
                    if (comment.user_id.toString() === currentUserId) {
                        const userElement = commentDiv.querySelector('.comment-user');
                        if (userElement) userElement.textContent = currentUsername;
                    } else {
                        fetch(`/api/user?user_id=${comment.user_id}`)
                        .then(response => response.json())
                        .then(userData => {
                            if (userData.status === 0 && userData.user) {
                                const userElement = commentDiv.querySelector('.comment-user');
                                if (userElement) userElement.textContent = userData.user.username || `用户ID: ${comment.user_id}`;
                            }
                        });
                    }
                } catch (error) {
                    console.error('处理评论时出错:', error);
                }
            });
        })
        .catch(error => {
            window.isLoadingComments = false;
            console.error('评论请求错误:', error);
            const commentListDiv = document.getElementById('commentList');
            if (commentListDiv.children.length === 0 || 
                (commentListDiv.children.length === 1 && commentListDiv.children[0].id === 'noComments')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'comment-item';
                errorDiv.style.color = '#f56c6c';
                errorDiv.textContent = '加载评论失败，请刷新页面重试';
                commentListDiv.innerHTML = '';
                commentListDiv.appendChild(errorDiv);
            }
        });
}

// 提交评论
function submitComment() {
    if (!currentUserId) {
        alert('请先登录再发表评论！');
        return;
    }
    const commentContent = document.getElementById('commentInput').value.trim();
    if (!commentContent) {
        alert('评论内容不能为空！');
        return;
    }
    const submitBtn = document.getElementById('submitComment');
    submitBtn.disabled = true;
    submitBtn.classList.add('submitting');
    submitBtn.textContent = '提交中...';
    const commentData = {
        post_id: parseInt(postId),
        user_id: parseInt(currentUserId),
        content: commentContent
    };
    fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
    })
    .then(response => {
        if (!response.ok) throw new Error('网络响应异常');
        return response.json();
    })
    .then(data => {
        if (data.status === 0) {
            document.getElementById('commentInput').value = '';
            const tempComment = {
                id: data.comment_id,
                user_id: currentUserId,
                content: commentContent,
                create_time: new Date().toISOString(),
                like_count: 0
            };
            addNewComment(tempComment, true);
            // AI回复检测
            const hasAIMention = commentContent.toLowerCase().includes('@deepseek') || 
                                 commentContent.toLowerCase().includes('@bot');
            if (hasAIMention) {
                const aiResponseHint = document.createElement('div');
                aiResponseHint.id = 'ai-response-hint';
                aiResponseHint.className = 'comment-item new-comment';
                aiResponseHint.innerHTML = `<div class="comment-user">DeepSeek</div><div class="comment-content">AI正在生成回复...</div>`;
                document.getElementById('commentList').appendChild(aiResponseHint);
                setTimeout(() => {
                    const hint = document.getElementById('ai-response-hint');
                    if (hint) hint.remove();
                    loadComments();
                }, 2000);
            }
        } else {
            alert('评论失败: ' + (data.msg || '未知错误'));
        }
    })
    .catch(error => {
        console.error('评论提交错误:', error);
        alert('网络错误，请稍后重试');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('submitting');
        submitBtn.textContent = '提交评论';
    });
}

// 添加新评论到列表（不刷新全部评论）
function addNewComment(comment, isNew = false) {
    const commentListDiv = document.getElementById('commentList');
    const noCommentsDiv = document.getElementById('noComments');
    try {
        if (noCommentsDiv) noCommentsDiv.style.display = 'none';
        const date = new Date(comment.create_time || new Date());
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const commentDiv = document.createElement('div');
        commentDiv.className = isNew ? 'comment-item new-comment' : 'comment-item';
        commentDiv.dataset.id = comment.id;
        commentDiv.innerHTML = `
            <div class="comment-user">${currentUsername || ('用户ID: ' + comment.user_id)}</div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-meta">
                <span>${formattedDate}</span>
                <span style="margin-left:10px; cursor:pointer;">👍 ${comment.like_count || 0}</span>
            </div>
        `;
        if (commentListDiv.firstChild) {
            commentListDiv.insertBefore(commentDiv, commentListDiv.firstChild);
        } else {
            commentListDiv.appendChild(commentDiv);
        }
        addLikeEventToComment(commentDiv, comment.id);
        if (isNew) commentDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
        console.error('添加新评论出错:', error);
    }
}