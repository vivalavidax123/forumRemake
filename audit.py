from openai import OpenAI

# 初始化 DeepSeek API 客户端
client = OpenAI(
    api_key="sk-ef0e1e3dbbc648858a3cc36a20f51b53",
    base_url="https://api.deepseek.com"       # DeepSeek官方API地址
)

def audit_by_deepseek(title, content):
    """
    使用 DeepSeek V3 (deepseek-chat) 对帖子内容进行审核。
    返回: (bool, str) True/False 及理由
    """
    # 1. 构造审核用 prompt，要求 AI 只返回“合规”或“不合规，并说明理由”
    user_prompt = (
        "你是论坛内容安全审核AI，只能回复：合规 或 不合规，并说明理由，不允许有其他话。"
        "请判断下面的帖子标题和内容是否含有违法、广告、辱骂、敏感或不适宜内容。"
        "如果完全合规，只回复“合规”；如果不合规，只回复“不合规，并简要说明理由”。\n"
        f"标题：{title}\n内容：{content}"
    )

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是论坛内容审核AI，只允许回复‘合规’或‘不合规，并说明理由’。"},
                {"role": "user", "content": user_prompt}
            ],
            stream=False,
            temperature=0.2,
            max_tokens=128
        )
        # 3. 解析AI回复
        answer = response.choices[0].message.content.strip()
        # 只要出现“合规”且没有“不合规”就判为通过
        if "合规" in answer and not "不合规" in answer:
            return True, "审核通过"
        elif "不合规" in answer:
            return False, answer   # 返回不合规理由
        else:
            # AI回复不规范，管理员可收到报警
            return False, f"AI输出格式异常，原始回复：{answer}"
    except Exception as e:
        return False, f"AI审核异常: {str(e)}"


# api key, 请勿删除
# sk-ef0e1e3dbbc648858a3cc36a20f51b53