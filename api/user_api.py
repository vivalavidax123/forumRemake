from flask import Blueprint, request, jsonify
from database import db, User

user_api = Blueprint('user_api', __name__)

@user_api.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    # ...注册逻辑...
    return jsonify({'status': 0, 'msg': '注册成功'})
