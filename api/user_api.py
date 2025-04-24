from flask import Blueprint, request, jsonify, session
from database import db, User
from werkzeug.security import generate_password_hash, check_password_hash

user_api = Blueprint('user_api', __name__)

@user_api.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'status': 1, 'msg': '用户名和密码不能为空'})
    
    # 检查用户名是否已存在
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'status': 1, 'msg': '用户名已存在'})
    
    # 检查邮箱是否已存在（如果提供）
    if email:
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return jsonify({'status': 1, 'msg': '邮箱已存在'})
    
    # 创建新用户
    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'status': 0, 'msg': '注册成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 1, 'msg': f'注册失败: {str(e)}'})

@user_api.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'status': 1, 'msg': '用户名和密码不能为空'})
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'status': 1, 'msg': '用户名或密码错误'})
    
    # 设置会话
    session['user_id'] = user.id
    session['username'] = user.username
    
    return jsonify({
        'status': 0, 
        'msg': '登录成功',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': user.avatar,
            'post_count': user.post_count
        }
    })

@user_api.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'status': 0, 'msg': '退出成功'})

@user_api.route('/api/user/current', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'status': 1, 'msg': '未登录'})
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    if not user:
        session.clear()
        return jsonify({'status': 1, 'msg': '用户不存在'})
    
    return jsonify({
        'status': 0,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'avatar': user.avatar,
            'post_count': user.post_count
        }
    })