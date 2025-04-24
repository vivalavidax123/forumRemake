from flask import Blueprint, request, jsonify
from database import db, Post

post_api = Blueprint('post_api', __name__)

@post_api.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    # ...发帖逻辑...
    return jsonify({'status': 0, 'msg': '发帖成功'})
