#!/usr/bin/env python3
"""
重新设计 flomo 笔记页面 - 美观版
"""

import re
from pathlib import Path
from html.parser import HTMLParser


class MemoExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.memos = []
        self.current_memo = {}
        self.in_memo = False
        self.in_time = False
        self.in_content = False
        self.content_html = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "div" and attrs_dict.get("class") == "memo":
            self.in_memo = True
            self.current_memo = {}
        elif self.in_memo and tag == "div" and attrs_dict.get("class") == "time":
            self.in_time = True
        elif self.in_memo and tag == "div" and attrs_dict.get("class") == "content":
            self.in_content = True
            self.content_html = ""
        elif self.in_content:
            attrs_str = " ".join(f'{k}="{v}"' for k, v in attrs)
            self.content_html += f"<{tag}{' ' + attrs_str if attrs_str else ''}>"

    def handle_endtag(self, tag):
        if tag == "div" and self.in_time:
            self.in_time = False
        elif tag == "div" and self.in_content:
            self.in_content = False
            self.current_memo["content"] = self.content_html
        elif tag == "div" and self.in_memo and "content" in self.current_memo:
            self.memos.append(self.current_memo)
            self.in_memo = False
        elif self.in_content:
            self.content_html += f"</{tag}>"

    def handle_data(self, data):
        if self.in_time:
            self.current_memo["time"] = data.strip()
        elif self.in_content:
            self.content_html += data


