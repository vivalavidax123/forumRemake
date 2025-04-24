from flask import Blueprint, request, jsonify, session
from database import db, Comment, Post, User

comment_api = Blueprint('comment_api', __name__)

@comment_api.route('/api/comments', methods=['POST'])
def create_comment():
    # 检查用户是否登录
    if 'user_id' not in session:
        return jsonify({'status': 1, 'msg': '请先登录'})
    
    data = request.get_json()
    post_id = data.get('post_id')
    content = data.get('content')
    
    if not post_id or not content:
        return jsonify({'status': 1, 'msg': '帖子ID和评论内容不能为空'})
    
    user_id = session['user_id']
    
    # 检查帖子是否存在
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'status': 1, 'msg': '帖子不存在'})
    
    # 创建新评论
    new_comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content
    )
    
    try:
        # 添加评论到数据库
        db.session.add(new_comment)
        
        # 更新帖子的评论数量
        post.comment_count += 1
        
        db.session.commit()
        
        # 获取评论用户信息
        user = User.query.get(user_id)
        username = user.username if user else '未知用户'
        
        return jsonify({
            'status': 0, 
            'msg': '评论成功',
            'comment': {
                'id': new_comment.id,
                'content': new_comment.content,
                'user_id': user_id,
                'username': username,
                'create_time': new_comment.create_time.strftime('%Y-%m-%d %H:%M:%S'),
                'like_count': 0
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 1, 'msg': f'评论失败: {str(e)}'})

@comment_api.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def like_comment(comment_id):
    if 'user_id' not in session:
        return jsonify({'status': 1, 'msg': '请先登录'})
    
    comment = Comment.query.get(comment_id)
    
    if not comment:
        return jsonify({'status': 1, 'msg': '评论不存在'})
    
    try:
        comment.like_count += 1
        db.session.commit()
        return jsonify({'status': 0, 'msg': '点赞成功', 'like_count': comment.like_count})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 1, 'msg': f'点赞失败: {str(e)}'})