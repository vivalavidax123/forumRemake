from flask import Blueprint, request, jsonify, current_app
from database import db, User, Follow, Post
import os
import uuid


user_api = Blueprint('user_api', __name__)


# Register
@user_api.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email', '')
    avatar = data.get('avatar', '')

    password = data.get('password')
    password_hash = password  # TODO: Add hashing!

    if not password or len(password) < 6:
        return jsonify({'status': 3, 'msg': 'Password must be at least 6 characters long.'})
    if not username:
        return jsonify({'status': 1, 'msg': 'Username cannot be empty.'})
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 2, 'msg': 'Username already exists.'})


    user = User(username=username, password_hash=password_hash, email=email, avatar=avatar)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'register complete', 'user_id': user.id})

# login
@user_api.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    password_hash = password

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'status': 1, 'msg': 'User does not exist.'})
    if not password or user.password_hash != password_hash:
        return jsonify({'status': 2, 'msg': 'Incorrect password.'})
    return jsonify({
        'status': 0,
        'msg': 'Login successful.',
        'user_id': user.id,
        'username': user.username,
        'avatar': user.avatar or ""
    })


# get all user
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

# get user
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



# update user
@user_api.route('/api/user/update', methods=['POST'])
def update_user():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Missing user ID.'})

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'status': 2, 'msg': 'User does not exist.'})

    username = data.get('username')
    email = data.get('email')
    avatar = data.get('avatar')
    password = data.get('password')

    if username and username != user.username:
        # 只在用户真的打算修改用户名时才查重
        if User.query.filter_by(username=username).first():
            return jsonify({'status': 3, 'msg': 'Username already exists.'})
        user.username = username

    if email:
        user.email = email
    if avatar:
        user.avatar = avatar
    if password:
        if len(password) < 6:
            return jsonify({'status': 4, 'msg': 'Password must be at least 6 characters long.'})
        password_hash = password
        user.password_hash = password_hash

    db.session.commit()
    return jsonify({'status': 0, 'msg': 'User information updated successfully.'})

# Return current user information
@user_api.route('/api/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Missing user ID.'})
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'status': 2, 'msg': 'User does not exist.'})
    result = {
        'id': user.id,
        'username': user.username,
        'avatar': user.avatar or "",
        'email': user.email,
        'post_count': Post.query.filter_by(user_id=user.id).count(),
        # You can add follow_count as needed
        'follow_count': getattr(user, 'follow_count', 0)
    }
    return jsonify({'status': 0, 'msg': 'User profile retrieved successfully.', 'data': result})


@user_api.route('/api/user/upload_avatar', methods=['POST'])
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({'status': 1, 'msg': 'No file part'})
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'status': 2, 'msg': 'No selected file'})

    # 校验文件扩展名（仅允许图片）
    allowed_exts = {'png', 'jpg', 'jpeg', 'gif'}
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in allowed_exts:
        return jsonify({'status': 3, 'msg': 'Invalid file type'})

    # 生成唯一文件名
    filename = f"{uuid.uuid4().hex}.{ext}"
    avatar_folder = os.path.join(current_app.root_path, 'static', 'avatars')
    os.makedirs(avatar_folder, exist_ok=True)
    save_path = os.path.join(avatar_folder, filename)
    file.save(save_path)

    avatar_url = f"/static/avatars/{filename}"
    return jsonify({'status': 0, 'msg': 'Upload successful', 'avatar_url': avatar_url})

@user_api.route('/api/user/avatar', methods=['POST'])
def change_avatar():
    user_id = request.form.get('user_id')
    file = request.files.get('avatar')
    if not user_id or not file:
        return jsonify({'status': 1, 'msg': '参数错误'})
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'status': 2, 'msg': '用户不存在'})
    # 保存文件（示例，生产需校验类型/大小/唯一命名等）
    avatar_filename = f'avatar_{user_id}_{file.filename}'
    avatar_path = os.path.join(current_app.static_folder, avatar_filename)
    file.save(avatar_path)
    user.avatar = f'/static/{avatar_filename}'
    db.session.commit()
    return jsonify({'status': 0, 'msg': '头像更新成功', 'avatar': user.avatar})

@user_api.route('/api/follow', methods=['POST'])
def follow_user():
    data = request.get_json()
    follower_id = data.get('follower_id')
    followee_id = data.get('followee_id')
    if not follower_id or not followee_id:
        return jsonify({'status': 1, 'msg': '缺少参数'})
    if follower_id == followee_id:
        return jsonify({'status': 2, 'msg': '不能关注自己'})
    # 检查是否已关注
    exists = Follow.query.filter_by(follower_id=follower_id, followee_id=followee_id).first()
    if exists:
        return jsonify({'status': 3, 'msg': '已经关注过了'})
    follow = Follow(follower_id=follower_id, followee_id=followee_id)
    db.session.add(follow)
    db.session.commit()
    return jsonify({'status': 0, 'msg': '关注成功'})