def clean_content(html):
    """移除标签行，清理内容"""
    html = re.sub(r"<p>\s*#\S+\s*</p>", "", html)
    html = re.sub(r"<li>\s*#\S+\s*</li>", "", html)
    html = re.sub(r"<p>\s*</p>", "", html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def format_date(time_str):
    """格式化日期显示 - 更友好的格式"""
    match = re.match(r"(\d{4})-(\d{2})-(\d{2})", time_str)
    if match:
        months = [
            "",
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]
        year, month, day = match.groups()
        return f"{months[int(month)]} {int(day)}, {year}"
    return time_str


def generate_page(memos, title, subtitle, output_path):
    """生成美观的笔记页面 - 卡片式设计"""

    memo_html = ""
    for memo in memos:
        content = clean_content(memo.get("content", ""))
        if not content or content == " ":
            continue
        date = format_date(memo.get("time", ""))

        memo_html += f"""
    <article class="card">
      <div class="card-content">{content}</div>
      <time class="card-date">{date}</time>
    </article>
"""

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - 阿鸭的随笔</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --card-bg: rgba(255, 255, 255, 0.9);
      --text: #333333;
      --text-secondary: #888888;
      --text-muted: #aaaaaa;
      --shadow: 0 2px 8px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06);
      --shadow-hover: 0 4px 12px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1);
      --radius: 20px;
      --radius-sm: 14px;
      --serif: 'Noto Serif SC', 'Songti SC', Georgia, serif;
      --sans: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
    }}

    * {{ margin: 0; padding: 0; box-sizing: border-box; }}

    html {{
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
    }}

    body {{
      font-family: var(--serif);
      background: linear-gradient(160deg, #fdfbfb 0%, #ebedee 100%);
      background-attachment: fixed;
      color: var(--text);
      line-height: 1.8;
      min-height: 100vh;
      padding: 24px;
    }}

    /* Container */
    .container {{
      max-width: 640px;
      margin: 0 auto;
    }}

    /* Header Card */
    .header-card {{
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 40px 32px;
      margin-bottom: 20px;
      box-shadow: var(--shadow);
      text-align: center;
    }}

    .header-card a {{
      display: inline-block;
      margin-bottom: 20px;
    }}

    .header-card img {{
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }}

    .header-card a:hover img {{
      transform: scale(1.1);
    }}

    .header-card h1 {{
      font-size: 24px;
      font-weight: 500;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      color: var(--text);
    }}

    .header-card p {{
      font-family: var(--sans);
      font-size: 13px;
      color: var(--text-muted);
    }}

    /* Memo Card */
    .card {{
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 28px 28px 24px;
      margin-bottom: 16px;
      box-shadow: var(--shadow);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }}

    .card:hover {{
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }}

    .card-content {{
      font-size: 16px;
      line-height: 1.9;
      color: var(--text);
    }}

    .card-content p {{
      margin-bottom: 1em;
    }}

    .card-content p:last-child {{
      margin-bottom: 0;
    }}

    .card-content ul,
    .card-content ol {{
      padding-left: 1.4em;
      margin: 0.8em 0;
    }}

    .card-content li {{
      margin-bottom: 0.4em;
      line-height: 1.8;
    }}

    .card-content img {{
      max-width: 100%;
      border-radius: var(--radius-sm);
      margin: 1em 0;
    }}

    .card-date {{
      display: block;
      font-family: var(--sans);
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 16px;
      letter-spacing: 0.02em;
    }}

    /* Responsive */
    @media (max-width: 480px) {{
      body {{
        padding: 16px;
      }}

      .header-card {{
        padding: 32px 24px;
        border-radius: 16px;
      }}

      .header-card h1 {{
        font-size: 20px;
      }}

      .card {{
        padding: 24px 22px 20px;
        border-radius: 16px;
        margin-bottom: 12px;
      }}

      .card-content {{
        font-size: 15px;
      }}
    }}

    /* Selection */
    ::selection {{
      background: #e8e8e8;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header class="header-card">
      <a href="../index.html">
        <img src="../avatar.jpg" alt="阿鸭">
      </a>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
    <main>
{memo_html}
    </main>
  </div>
</body>
</html>
"""

    Path(output_path).write_text(html, encoding="utf-8")
    print(f"Generated: {output_path}")


def generate_index(base):
    """生成美观的首页"""

    html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>阿鸭的随笔</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: linear-gradient(160deg, #fdfbfb 0%, #ebedee 100%);
      --card-bg: rgba(255, 255, 255, 0.85);
      --text: #333333;
      --text-secondary: #666666;
      --text-muted: #aaaaaa;
      --shadow: 0 2px 8px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06);
      --shadow-hover: 0 4px 12px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.1);
      --radius: 24px;
      --radius-sm: 16px;
      --serif: 'Noto Serif SC', 'Songti SC', Georgia, serif;
      --sans: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html {
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
    }

    body {
      font-family: var(--serif);
      background: linear-gradient(160deg, #fdfbfb 0%, #ebedee 100%);
      background-attachment: fixed;
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    /* Main Card */
    .main-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 48px 40px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow);
    }

    /* Profile */
    .profile {
      text-align: center;
      margin-bottom: 36px;
    }

    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .name {
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }

    .bio {
      font-family: var(--sans);
      font-size: 14px;
      color: var(--text-muted);
    }

    /* Nav Links */
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      background: #f8f8f8;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      background: #f0f0f0;
      transform: translateX(4px);
    }

    .nav-link:active {
      transform: scale(0.98);
    }

    .nav-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .nav-icon.gold {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    }

    .nav-icon.blue {
      background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
    }

    .nav-text {
      flex: 1;
    }

    .nav-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .nav-desc {
      font-family: var(--sans);
      font-size: 12px;
      color: var(--text-muted);
    }

    .nav-arrow {
      color: var(--text-muted);
      font-size: 18px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      body {
        padding: 16px;
        align-items: flex-start;
        padding-top: 60px;
      }

      .main-card {
        padding: 40px 28px 32px;
        border-radius: 20px;
      }

      .avatar {
        width: 80px;
        height: 80px;
      }

      .name {
        font-size: 20px;
      }

      .nav-link {
        padding: 16px 18px;
      }
    }

    /* Selection */
    ::selection {
      background: #e8e8e8;
    }
  </style>
</head>
<body>
  <div class="main-card">
    <div class="profile">
      <img src="avatar.jpg" alt="阿鸭" class="avatar">
      <h1 class="name">阿鸭的随笔</h1>
      <p class="bio">记录生活中的碎片与光亮</p>
    </div>
    <nav class="nav-links">
      <a href="jiguang/index.html" class="nav-link">
        <div class="nav-icon gold">✨</div>
        <div class="nav-text">
          <div class="nav-title">吉光片羽</div>
          <div class="nav-desc">365 条随想</div>
        </div>
        <span class="nav-arrow">›</span>
      </a>
      <a href="dushu/index.html" class="nav-link">
        <div class="nav-icon blue">📖</div>
        <div class="nav-text">
          <div class="nav-title">读书笔记</div>
          <div class="nav-desc">76 条摘录</div>
        </div>
        <span class="nav-arrow">›</span>
      </a>
    </nav>
  </div>
</body>
</html>
"""

    (base / "index.html").write_text(html, encoding="utf-8")
    print("Generated: index.html")


def main():
    base = Path(__file__).parent

    # 生成首页
    generate_index(base)

    # 处理吉光片羽
    jiguang_html = (base / "jiguang" / "阿鸭的笔记.html").read_text(encoding="utf-8")
    parser1 = MemoExtractor()
    parser1.feed(jiguang_html)
    generate_page(
        parser1.memos,
        "吉光片羽",
        f"{len(parser1.memos)} 条随想",
        base / "jiguang" / "index.html",
    )

    # 处理读书笔记
    dushu_html = (base / "dushu" / "阿鸭的笔记.html").read_text(encoding="utf-8")
    parser2 = MemoExtractor()
    parser2.feed(dushu_html)
    generate_page(
        parser2.memos,
        "读书笔记",
        f"{len(parser2.memos)} 条摘录",
        base / "dushu" / "index.html",
    )


if __name__ == "__main__":
    main()
