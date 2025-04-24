// 处理用户认证相关功能
document.addEventListener('DOMContentLoaded', function () {
    // 检查用户登录状态
    checkLoginStatus();

    // 注册表单处理
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            register();
        });
    }

    // 登录表单处理
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            login();
        });
    }

    // 退出登录处理
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }
});

// 检查用户登录状态
function checkLoginStatus() {
    fetch('/api/user/current')
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 用户已登录
                showLoggedInState(data.user);

                // 处理需要登录状态的页面元素
                const notLoggedInAlert = document.getElementById('not-logged-in-alert');
                if (notLoggedInAlert) {
                    notLoggedInAlert.classList.add('d-none');
                }

                // 显示发帖表单或评论表单
                const postForm = document.getElementById('post-form');
                if (postForm) {
                    postForm.classList.remove('d-none');
                }

                const commentForm = document.getElementById('comment-form');
                if (commentForm) {
                    commentForm.classList.remove('d-none');
                }
            } else {
                // 用户未登录
                showLoggedOutState();

                // 处理需要登录状态的页面元素
                const notLoggedInAlert = document.getElementById('not-logged-in-alert');
                if (notLoggedInAlert) {
                    notLoggedInAlert.classList.remove('d-none');
                }
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
            showLoggedOutState();
        });
}

// 显示已登录状态
function showLoggedInState(user) {
    const loggedInDiv = document.getElementById('logged-in');
    const notLoggedInDiv = document.getElementById('not-logged-in');
    const currentUsername = document.getElementById('current-username');

    if (loggedInDiv && notLoggedInDiv && currentUsername) {
        loggedInDiv.classList.remove('d-none');
        notLoggedInDiv.classList.add('d-none');
        currentUsername.textContent = user.username;
    }
}

// 显示未登录状态
function showLoggedOutState() {
    const loggedInDiv = document.getElementById('logged-in');
    const notLoggedInDiv = document.getElementById('not-logged-in');

    if (loggedInDiv && notLoggedInDiv) {
        loggedInDiv.classList.add('d-none');
        notLoggedInDiv.classList.remove('d-none');
    }
}

// 用户注册
function register() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('register-error');

    // 简单验证
    if (password !== confirmPassword) {
        errorDiv.textContent = '两次输入的密码不一致';
        errorDiv.classList.remove('d-none');
        return;
    }

    // 发送注册请求
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 注册成功，跳转到登录页
                window.location.href = '/static/login.html?registered=1';
            } else {
                // 显示错误信息
                errorDiv.textContent = data.msg;
                errorDiv.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('注册失败:', error);
            errorDiv.textContent = '注册失败，请稍后再试';
            errorDiv.classList.remove('d-none');
        });
}

// 用户登录
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    // 发送登录请求
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 登录成功，跳转到首页
                window.location.href = '/';
            } else {
                // 显示错误信息
                errorDiv.textContent = data.msg;
                errorDiv.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('登录失败:', error);
            errorDiv.textContent = '登录失败，请稍后再试';
            errorDiv.classList.remove('d-none');
        });
}

// 退出登录
function logout() {
    fetch('/api/logout', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 0) {
                // 退出成功，刷新页面
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('退出失败:', error);
        });
}