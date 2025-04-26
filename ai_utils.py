from database import db, User
from openai import OpenAI

# 初始化 DeepSeek API 客户端
client = OpenAI(
    api_key="sk-ef0e1e3dbbc648858a3cc36a20f51b53",
    base_url="https://api.deepseek.com"       # DeepSeek官方API地址
)

def get_deepseek(username="deepseek_bot", avatar=None):
    """
    检查AI bot用户是否存在，不存在则创建。返回User对象。
    :param username: bot的用户名（比如 deepseek_bot）
    :param avatar: 头像路径
    """
    bot = User.query.filter_by(username=username).first()
    if not bot:
        bot = User(
            username=username,
            email=None,
            avatar=avatar or "/static/avatars/deepseek.jpg",  # 默认头像
            password_hash="",    # AI不需要密码
            is_admin=False,
            bio="DeepSeek OvO"
        )
        db.session.add(bot)
        db.session.commit()
    return bot



def ai_comment(user_comment, post_title=None, post_content=None):
    """
    自动生成 AI 评论，返回字符串。
    - post_id: 帖子id（可选，便于未来日志记录或更复杂场景）
    - user_comment: 用户刚刚评论的内容
    - post_title/post_content: 帖子的标题和内容（可选，可用来提升AI理解能力）
    """
    # 1. 构造 prompt，描述AI的身份和任务
    system_prompt = (
        "You are a regular user of an online forum. "
        "Your style is casual, direct, and natural, like a real person leaving a short comment. "
        "Keep replies brief and to the point—usually one or two sentences. "
        "Avoid using too many emojis or hashtags. "
        "You can express personal opinions, agreement, disagreement, or even make a quick joke, but don't overdo it. "
        "Reply only in English."
    )

    user_prompt = (
        f"Post title: {post_title}\n"
        f"Post content: {post_content}\n"
        f"User comment: {user_comment}\n"
        "Please reply to the user's comment above as a real forum user. "
        "Your answer should be short, direct, and sound just like a human comment on a forum like Reddit or Tieba."
    )

    # 2. 调用 DeepSeek API
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            stream=False,
            temperature=0.8,    # 增加AI活跃度，可根据需求调整
            max_tokens=128
        )
        reply = response.choices[0].message.content.strip()
        return reply
    except Exception as e:
        # 日志记录
        print(f"AI 评论生成失败: {e}")
        return "（AI助手出错，无法回复）"