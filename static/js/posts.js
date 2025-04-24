// 处理帖子相关功能
document.addEventListener('DOMContentLoaded', function () {
    // 检查当前页面
    const postsContainer = document.getElementById('posts-container');
    const postContainer = document.getElementById('post-container');
    const postForm = document.getElementById('post-form');
    const searchForm = document.getElementById('search-form');

    // 如果在主页或搜索结果页，加载帖子列表
    if (postsContainer) {
        // 获取URL参数，检查是否是搜索页面
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        const page = urlParams.get('page') || 1;

        if (searchQuery) {
            // 如果是搜索页面，加载搜索结果
            document.getElementById('search-input').value = searchQuery;
            loadSearchResults(searchQuery, page);
        } else {
            // 否则加载普通帖子列表
            loadPosts(page);
        }

        // 添加排序按钮事件监听
        const newestBtn = document.getElementById('sort-newest');
        const hottestBtn = document.getElementById('sort-hottest');

        if (newestBtn && hottestBtn) {
            newestBtn.addEventListener('click', function () {
                newestBtn.classList.add('active');
                hottestBtn.classList.remove('active');
                loadPosts(1, 'newest');
            });

            hottestBtn.addEventListener('click', function () {
                hottestBtn.classList.add('active');
                newestBtn.classList.remove('active');
                loadPosts(1, 'hottest');
            });
        }
    }

    // 如果在帖子详情页，加载帖子详情
    if (postContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (postId) {
            loadPostDetail(postId);
        } else {
            window.location.href = '/';
        }
    }

    // 如果在发帖页面，处理发帖表单
    if (postForm) {
        postForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createPost();
        });
    }

    // 处理搜索表单
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const searchQuery = document.getElementById('search-input').value.trim();
            if (searchQuery) {
                window.location.href = `/?q=${encodeURIComponent(searchQuery)}`;
            }
        });
    }
});

// 加载帖子列表
function loadPosts(page = 1, sortBy = 'newest') {
    const postsContainer = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination');

    if (!postsContainer) return;

    postsContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    fetch(`/api/posts?page=${page}&sort_by=${sortBy}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                displayPosts(data.posts, postsContainer);

                // 创建分页
                if (paginationContainer) {
                    createPagination(data.current_page, data.pages, paginationContainer, sortBy);
                }
            } else {
                postsContainer.innerHTML = '<div class="alert alert-danger">加载帖子失败</div>';
            }
        })
        .catch(error => {
            console.error('加载帖子失败:', error);
            postsContainer.innerHTML = '<div class="alert alert-danger">加载帖子失败，请稍后再试</div>';
        });
}

// 加载搜索结果
function loadSearchResults(query, page = 1) {
    const postsContainer = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination');

    if (!postsContainer) return;

    postsContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

    fetch(`/api/search?keyword=${encodeURIComponent(query)}&page=${page}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 更新页面标题
                document.querySelector('h2').textContent = `搜索结果: "${query}"`;

                if (data.posts.length === 0) {
                    postsContainer.innerHTML = '<div class="alert alert-info">没有找到相关结果</div>';
                } else {
                    displayPosts(data.posts, postsContainer);

                    // 创建分页
                    if (paginationContainer) {
                        createPagination(
                            data.current_page,
                            data.pages,
                            paginationContainer,
                            null,
                            `q=${encodeURIComponent(query)}`
                        );
                    }
                }
            } else {
                postsContainer.innerHTML = '<div class="alert alert-danger">搜索失败</div>';
            }
        })
        .catch(error => {
            console.error('搜索失败:', error);
            postsContainer.innerHTML = '<div class="alert alert-danger">搜索失败，请稍后再试</div>';
        });
}

