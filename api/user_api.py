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
    if not username:
        return jsonify({'status': 1, 'msg': '用户名不能为空'})
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 2, 'msg': '用户名已存在'})
    user = User(username=username)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 0, 'msg': '注册成功', 'user_id': user.id})

# 登录 (username)
@user_api.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'status': 1, 'msg': '用户不存在'})
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


