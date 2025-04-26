from flask import Blueprint, request, jsonify
from database import db, Post, PostLike
from sqlalchemy import or_
import audit

post_api = Blueprint('post_api', __name__)


@post_api.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    user_id = data.get('user_id')
    title = data.get('title')
    content = data.get('content')
    is_top = data.get('is_top', False)
    is_essence = data.get('is_essence', False)
    tag = data.get('tag')
    status = data.get('status', 0)
    if not (user_id and title and content):
        return jsonify({'status': 1, 'msg': 'Missing parameters.'})


    # AI content audit
    ok, msg = audit.audit_by_deepseek(title, content)
    if not ok:
        # Audit failed, return the error message
        return jsonify({'status': 2, 'msg': f'Post failed, reason: {msg}'})


    post = Post(
        user_id=user_id,
        title=title,
        content=content,
        is_top=is_top,
        is_essence=is_essence,
        tag=tag,
        status=status
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({'status': 0, 'msg': 'Post created successfully.', 'post_id': post.id})



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
    # 从请求中获取用户ID
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'status': 2, 'msg': 'Please log in first'})
    
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'status': 1, 'msg': 'Post not found'})
    
    # 检查用户是否已经点赞过这篇帖子
    existing_like = PostLike.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first()
    
    if existing_like:
        # 用户已经点赞过，返回提示
        return jsonify({
            'status': 3, 
            'msg': 'Already liked', 
            'like_count': post.like_count,
            'has_liked': True
        })
    
    # 用户没有点赞过，添加点赞记录
    new_like = PostLike(user_id=user_id, post_id=post_id)
    db.session.add(new_like)
    
    # 增加帖子的点赞数
    post.like_count += 1
    db.session.commit()
    
    return jsonify({
        'status': 0, 
        'msg': 'Like successful', 
        'like_count': post.like_count,
        'has_liked': True
    })

# 查询用户是否已点赞帖子
@post_api.route('/api/posts/<int:post_id>/like/check', methods=['GET'])
def check_post_like(post_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Please login first', 'has_liked': False})
    
    # 查询点赞记录
    like = PostLike.query.filter_by(user_id=user_id, post_id=post_id).first()
    
    return jsonify({
        'status': 0,
        'has_liked': like is not None
    })

# 新增：删除帖子API
@post_api.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    # 获取用户ID（通过请求参数传递）
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Please provide user ID'})
    
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'status': 2, 'msg': 'Post not found'})
    
    # 检查用户是否是帖子的作者
    if str(post.user_id) != str(user_id):
        return jsonify({'status': 3, 'msg': 'You are not the author of this post'})
    
    # 删除帖子
    db.session.delete(post)
    db.session.commit()
    
    return jsonify({'status': 0, 'msg': 'Post deleted successfully'})


@post_api.route('/api/posts/top', methods=['GET'])
def get_top_posts():
    posts = Post.query.filter_by(is_top=True).order_by(Post.create_time.desc()).all()
    result = []
    for p in posts:
        result.append({
            'id': p.id,
            'title': p.title,
            'content': p.content,
            'user_id': p.user_id,
            'create_time': p.create_time.isoformat() if p.create_time else None,
            'like_count': p.like_count,
            'comment_count': p.comment_count,
            'is_top': p.is_top,
            'is_essence': p.is_essence,
            'tag': p.tag,
            'view_count': p.view_count,
            'status': p.status
        })
    return jsonify({'status': 0, 'posts': result})