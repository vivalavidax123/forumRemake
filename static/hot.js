document.addEventListener('DOMContentLoaded', function () {
    // 复用 main.js 的功能（如有）
    if (typeof updateUserArea === 'function') updateUserArea();
    if (typeof loadUserProfile === 'function') loadUserProfile();
    loadHotList();
    if (typeof bindSearchInput === 'function') bindSearchInput();
    if (typeof bindHomeLink === 'function') bindHomeLink();
    if (typeof highlightCurrentPage === 'function') highlightCurrentPage();
});

function loadHotList() {
    fetch('/api/posts/top')
        .then(response => response.json())
        .then(data => {
            const hotListDiv = document.getElementById('hotList');
            if (!hotListDiv) return;
            if (data.status === 0) {
                hotListDiv.innerHTML = '';
                if (data.posts.length === 0) {
                    hotListDiv.innerHTML = '<div class="question-card"><h3>No hot posts yet.</h3></div>';
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
                        <div style="margin-top: 10px; font-size: 14px; color: #888; display: flex; align-items: center; justify-content: space-between;">
                          <div>
                            <span>User ${post.user_id}</span> | 
                            <span>at ${formattedDate}</span> | 
                            <span>👍 ${post.like_count}</span> | 
                            <span>💬 ${post.comment_count}</span>
                          </div>
                        </div>
                    `;
                    postCard.style.cursor = 'pointer';
                    postCard.onclick = function () {
                        window.location.href = `/blog/${post.id}`;
                    };
                    hotListDiv.appendChild(postCard);
                });
            } else {
                hotListDiv.innerHTML = `<div class="question-card"><h3>加载失败</h3><p>${data.msg || '请重试'}</p></div>`;
            }
        })
        .catch(() => {
            const hotListDiv = document.getElementById('hotList');
            if (hotListDiv)
                hotListDiv.innerHTML = '<div class="question-card"><h3>网络错误</h3></div>';
        });
}
