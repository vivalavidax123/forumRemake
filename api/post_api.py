from flask import Blueprint, request, jsonify
from database import db, Post
import audit

post_api = Blueprint('post_api', __name__)

@post_api.route('/api/write', methods=['POST'])
@post_api.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    user_id = data.get('user_id')
    title = data.get('title')
    content = data.get('content')
    if not (user_id and title and content):
        return jsonify({'status': 1, 'msg': 'Missing parameters.'})

    '''
    # AI content audit
    ok, msg = audit.audit_by_deepseek(title, content)
    if not ok:
        # Audit failed, return the error message
        return jsonify({'status': 2, 'msg': f'Post failed, reason: {msg}'})
    '''

    post = Post(user_id=user_id, title=title, content=content)
    db.session.add(post)
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Post created successfully.', 'post_id': post.id})

from sqlalchemy import or_

@post_api.route('/api/write', methods=['GET'])
@post_api.route('/api/posts', methods=['GET'])
def get_posts():
    key = request.args.get('key', '')  # Get ?key=xxx parameter, default empty string
    if key:
        # Fuzzy search: posts where the title or content contains the key
        posts = Post.query.filter(
            or_(
                Post.title.like(f'%{key}%'),
                Post.content.like(f'%{key}%')
            )
        ).order_by(Post.create_time.desc()).all()
    else:
        # No key parameter, return all posts
        posts = Post.query.order_by(Post.create_time.desc()).all()
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

@post_api.route('/api/write/<int:post_id>', methods=['GET'])
@post_api.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'status': 1, 'msg': 'Post does not exist.'})
    data = {
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'user_id': post.user_id,
        'create_time': post.create_time.isoformat() if post.create_time else None,
        'like_count': post.like_count,
        'comment_count': post.comment_count
    }
    return jsonify({'status': 0, 'post': data})

@post_api.route('/api/write/user/<int:user_id>', methods=['GET'])
@post_api.route('/api/posts/user/<int:user_id>', methods=['GET'])
def get_user_posts(user_id):
    posts = Post.query.filter_by(user_id=user_id).order_by(Post.create_time.desc()).all()
    result = []
    for p in posts:
        result.append({
            'id': p.id,
            'title': p.title,
            'content': p.content,
            'create_time': p.create_time.isoformat() if p.create_time else None,
            'like_count': p.like_count,
            'comment_count': p.comment_count
        })
    return jsonify({'status': 0, 'posts': result})

@post_api.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'status': 1, 'msg': 'Post does not exist.'})
    post.like_count += 1
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Liked successfully.', 'like_count': post.like_count})
