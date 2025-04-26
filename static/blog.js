// 全局变量
let currentUserId = null;
let currentUsername = null;
let postAuthorId = null;
let isFollowing = false;

// 登录区渲染及事件绑定
function updateUserArea() {
    currentUserId = localStorage.getItem('userId');
    currentUsername = localStorage.getItem('username');
    const avatar = localStorage.getItem('avatar');
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    if (currentUserId && currentUsername) {
        userArea.innerHTML = `
<<<<<<< HEAD
            <img src="${avatar || '/static/avatars/sunny_avatar.jpg'}"
                 alt="avatar"
                 class="user-avatar"
                 id="headerAvatar"
                 style="width:32px;height:32px;border-radius:50%;margin-right:10px;object-fit:cover;cursor:pointer;">
            <button class="logout-btn" id="logoutBtn">退出</button>
=======
            <img src="${avatar || '/static/avatars/sunny_avatar.jpg'}" alt="avatar" class="user-avatar" style="width:32px;height:32px;border-radius:50%;margin-right:10px;object-fit:cover;">
            <button class="logout-btn" id="logoutBtn">Log out</button>
>>>>>>> 31ec6dd62825eaa973ee59f92a6e51f34e412e71
        `;
        document.getElementById('headerAvatar').onclick = function() {
            window.location.href = `/user/${currentUserId}`;
        };
        document.getElementById('logoutBtn').onclick = function() {
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar');
            window.location.reload();
        };
    } else {
        userArea.innerHTML = `
            <button id="loginBtn">Login</button>
            <button id="registerBtn" style="margin-left: 10px;">Register</button>
        `;
        document.getElementById('loginBtn').onclick = () => window.location.href = '/login';
        document.getElementById('registerBtn').onclick = () => window.location.href = '/register';
    }
}


document.addEventListener('DOMContentLoaded', function () {
    updateUserArea();
    loadPostDetail();
    loadComments();

    document.getElementById('homeLink').addEventListener('click', function() {
        window.location.href = '/';
    });

    document.getElementById('likeBtn').addEventListener('click', function() {
        if (!currentUserId) {
            alert('Please log in to like this post!');
            return;
        }
        if (this.getAttribute('data-liked') === 'true') {
            alert('Already liked this post!');
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
                alert('Like failed: ' + (data.msg || 'unknown error'));
            }
        })
        .catch(error => {
            console.error('Like failed:', error);
        });
    });

    document.getElementById('deleteBtn').addEventListener('click', function() {
        if (confirm('Sure you want to delete this post?')) {
            deletePost();
        }
    });

    document.getElementById('submitComment').addEventListener('click', submitComment);

    document.getElementById('followBtn').addEventListener('click', toggleFollow);
});

// 切换关注状态
function toggleFollow() {
    if (!currentUserId) {
        alert('Please log in to follow!');
        return;
    }
    if (currentUserId == postAuthorId) {
        alert('You cannot follow yourself!');
        return;
    }
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
            alert((isFollowing ? 'Unfollow' : 'Follow') + ' failed: ' + (data.msg || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Follow request error:', error);
        alert('Network error, please try again later.');
    });
}
function updateFollowButtonStatus() {
    const followBtn = document.getElementById('followBtn');
    if (isFollowing) {
        followBtn.textContent = 'Following';
        followBtn.classList.add('following');
    } else {
        followBtn.textContent = 'Follow';
        followBtn.classList.remove('following');
    }
}
function checkFollowStatus() {
    if (!currentUserId || !postAuthorId || currentUserId == postAuthorId) {
        return;
    }
    fetch(`/api/following?user_id=${currentUserId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0 && data.followings) {
                isFollowing = data.followings.some(user => user.id == postAuthorId);
                updateFollowButtonStatus();
            }
        })
        .catch(error => {
            console.error('Follow status fetch error:', error);
        });
}
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
                console.error('Like status fetch error:', error);
            });
    }
}

// =============== 修改处：作者名、头像可跳转 ===============
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

                fetch(`/api/user?user_id=${post.user_id}`)
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.status === 0) {
                            const authorName = userData.user.username || `用户ID: ${post.user_id}`;
                            const authorId = userData.user.id;
                            // 用户名变a标签
                            document.getElementById('author-name').innerHTML =
                                `<a href="/user/${authorId}" class="user-link">${authorName}</a>`;
                            document.getElementById('sidebar-username').innerHTML =
                                `<a href="/user/${authorId}" class="user-link">${authorName}</a>`;
                            // 头像可点击
                            const avatarDiv = document.getElementById('authorAvatar');
                            avatarDiv.style.cursor = "pointer";
                            avatarDiv.onclick = () => window.location.href = `/user/${authorId}`;
                            if (userData.user.avatar) {
                                avatarDiv.style.backgroundImage = `url('${userData.user.avatar}')`;
                            }
                            checkFollowStatus();
                            if (currentUserId && currentUserId == post.user_id) {
                                document.getElementById('followBtn').style.display = 'none';
                            }
                        }
                    });
                // 设置发布日期
                const date = new Date(post.create_time);
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                document.getElementById('post-date').innerText = formattedDate;
                document.title = `${post.title} - Easy Blog`;
                if (currentUserId && currentUserId == post.user_id) {
                    document.getElementById('deleteBtn').style.display = 'inline-flex';
                }
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

<<<<<<< HEAD
// =============== 修改处：评论区用户名可跳转 ===============
=======
// 删除帖子
function deletePost() {
    if (!currentUserId) {
        alert('Please Login');
        return;
    }
    fetch(`/api/posts/${postId}?user_id=${currentUserId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 0) {
            alert('Delete Success');
            window.location.href = '/';
        } else {
            alert('Delete Failed: ' + (data.msg || 'unknown error'));
        }
    })
    .catch(error => {
        console.error('error:', error);
        alert('error');
    });
}

