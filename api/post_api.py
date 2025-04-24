from flask import Blueprint, request, jsonify, session
from database import db, Post, User, Comment

post_api = Blueprint('post_api', __name__)

@post_api.route('/api/posts', methods=['POST'])
def create_post():
    # 检查用户是否登录
    if 'user_id' not in session:
        return jsonify({'status': 1, 'msg': '请先登录'})
    
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    
    if not title or not content:
        return jsonify({'status': 1, 'msg': '标题和内容不能为空'})
    
    user_id = session['user_id']
    
    # 创建新帖子
    new_post = Post(
        title=title,
        content=content,
        user_id=user_id
    )
    
    try:
        # 添加帖子到数据库
        db.session.add(new_post)
        
        # 更新用户的发帖数量
        user = User.query.get(user_id)
        user.post_count += 1
        
        db.session.commit()
        return jsonify({
            'status': 0, 
            'msg': '发帖成功',
            'post_id': new_post.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 1, 'msg': f'发帖失败: {str(e)}'})

@post_api.route('/api/posts', methods=['GET'])
def get_posts():
    # 分页参数
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # 排序方式
    sort_by = request.args.get('sort_by', 'newest')
    
    # 查询帖子
    query = Post.query
    
    if sort_by == 'newest':
        query = query.order_by(Post.create_time.desc())
    elif sort_by == 'hottest':
        query = query.order_by(Post.like_count.desc())
    
    # 分页获取帖子
    posts_page = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = posts_page.items
    
    # 构建响应数据
    result = []
    for post in posts:
        user = User.query.get(post.user_id)
        username = user.username if user else '未知用户'
        
        result.append({
            'id': post.id,
            'title': post.title,
            'content': post.content[:200] + '...' if len(post.content) > 200 else post.content,
            'user_id': post.user_id,
            'username': username,
            'create_time': post.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'like_count': post.like_count,
            'comment_count': post.comment_count
        })
    
    return jsonify({
        'status': 0,
        'total': posts_page.total,
        'pages': posts_page.pages,
        'current_page': page,
        'posts': result
    })

@post_api.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_detail(post_id):
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'status': 1, 'msg': '帖子不存在'})
    
    user = User.query.get(post.user_id)
    username = user.username if user else '未知用户'
    
    # 获取评论
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.create_time.desc()).all()
    comment_list = []
    
    for comment in comments:
        comment_user = User.query.get(comment.user_id)
        comment_username = comment_user.username if comment_user else '未知用户'
        
        comment_list.append({
            'id': comment.id,
            'content': comment.content,
            'user_id': comment.user_id,
            'username': comment_username,
            'create_time': comment.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'like_count': comment.like_count
        })
    
    return jsonify({
        'status': 0,
        'post': {
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'user_id': post.user_id,
            'username': username,
            'create_time': post.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'like_count': post.like_count,
            'comment_count': post.comment_count,
            'comments': comment_list
        }
    })

@post_api.route('/api/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    if 'user_id' not in session:
        return jsonify({'status': 1, 'msg': '请先登录'})
    
    post = Post.query.get(post_id)
    
    if not post:
        return jsonify({'status': 1, 'msg': '帖子不存在'})
    
    try:
        post.like_count += 1
        db.session.commit()
        return jsonify({'status': 0, 'msg': '点赞成功', 'like_count': post.like_count})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 1, 'msg': f'点赞失败: {str(e)}'})

@post_api.route('/api/search', methods=['GET'])
def search_posts():
    keyword = request.args.get('keyword', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    if not keyword:
        return jsonify({'status': 1, 'msg': '搜索关键词不能为空'})
    
    # 搜索标题和内容
    query = Post.query.filter(
        (Post.title.like(f'%{keyword}%')) | (Post.content.like(f'%{keyword}%'))
    ).order_by(Post.create_time.desc())
    
    # 分页获取搜索结果
    posts_page = query.paginate(page=page, per_page=per_page, error_out=False)
    posts = posts_page.items
    
    # 构建响应数据
    result = []
    for post in posts:
        user = User.query.get(post.user_id)
        username = user.username if user else '未知用户'
        
        result.append({
            'id': post.id,
            'title': post.title,
            'content': post.content[:200] + '...' if len(post.content) > 200 else post.content,
            'user_id': post.user_id,
            'username': username,
            'create_time': post.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'like_count': post.like_count,
            'comment_count': post.comment_count
        })
    
    return jsonify({
        'status': 0,
        'total': posts_page.total,
        'pages': posts_page.pages,
        'current_page': page,
        'posts': result
    })