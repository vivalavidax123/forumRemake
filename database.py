from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'  # 数据库文件名test.db
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False         # 关闭追踪（gpt给的，不知道啥用
db = SQLAlchemy(app)


class User(db.Model): # 用户
    id = db.Column(db.Integer, primary_key=True)              # 主键
    username = db.Column(db.String(80), unique=True, nullable=False)  # 用户名，唯一且不能为空
    email = db.Column(db.String(120), unique=True)
    avatar = db.Column(db.String(255)) #头像
    create_time = db.Column(db.DateTime,
                            default=lambda: datetime.now(timezone.utc))#创建时间
    post_count = db.Column(db.Integer, default=0)             # 发帖数量


class Post(db.Model): #
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.Text)                                #内容
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    create_time = db.Column(db.DateTime,
                            default=lambda: datetime.now(timezone.utc))#创建时间
    like_count = db.Column(db.Integer, default=0)               # 点赞数
    comment_count = db.Column(db.Integer, default=0)            # 评论数

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))  # 评论属于哪条帖子
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # 评论者
    content = db.Column(db.Text)                               # 内容
    create_time = db.Column(db.DateTime,
                            default=lambda: datetime.now(timezone.utc))#创建时间
    like_count = db.Column(db.Integer, default=0)              # 点赞数


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
        # 下面可以加演示用的数据插入代码

