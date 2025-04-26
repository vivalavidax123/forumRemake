// 初始化 Markdown 编辑器
var easyMDE = new EasyMDE({
    element: document.getElementById('editor'),
    spellChecker: false,
    placeholder: "Write your post content here...",
    status: false,
    minHeight: "300px"
});

// 返回首页
document.getElementById('homeLink').addEventListener('click', function () {
    window.location.href = '/';
});

// 检查登录状态
window.onload = function () {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please log in first!');
        window.location.href = '/login';
    }
};

// 表单提交
document.getElementById('post-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const title = document.getElementById('post-title').value.trim();
    const content = easyMDE.value().trim();

    // 简单验证
    if (!title || title.length < 5) {
        showError('The title must be at least 5 characters.');
        return;
    }
    if (!content || content.length < 10) {
        showError('The content must be at least 10 characters.');
        return;
    }

    // 提交到后端
    fetch('/api/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: parseInt(userId),
            title: title,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 0) {
            showSuccess();
            setTimeout(function () {
                window.location.href = '/';
            }, 2000);
        } else {
            showError(data.msg || 'Failed to submit post.');
        }
    })
    .catch(error => {
        console.error('Post request error:', error);
        showError('Network error, please try again later.');
    });
});

function showSuccess() {
    document.getElementById('success-msg').style.display = 'block';
    document.getElementById('error-msg').style.display = 'none';
}

function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
    document.getElementById('success-msg').style.display = 'none';
}