// 为评论点赞按钮添加事件
>>>>>>> 31ec6dd62825eaa973ee59f92a6e51f34e412e71
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
                alert('Please log in to like this post!');
                return;
            }
            if (this.getAttribute('data-liked') === 'true') {
                alert('You have already liked this comment.');
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
                    alert('Like failed: ' + (data.msg || 'error'));
                }
            });
        });
    }
}
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
                    // 用户名a标签
                    commentDiv.innerHTML = `
                        <div class="comment-user"><a href="/user/${comment.user_id}" class="user-link">用户ID: ${comment.user_id}</a></div>
                        <div class="comment-content">${comment.content || ''}</div>
                        <div class="comment-meta">
                            <span>${formattedDate}</span>
                            <span style="margin-left:10px; cursor:pointer;">👍 ${comment.like_count || 0}</span>
                        </div>
                    `;
                    commentListDiv.appendChild(commentDiv);
                    addLikeEventToComment(commentDiv, comment.id);
                    // 异步获取用户名并更新a标签内容
                    fetch(`/api/user?user_id=${comment.user_id}`)
                    .then(response => response.json())
                    .then(userData => {
                        if (userData.status === 0 && userData.user) {
                            const userElement = commentDiv.querySelector('.comment-user a');
                            if (userElement) {
                                userElement.textContent = userData.user.username || `用户ID: ${comment.user_id}`;
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error occurred while processing the comment:', error);
                }
            });
        })
        .catch(error => {
            window.isLoadingComments = false;
            console.error('Comment request error:', error);
            const commentListDiv = document.getElementById('commentList');
            if (commentListDiv.children.length === 0 ||
                (commentListDiv.children.length === 1 && commentListDiv.children[0].id === 'noComments')) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'comment-item';
                errorDiv.style.color = '#f56c6c';
                errorDiv.textContent = 'loading failed';
                commentListDiv.innerHTML = '';
                commentListDiv.appendChild(errorDiv);
            }
        });
}

function submitComment() {
    if (!currentUserId) {
        alert('Please log in first');
        return;
    }
    const commentContent = document.getElementById('commentInput').value.trim();
    if (!commentContent) {
        alert('Comment cannot be null');
        return;
    }
    const submitBtn = document.getElementById('submitComment');
    submitBtn.disabled = true;
    submitBtn.classList.add('submitting');
    submitBtn.textContent = 'uploading...';
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
        if (!response.ok) throw new Error('error(internet)');
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
            alert('comment error');
        }
    })
    .catch(error => {
        console.error('评论提交错误:', error);
        alert('网络错误，请稍后重试');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('submitting');
        submitBtn.textContent = 'upload comment';
    });
}

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
            <div class="comment-user"><a href="/user/${comment.user_id}" class="user-link">${currentUsername || ('用户ID: ' + comment.user_id)}</a></div>
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
        console.error('comment error');
    }
}
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
