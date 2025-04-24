from database import app
from api import user_api, post_api

app.register_blueprint(user_api)
app.register_blueprint(post_api)

if __name__ == "__main__":
    app.run(debug=True)
