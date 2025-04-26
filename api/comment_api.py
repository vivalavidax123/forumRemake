from flask import Blueprint, request, jsonify
from database import db, Comment, Post, CommentLike
from datetime import datetime, timezone
from ai_utils import ai_comment, get_deepseek
from zoneinfo import ZoneInfo
import audit


comment_api = Blueprint('comment_api', __name__)

@comment_api.route('/api/comments', methods=['POST'])
def add_comment():
    data = request.get_json()
    post_id = data.get('post_id')
    user_id = data.get('user_id')
    content = data.get('content')
    parent_id = data.get('parent_id')

    if not (post_id and user_id and content):
        return jsonify({'status': 1, 'msg': 'Missing parameters.'})


    # Limit to a maximum of 2-level comments
    if parent_id:
        parent_comment = Comment.query.get(parent_id)
        if not parent_comment:
            return jsonify({'status': 3, 'msg': 'Parent comment does not exist.'})
        if parent_comment.parent_id:
            return jsonify({'status': 4, 'msg': 'Only up to two levels of comments are allowed. Cannot reply to this comment.'})

    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content,
        parent_id=parent_id,
    )
    db.session.add(comment)
    # Synchronously update the post's comment count
    post = Post.query.get(post_id)
    if post:
        post.comment_count += 1
    db.session.commit()

    # Check for @deepseek or @bot in content
    if ('@deepseek' in content.lower()) or ('@bot' in content.lower()):
        # 1. Get or create bot user
        bot_user = get_deepseek()
        # 2. Get post's title and content (for AI understanding)
        post_title = post.title if post else None
        post_content = post.content if post else None
        # 3. Call AI to generate reply
        ai_reply = ai_comment(user_comment=content, post_title=post_title, post_content=post_content)
        # 4. Insert AI reply as comment
        bot_comment = Comment(
            post_id=post_id,
            user_id=bot_user.id,
            content=ai_reply,
            parent_id=comment.id,
        )
        db.session.add(bot_comment)
        if post:
            post.comment_count += 1
        db.session.commit()

    return jsonify({'status': 0, 'msg': 'Comment added successfully.', 'comment_id': comment.id})

@comment_api.route('/api/comments', methods=['GET'])
def get_comments():
    post_id = request.args.get('post_id')
    if not post_id:
        return jsonify({'status': 1, 'msg': 'Missing post_id parameter.'})
    comments = Comment.query.filter_by(post_id=post_id) \
        .order_by(Comment.create_time.asc(), Comment.id.asc()).all()
    result = []
    for c in comments:
        result.append({
            'id': c.id,
            'user_id': c.user_id,
            'content': c.content,
            'create_time': c.create_time.isoformat() if c.create_time else None,
            'like_count': c.like_count
        })
    return jsonify({'status': 0, 'comments': result})

# Like a comment
@comment_api.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def like_comment(comment_id):
    # 从请求中获取用户ID
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'status': 2, 'msg': 'Please log in first'})
    
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'status': 1, 'msg': 'Comment not found'})
    
    # 检查用户是否已经点赞过这条评论
    existing_like = CommentLike.query.filter_by(
        user_id=user_id,
        comment_id=comment_id
    ).first()
    
    if existing_like:
        # 用户已经点赞过，返回提示
        return jsonify({
            'status': 3, 
            'msg': 'Already liked', 
            'like_count': comment.like_count,
            'has_liked': True
        })
    
    # 用户没有点赞过，添加点赞记录
    new_like = CommentLike(user_id=user_id, comment_id=comment_id)
    db.session.add(new_like)
    
    # 增加评论的点赞数
    comment.like_count += 1
    db.session.commit()
    
    return jsonify({
        'status': 0, 
        'msg': 'Like successful', 
        'like_count': comment.like_count,
        'has_liked': True
    })

# 查询用户是否已点赞评论
@comment_api.route('/api/comments/<int:comment_id>/like/check', methods=['GET'])
def check_comment_like(comment_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'status': 1, 'msg': 'Please login first', 'has_liked': False})
    
    # 查询点赞记录
    like = CommentLike.query.filter_by(user_id=user_id, comment_id=comment_id).first()
    
    return jsonify({
        'status': 0,
        'has_liked': like is not None
    })