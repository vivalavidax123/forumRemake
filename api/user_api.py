from flask import Blueprint, request, jsonify
from database import db, User

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

    if username:
        if User.query.filter_by(username=username).first() and user.username != username:
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
        'post_count': user.post_count,
        # You can add follow_count as needed
        'follow_count': getattr(user, 'follow_count', 0)
    }
    return jsonify({'status': 0, 'msg': 'User profile retrieved successfully.', 'data': result})
