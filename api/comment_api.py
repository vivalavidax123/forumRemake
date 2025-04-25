from flask import Blueprint, request, jsonify
from database import db, Comment, Post
from datetime import datetime, timezone
from ai_utils import ai_comment, get_deepseek
from zoneinfo import ZoneInfo

comment_api = Blueprint('comment_api', __name__)

@comment_api.route('/api/comments', methods=['POST'])
def add_comment():
    data = request.get_json()
    post_id = data.get('post_id')
    user_id = data.get('user_id')
    content = data.get('content')
    parent_id = data.get('parent_id')

    if not (post_id and user_id and content):
        return jsonify({'status': 1, 'msg': '缺少参数'})

    # 限制最多二级评论
    if parent_id:
        parent_comment = Comment.query.get(parent_id)
        if not parent_comment:
            return jsonify({'status': 2, 'msg': '父评论不存在'})
        if parent_comment.parent_id:
            return jsonify({'status': 3, 'msg': '最多只允许二级评论，无法再回复此评论'})


    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=content,
        parent_id=parent_id,
    )
    db.session.add(comment)
    # 同步更新帖子评论数
    post = Post.query.get(post_id)
    if post:
        post.comment_count += 1
    db.session.commit()


    # 检查是否@deepseek
    if ('@deepseek' in content.lower()) or ('@bot' in content.lower()):
        # 1. 获取或创建 bot 用户
        bot_user = get_deepseek()
        # 2. 获取帖子的标题和内容（用于AI增强理解）
        post_title = post.title if post else None
        post_content = post.content if post else None
        # 3. 调用 AI 生成回复
        ai_reply = ai_comment(user_comment=content, post_title=post_title, post_content=post_content)
        # 4. 插入AI回复评论
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


    return jsonify({'status': 0, 'msg': '评论成功', 'comment_id': comment.id})



@comment_api.route('/api/comments', methods=['GET'])
def get_comments():
    post_id = request.args.get('post_id')
    if not post_id:
        return jsonify({'status': 1, 'msg': '缺少post_id参数'})
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


# 点赞评论
@comment_api.route('/api/comments/<int:comment_id>/like', methods=['POST'])
def like_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'status': 1, 'msg': '评论不存在'})
    comment.like_count += 1
    db.session.commit()
    return jsonify({'status': 0, 'msg': '点赞成功', 'like_count': comment.like_count})