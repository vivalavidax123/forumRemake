from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'  # 数据库文件名test.db
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False         # 关闭追踪（gpt给的，不知道啥用
db = SQLAlchemy(app)


class User(db.Model): # 用户
    id = db.Column(db.Integer, primary_key=True)              # 主键
    username = db.Column(db.String(80), unique=True, nullable=False)  # 用户名，唯一且不能为空
    email = db.Column(db.String(120))
    avatar = db.Column(db.String(255)) #头像
    create_time = db.Column(
        db.DateTime,
        default=lambda: datetime.now(ZoneInfo("Australia/Melbourne"))
    )#创建时间
    post_count = db.Column(db.Integer, default=0)             # 发帖数量
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    bio = db.Column(db.String(255))
    last_login = db.Column(db.DateTime)



class Post(db.Model): #
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.Text)                                #内容
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    create_time = db.Column(
        db.DateTime,
        default=lambda: datetime.now(ZoneInfo("Australia/Melbourne"))
    )#创建时间
    like_count = db.Column(db.Integer, default=0)               # 点赞数
    comment_count = db.Column(db.Integer, default=0)            # 评论数

    # ...
    tag = db.Column(db.String(64))                       # 帖子标签或分类
    is_top = db.Column(db.Boolean, default=False)        # 是否置顶
    is_essence = db.Column(db.Boolean, default=False)    # 是否加精
    view_count = db.Column(db.Integer, default=0)        # 浏览数
    status = db.Column(db.Integer, default=0)            # 审核




class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))  # 评论属于哪条帖子
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # 评论者
    content = db.Column(db.Text)                               # 内容
    create_time = db.Column(
        db.DateTime,
        default=lambda: datetime.now(ZoneInfo("Australia/Melbourne"))
    )#创建时间
    like_count = db.Column(db.Integer, default=0)              # 点赞数
    parent_id = db.Column(db.Integer, db.ForeignKey('comment.id'))  # 父评论ID
    is_deleted = db.Column(db.Boolean, default=False)  # 是否被删除
    status = db.Column(db.Integer, default=0)  # 审核


# 新增：记录用户点赞的表（使用复合主键）
class PostLike(db.Model):
    # 复合主键：用户ID + 帖子ID
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), primary_key=True)
    create_time = db.Column(
        db.DateTime,
        default=lambda: datetime.now(ZoneInfo("Australia/Melbourne"))
    )


# 新增：记录用户评论点赞的表
class CommentLike(db.Model):
    # 复合主键：用户ID + 评论ID
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comment.id'), primary_key=True)
    create_time = db.Column(
        db.DateTime,
        default=lambda: datetime.now(ZoneInfo("Australia/Melbourne"))
    )

class Follow(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    follower_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # 谁关注的
    followee_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # 关注谁
    create_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    # 可以加唯一约束防止重复关注
    __table_args__ = (db.UniqueConstraint('follower_id', 'followee_id'),)





def print_all_users():
    users = User.query.all()
    print("所有用户：")
    for u in users:
        print(f"id: {u.id}, username: {u.username}, email: {u.email}, avatar: {u.avatar}, create_time: {u.create_time}, post_count: {u.post_count}")


def print_all_posts():
    posts = Post.query.all()
    print("所有帖子：")
    for p in posts:
        print(f"id: {p.id}, title: {p.title}, content: {p.content}, user_id: {p.user_id}, create_time: {p.create_time}, like_count: {p.like_count}, comment_count: {p.comment_count}")



def print_all_comments():
    comments = Comment.query.all()
    print("所有评论：")
    for c in comments:
        print(f"id: {c.id}, post_id: {c.post_id}, user_id: {c.user_id}, content: {c.content}, create_time: {c.create_time}, like_count: {c.like_count}")



if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("已初始化database")
        # 下面可以加演示用的数据插入代码

