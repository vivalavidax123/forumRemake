from flask import Blueprint, request, jsonify
from database import db, User

user_api = Blueprint('user_api', __name__)


# 注册 (username)
@user_api.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email', '')
    avatar = data.get('avatar', '')

    password = data.get('password')
    password_hash = password  # 加密，但是没加

    if not password or len(password) < 6:
        return jsonify({'status': 3, 'msg': '密码必须至少六位'})
    if not username:
        return jsonify({'status': 1, 'msg': '用户名不能为空'})
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 2, 'msg': '用户名已存在'})


    user = User(username=username, password_hash=password_hash, email=email, avatar=avatar)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 0, 'msg': '注册成功', 'user_id': user.id})

# 登录 (username)
@user_api.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    password_hash = password

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'status': 1, 'msg': '用户不存在'})
    if not password or user.password_hash != password_hash:
        return jsonify({'status': 2, 'msg': '密码错误'})
    return jsonify({'status': 0, 'msg': '登录成功', 'user_id': user.id})


# 查看所有user（测试）
@user_api.route('/api/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'avatar': u.avatar,
            'create_time': u.create_time.isoformat() if u.create_time else None,
            'post_count': u.post_count
        })
    return jsonify({'status': 0, 'users': result})


@user_api.route('/api/user', methods=['GET'])
def get_user():
    user_id = request.args.get('user_id')
    username = request.args.get('username')
    user = None

    if user_id:
        user = User.query.filter_by(id=user_id).first()
    elif username:
        user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'status': 1, 'msg': '用户不存在'})

    result = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'create_time': user.create_time.isoformat() if user.create_time else None,
        'post_count': user.post_count
    }
    return jsonify({'status': 0, 'user': result})


@user_api.route('/api/user/update', methods=['POST'])
def update_user():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': '缺少用户ID'})

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'status': 2, 'msg': '用户不存在'})

    # 可选：修改的字段
    username = data.get('username')
    email = data.get('email')
    avatar = data.get('avatar')
    password = data.get('password')

    # 根据前端传递的字段动态修改
    if username:
        # 检查用户名是否被占用
        if User.query.filter_by(username=username).first() and user.username != username:
            return jsonify({'status': 3, 'msg': '用户名已存在'})
        user.username = username
    if email:
        user.email = email
    if avatar:
        user.avatar = avatar
    if password:
        if len(password) < 6:
            return jsonify({'status': 4, 'msg': '密码必须至少六位'})
        password_hash = password
        user.password_hash = password_hash

    db.session.commit()
    return jsonify({'status': 0, 'msg': '用户信息修改成功'})