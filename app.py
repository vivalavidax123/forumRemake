from flask import Flask, render_template, send_from_directory
from database import app, db
from api import user_api, post_api, comment_api

# 注册API蓝图
app.register_blueprint(user_api)
app.register_blueprint(post_api)
app.register_blueprint(comment_api)

# 添加页面路由
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/write')
def write():
    return render_template('write.html')

@app.route('/blog/<int:post_id>')
def blog(post_id):
    return render_template('blog.html', post_id=post_id)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # 确保数据库表已创建
    app.run(debug=True)