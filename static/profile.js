// Run after DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadProfileInfo();
    loadUserPosts();

    // Bind search box: Enter to search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const val = this.value.trim();
                if (val) {
                    window.location.href = `/?key=${encodeURIComponent(val)}`;
                }
            }
        });
    }

    // Home logo click -> go home
    const homeLink = document.getElementById('homeLink');
    if (homeLink) {
        homeLink.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    // Load sidebar profile stats
    fetch(`/api/profile?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 0 && data.data) {
                renderProfileSidebar(data.data);
            }
        });
});

// Load user main info (big card)
function loadProfileInfo() {
    fetch(`/api/user?user_id=${userId}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 0) {
                const user = data.user;
                document.getElementById('profileInfo').innerHTML = `
                    <div class="user-profile main-profile" style="align-items: flex-start;">
                        <img src="${user.avatar || '/static/avatar/sunny_avatar.jpg'}" class="avatar" style="width:96px;height:96px;margin-right:32px;">
                        <div>
                            <div class="username" style="font-size:1.3em;">${user.username}</div>
                            <div style="color:#666;margin:8px 0;">${user.bio || 'This user has not written a bio.'}</div>
                            <div style="color:#888;">
                                Registered: ${user.create_time ? user.create_time.slice(0, 10) : 'Unknown'}
                                <br>
                                Email: ${user.email || 'Not provided'}
                                <br>
                                Number of posts: ${user.post_count || 0}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                document.getElementById('profileInfo').innerHTML = `<div style="color:#ff4d4f;">User does not exist!</div>`;
            }
        });
}

// Load user's posts below profile card
function loadUserPosts() {
    fetch(`/api/posts/user/${userId}`)
        .then(res => res.json())
        .then(data => {
            const postListDiv = document.getElementById('userPostList');
            if (!postListDiv) return;
            if (data.status === 0) {
                postListDiv.innerHTML = '';
                if (data.posts.length === 0) {
                    postListDiv.innerHTML = '<div class="question-card"><h3>This user has not posted anything yet.</h3></div>';
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
                            <span>at ${formattedDate}</span> |
                            <span>👍 ${post.like_count}</span> |
                            <span>💬 ${post.comment_count}</span>
                        </div>
                    `;
                    postCard.style.cursor = 'pointer';
                    postCard.onclick = function () {
                        window.location.href = `/blog/${post.id}`;
                    };
                    postListDiv.appendChild(postCard);
                });
            } else {
                postListDiv.innerHTML = `<div class="question-card"><h3>Failed to load posts.</h3></div>`;
            }
        });
}

// Render profile sidebar with post, follow, fan counts
function renderProfileSidebar(profile) {
    const sidebar = document.getElementById('profileSidebar');
    if (!sidebar) return;
    sidebar.innerHTML = `
        <div class="sidebar-avatar" style="text-align:center;">
            <img src="${profile.avatar || '/static/avatar.png'}" class="avatar" style="width:68px;height:68px;border-radius:50%;object-fit:cover;margin-bottom:10px;">
            <div style="font-weight:bold;color:#056de8;font-size:1.1em;">${profile.username}</div>
        </div>
        <div class="sidebar-stats" style="margin-top:12px;">
            <div>Posts: <b>${profile.post_count || 0}</b></div>
            <div>Following: <b>${profile.follow_count || 0}</b></div>
            <div>Followers: <b>${profile.fan_count || 0}</b></div>
        </div>
    `;
}