// 显示帖子列表
function displayPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = '<div class="alert alert-info">暂无帖子</div>';
        return;
    }

    let html = '';

    posts.forEach(post => {
        const postDate = new Date(post.create_time);
        const formattedDate = postDate.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="card post-card">
                <div class="card-body">
                    <h5 class="card-title">
                        <a href="/static/post.html?id=${post.id}" class="post-title">${post.title}</a>
                    </h5>
                    <div class="post-meta">
                        <span class="me-3"><i class="bi bi-person"></i> ${post.username}</span>
                        <span class="me-3"><i class="bi bi-clock"></i> ${formattedDate}</span>
                        <span class="me-3"><i class="bi bi-heart"></i> ${post.like_count} 点赞</span>
                        <span><i class="bi bi-chat"></i> ${post.comment_count} 评论</span>
                    </div>
                    <p class="card-text post-content">${post.content}</p>
                    <a href="/static/post.html?id=${post.id}" class="btn btn-sm btn-primary">阅读全文</a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 创建分页
function createPagination(currentPage, totalPages, container, sortBy = null, queryParams = '') {
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    currentPage = parseInt(currentPage);
    totalPages = parseInt(totalPages);

    let html = '<ul class="pagination justify-content-center">';

    // 上一页按钮
    if (currentPage > 1) {
        const prevPageUrl = sortBy
            ? `?page=${currentPage - 1}&sort_by=${sortBy}`
            : `?page=${currentPage - 1}${queryParams ? '&' + queryParams : ''}`;

        html += `
            <li class="page-item">
                <a class="page-link" href="${prevPageUrl}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
    } else {
        html += `
            <li class="page-item disabled">
                <a class="page-link" href="#" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
    }

    // 页码按钮
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageUrl = sortBy
            ? `?page=${i}&sort_by=${sortBy}`
            : `?page=${i}${queryParams ? '&' + queryParams : ''}`;

        if (i === currentPage) {
            html += `<li class="page-item active"><a class="page-link" href="#">${i}</a></li>`;
        } else {
            html += `<li class="page-item"><a class="page-link" href="${pageUrl}">${i}</a></li>`;
        }
    }

    // 下一页按钮
    if (currentPage < totalPages) {
        const nextPageUrl = sortBy
            ? `?page=${currentPage + 1}&sort_by=${sortBy}`
            : `?page=${currentPage + 1}${queryParams ? '&' + queryParams : ''}`;

        html += `
            <li class="page-item">
                <a class="page-link" href="${nextPageUrl}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
    } else {
        html += `
            <li class="page-item disabled">
                <a class="page-link" href="#" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
    }

    html += '</ul>';
    container.innerHTML = html;
}

// 加载帖子详情
function loadPostDetail(postId) {
    const postContainer = document.getElementById('post-container');
    const commentsContainer = document.getElementById('comments-container');
    const commentCount = document.getElementById('comment-count');

    if (!postContainer) return;

    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                const post = data.post;

                // 更新页面标题
                document.title = `${post.title} - ForumRemake`;

                // 显示帖子内容
                const postDate = new Date(post.create_time);
                const formattedDate = postDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                let postHtml = `
                    <div class="card mb-4">
                        <div class="card-body">
                            <h2 class="card-title">${post.title}</h2>
                            <div class="post-meta mb-3">
                                <span class="me-3"><i class="bi bi-person"></i> ${post.username}</span>
                                <span class="me-3"><i class="bi bi-clock"></i> ${formattedDate}</span>
                                <span class="me-3">
                                    <i class="bi bi-heart like-btn" id="like-post" data-id="${post.id}"></i> 
                                    <span id="like-count">${post.like_count}</span> 点赞
                                </span>
                                <span><i class="bi bi-chat"></i> ${post.comment_count} 评论</span>
                            </div>
                            <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                `;

                postContainer.innerHTML = postHtml;

                // 更新作者信息
                document.getElementById('author-name').textContent = post.username;
                document.getElementById('author-post-count').textContent = post.post_count || 0;

                // 更新评论数
                if (commentCount) {
                    commentCount.textContent = post.comment_count;
                }

                // 显示评论列表
                if (commentsContainer && post.comments) {
                    displayComments(post.comments, commentsContainer);
                }

                // 添加点赞事件处理
                const likeBtn = document.getElementById('like-post');
                if (likeBtn) {
                    likeBtn.addEventListener('click', function () {
                        likePost(post.id);
                    });
                }
            } else {
                postContainer.innerHTML = '<div class="alert alert-danger">帖子不存在或已被删除</div>';
            }
        })
        .catch(error => {
            console.error('加载帖子失败:', error);
            postContainer.innerHTML = '<div class="alert alert-danger">加载帖子失败，请稍后再试</div>';
        });
}

// 点赞帖子
function likePost(postId) {
    fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 更新点赞数
                const likeCount = document.getElementById('like-count');
                if (likeCount) {
                    likeCount.textContent = data.like_count;
                }

                // 显示点赞成功的视觉反馈
                const likeBtn = document.getElementById('like-post');
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

// 发布帖子
function createPost() {
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const errorDiv = document.getElementById('post-error');
    const successDiv = document.getElementById('post-success');

    if (!title || !content) {
        errorDiv.textContent = '标题和内容不能为空';
        errorDiv.classList.remove('d-none');
        return;
    }

    fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            content: content
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 发布成功
                errorDiv.classList.add('d-none');
                successDiv.classList.remove('d-none');

                // 清空表单
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';

                // 更新帖子链接
                const backLink = document.getElementById('back-to-home');
                if (backLink && data.post_id) {
                    backLink.href = `/static/post.html?id=${data.post_id}`;
                    backLink.textContent = '查看帖子';
                }

                // 3秒后跳转到主页
                setTimeout(() => {
                    if (data.post_id) {
                        window.location.href = `/static/post.html?id=${data.post_id}`;
                    } else {
                        window.location.href = '/';
                    }
                }, 3000);
            } else if (data.status === 1 && data.msg === '请先登录') {
                // 提示用户登录
                errorDiv.textContent = '请先登录后再发布帖子';
                errorDiv.classList.remove('d-none');
                setTimeout(() => {
                    window.location.href = '/static/login.html';
                }, 2000);
            } else {
                // 显示错误信息
                errorDiv.textContent = data.msg || '发布失败，请稍后再试';
                errorDiv.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('发布失败:', error);
            errorDiv.textContent = '发布失败，请稍后再试';
            errorDiv.classList.remove('d-none');
        });
}