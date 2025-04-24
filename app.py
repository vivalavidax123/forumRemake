from database import app
from api import user_api, post_api
from api.comment_api import comment_api

app.register_blueprint(user_api)
app.register_blueprint(post_api)
app.register_blueprint(comment_api)

# 添加首页路由
@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == "__main__":
    app.run(debug=True)