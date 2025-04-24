// 处理评论相关功能
document.addEventListener('DOMContentLoaded', function () {
    // 检查是否在帖子详情页
    const commentForm = document.getElementById('comment-form');
    const commentsContainer = document.getElementById('comments-container');

    if (commentForm && commentsContainer) {
        // 获取帖子ID
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (postId) {
            // 添加评论表单提交事件
            commentForm.addEventListener('submit', function (e) {
                e.preventDefault();
                createComment(postId);
            });
        }
    }
});

// 显示评论列表
function displayComments(comments, container) {
    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无评论，发表第一条评论吧！</div>';
        return;
    }

    let html = '';

    comments.forEach(comment => {
        const commentDate = new Date(comment.create_time);
        const formattedDate = commentDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="comment">
                <div class="comment-meta">
                    <strong>${comment.username}</strong> 
                    <span class="text-muted">${formattedDate}</span>
                    <span class="float-end">
                        <i class="bi bi-heart like-btn" id="like-comment-${comment.id}" data-id="${comment.id}"></i> 
                        <span id="comment-like-count-${comment.id}">${comment.like_count}</span>
                    </span>
                </div>
                <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    });

    container.innerHTML = html;

    // 添加评论点赞事件处理
    comments.forEach(comment => {
        const likeBtn = document.getElementById(`like-comment-${comment.id}`);
        if (likeBtn) {
            likeBtn.addEventListener('click', function () {
                likeComment(comment.id);
            });
        }
    });
}

// 发表评论
function createComment(postId) {
    const content = document.getElementById('comment-content').value.trim();

    if (!content) {
        alert('评论内容不能为空');
        return;
    }

    fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            post_id: postId,
            content: content
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 发表成功，清空评论框
                document.getElementById('comment-content').value = '';

                // 刷新评论列表
                const commentsContainer = document.getElementById('comments-container');
                const commentCountElement = document.getElementById('comment-count');

                if (commentsContainer) {
                    // 如果之前没有评论，清空"暂无评论"提示
                    if (commentsContainer.querySelector('.alert')) {
                        commentsContainer.innerHTML = '';
                    }

                    // 添加新评论到顶部
                    const newComment = document.createElement('div');
                    newComment.className = 'comment';

                    const commentDate = new Date(data.comment.create_time);
                    const formattedDate = commentDate.toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    newComment.innerHTML = `
                        <div class="comment-meta">
                            <strong>${data.comment.username}</strong> 
                            <span class="text-muted">${formattedDate}</span>
                            <span class="float-end">
                                <i class="bi bi-heart like-btn" id="like-comment-${data.comment.id}" data-id="${data.comment.id}"></i> 
                                <span id="comment-like-count-${data.comment.id}">0</span>
                            </span>
                        </div>
                        <div class="comment-content">${data.comment.content.replace(/\n/g, '<br>')}</div>
                    `;

                    commentsContainer.insertBefore(newComment, commentsContainer.firstChild);

                    // 添加点赞事件处理
                    const likeBtn = document.getElementById(`like-comment-${data.comment.id}`);
                    if (likeBtn) {
                        likeBtn.addEventListener('click', function () {
                            likeComment(data.comment.id);
                        });
                    }

                    // 更新评论数
                    if (commentCountElement) {
                        const currentCount = parseInt(commentCountElement.textContent || '0');
                        commentCountElement.textContent = currentCount + 1;
                    }
                }
            } else if (data.status === 1 && data.msg === '请先登录') {
                // 提示用户登录
                alert('请先登录后再发表评论');
                window.location.href = '/static/login.html';
            } else {
                // 显示错误信息
                alert(data.msg || '评论失败，请稍后再试');
            }
        })
        .catch(error => {
            console.error('评论失败:', error);
            alert('评论失败，请稍后再试');
        });
}

// 点赞评论
function likeComment(commentId) {
    fetch(`/api/comments/${commentId}/like`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 更新点赞数
                const likeCount = document.getElementById(`comment-like-count-${commentId}`);
                if (likeCount) {
                    likeCount.textContent = data.like_count;
                }

                // 显示点赞成功的视觉反馈
                const likeBtn = document.getElementById(`like-comment-${commentId}`);
                if (likeBtn) {
                    likeBtn.classList.add('text-danger');
                    setTimeout(() => {
                        likeBtn.classList.remove('text-danger');
                    }, 1000);
                }
            } else if (data.status === 1 && data.msg === '请先登录') {
                // 提示用户登录
                alert('请先登录后再点赞');
                window.location.href = '/static/login.html';
            }
        })
        .catch(error => {
            console.error('点赞失败:', error);
        });
}