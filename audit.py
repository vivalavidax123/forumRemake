from openai import OpenAI

# Initialize DeepSeek API client
client = OpenAI(
    api_key="sk-ef0e1e3dbbc648858a3cc36a20f51b53",
    base_url="https://api.deepseek.com"       # DeepSeek official API address
)

def audit_by_deepseek(title, content):
    """
    Use DeepSeek V3 (deepseek-chat) to review the content of a post.
    Returns: (bool, str) True/False and reason
    """
    # 1. Construct the audit prompt. Require the AI to ONLY respond with:
    # "Compliant" or "Non-compliant, reason: ..."
    user_prompt = (
        "You are a forum content moderation AI. You must ONLY reply with: "
        "'Compliant' or 'Non-compliant, reason: ...'. No other language or explanations are allowed. "
        "Please determine whether the following post title and content contain any illegal, advertising, abusive, sensitive, or inappropriate content. "
        "If fully compliant, ONLY reply 'Compliant'. If non-compliant, ONLY reply 'Non-compliant, reason: ...' with a brief reason.\n"
        f"Title: {title}\nContent: {content}"
    )

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a forum content moderation AI. Only reply 'Compliant' or 'Non-compliant, reason: ...'."},
                {"role": "user", "content": user_prompt}
            ],
            stream=False,
            temperature=0.2,
            max_tokens=128
        )
        # 3. Parse AI reply
        answer = response.choices[0].message.content.strip()
        # If "Compliant" present and not "Non-compliant", pass
        if "Compliant" in answer and "Non-compliant" not in answer:
            return True, "Approved"
        elif "Non-compliant" in answer:
            return False, answer   # Return non-compliance reason
        else:
            # AI reply not following format; raise for admin
            return False, f"Unexpected AI output format: {answer}"
    except Exception as e:
        return False, f"AI moderation exception: {str(e)}"
