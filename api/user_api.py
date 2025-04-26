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
    password_hash = password  # TODO: Hash in real world!

    if not password or len(password) < 6:
        return jsonify({'status': 3, 'msg': 'Password must be at least 6 characters long.'})
    if not username:
        return jsonify({'status': 1, 'msg': 'Username cannot be empty.'})
    if User.query.filter_by(username=username).first():
        return jsonify({'status': 2, 'msg': 'Username already exists.'})

    user = User(username=username, password_hash=password_hash, email=email, avatar=avatar)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Register complete', 'user_id': user.id})

# Login
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

# Get all users
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
            'post_count': Post.query.filter_by(user_id=u.id).count()
        })
    return jsonify({'status': 0, 'users': result})

# Get single user info
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
        return jsonify({'status': 1, 'msg': 'User does not exist.'})

    result = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'avatar': user.avatar,
        'create_time': user.create_time.isoformat() if user.create_time else None,
        'post_count': Post.query.filter_by(user_id=user.id).count()
    }
    return jsonify({'status': 0, 'user': result})

# Update user info
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
        user.password_hash = password

    db.session.commit()
    return jsonify({'status': 0, 'msg': 'User information updated successfully.'})

# Get profile
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
        'follow_count': Follow.query.filter_by(follower_id=user.id).count() if hasattr(Follow, 'follower_id') else 0
    }
    return jsonify({'status': 0, 'msg': 'User profile retrieved successfully.', 'data': result})

# Upload and change avatar (merged)
@user_api.route('/api/user/avatar', methods=['POST'])
def change_avatar():
    user_id = request.form.get('user_id')
    file = request.files.get('avatar')
    if not user_id or not file:
        return jsonify({'status': 1, 'msg': 'Missing user ID or file.'})
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'status': 2, 'msg': 'User does not exist.'})
    # Only allow images
    allowed_exts = {'png', 'jpg', 'jpeg', 'gif'}
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in allowed_exts:
        return jsonify({'status': 3, 'msg': 'Invalid file type.'})

    # Ensure avatars folder exists
    avatar_dir = os.path.join(current_app.static_folder, 'avatars')
    os.makedirs(avatar_dir, exist_ok=True)

    # Unique filename
    avatar_filename = f'avatar_{user_id}_{uuid.uuid4().hex}.{ext}'
    avatar_path = os.path.join(avatar_dir, avatar_filename)
    file.save(avatar_path)

    user.avatar = f'/static/avatars/{avatar_filename}'
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Avatar updated successfully.', 'avatar': user.avatar})

# Follow another user
@user_api.route('/api/follow', methods=['POST'])
def follow_user():
    data = request.get_json()
    follower_id = data.get('follower_id')
    followee_id = data.get('followee_id')
    if not follower_id or not followee_id:
        return jsonify({'status': 1, 'msg': 'Missing parameter(s).'})
    if follower_id == followee_id:
        return jsonify({'status': 2, 'msg': 'Cannot follow yourself.'})
    exists = Follow.query.filter_by(follower_id=follower_id, followee_id=followee_id).first()
    if exists:
        return jsonify({'status': 3, 'msg': 'Already following.'})
    follow = Follow(follower_id=follower_id, followee_id=followee_id)
    db.session.add(follow)
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Follow successful.'})

# 获取用户关注的人列表
@user_api.route('/api/following', methods=['GET'])
def get_following():
    follower_id = request.args.get('user_id')
    if not follower_id:
        return jsonify({'status': 1, 'msg': '缺少用户ID参数'})
    
    # 查询此用户关注的所有人
    followings = Follow.query.filter_by(follower_id=follower_id).all()
    
    # 如果没有关注任何人
    if not followings:
        return jsonify({'status': 0, 'followings': []})
    
    result = []
    for follow in followings:
        # 获取被关注者的信息
        followee = User.query.get(follow.followee_id)
        if followee:
            result.append({
                'id': followee.id,
                'username': followee.username,
                'avatar': followee.avatar,
                'post_count': Post.query.filter_by(user_id=followee.id).count()
            })
    
    return jsonify({'status': 0, 'followings': result})

# 取消关注
@user_api.route('/api/unfollow', methods=['POST'])
def unfollow_user():
    data = request.get_json()
    follower_id = data.get('follower_id')
    followee_id = data.get('followee_id')
    
    if not follower_id or not followee_id:
        return jsonify({'status': 1, 'msg': '缺少参数'})
    
    # 查找关注记录
    follow = Follow.query.filter_by(
        follower_id=follower_id, 
        followee_id=followee_id
    ).first()
    
    if not follow:
        return jsonify({'status': 2, 'msg': 'Not following this user'})
    
    # 删除关注记录
    db.session.delete(follow)
    db.session.commit()
    
    return jsonify({'status': 0, 'msg': 'Unfollowed successfully'})



# 获取关注者（Followings）的所有帖子，按时间倒序排序
@user_api.route('/api/following/posts', methods=['GET'])
def get_following_posts():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Missing user ID.'})

    # 获取当前用户关注的所有用户ID
    followings = Follow.query.filter_by(follower_id=user_id).all()
    followee_ids = [f.followee_id for f in followings]
    if not followee_ids:
        return jsonify({'status': 0, 'posts': []})

    # 查询这些用户的所有帖子，按时间倒序
    posts = Post.query.filter(Post.user_id.in_(followee_ids)).order_by(Post.create_time.desc()).all()
    result = []
    for p in posts:
        result.append({
            'id': p.id,
            'title': p.title,
            'content': p.content,
            'user_id': p.user_id,
            'create_time': p.create_time.isoformat() if p.create_time else None,
            'like_count': p.like_count,
            'comment_count': p.comment_count
        })

    return jsonify({'status': 0, 'posts': result})
