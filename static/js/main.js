// 主要功能和初始化脚本
document.addEventListener('DOMContentLoaded', function () {
    // 添加 Bootstrap 图标 CSS
    const iconLink = document.createElement('link');
    iconLink.rel = 'stylesheet';
    iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css';
    document.head.appendChild(iconLink);

    // 处理URL参数
    const urlParams = new URLSearchParams(window.location.search);

    // 检查是否是搜索页面
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        document.getElementById('search-input').value = searchQuery;
    }

    // 如果有注册成功参数，显示提示
    if (urlParams.get('registered') === '1' && window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success mb-3';
            successAlert.textContent = '注册成功，请登录';
            loginForm.insertBefore(successAlert, loginForm.firstChild);
        }
    }
});

// 格式化日期函数
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 转义HTML特殊字符函数
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 解析URL参数函数
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// 显示通知函数
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `toast align-items-center text-white bg-${type} border-0`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('aria-atomic', 'true');

    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.appendChild(notification);

    document.body.appendChild(toastContainer);

    const toast = new bootstrap.Toast(notification);
    toast.show();

    // 3秒后自动移除
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}