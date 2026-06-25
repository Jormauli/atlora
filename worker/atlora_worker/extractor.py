import asyncio
import re
import subprocess
import tempfile
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

CHALLENGE_MARKERS = ("环境异常", "完成验证", "访问过于频繁", "captcha", "verify")
WECHAT_USER_AGENT = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.45"
)


def looks_like_article(text):
    compact = re.sub(r"\s+", "", text or "")
    if len(compact) < 120:
        return False
    lowered = compact.lower()
    if any(marker in lowered for marker in CHALLENGE_MARKERS):
        return False
    chinese = len(re.findall(r"[\u4e00-\u9fff]", compact))
    return chinese / len(compact) >= 0.2


def parse_markdown(raw):
    raw = re.sub(r"^---[\s\S]*?---\s*", "", raw, count=1)
    title_match = re.search(r"^#\s+(.+)$", raw, flags=re.MULTILINE)
    title = title_match.group(1).strip() if title_match else None
    text = re.sub(r"^#\s+.+$", "", raw, count=1, flags=re.MULTILINE)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return {"title": title, "text": text}


def extract_markdown(url, output_dir):
    tool_dir = Path("/opt/wechat-article-for-ai")
    subprocess.run(
        ["python", "main.py", url, "--no-images", "--force", "-o", str(output_dir)],
        cwd=tool_dir,
        check=True,
        timeout=120,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    for markdown_file in output_dir.rglob("*.md"):
        parsed = parse_markdown(markdown_file.read_text(encoding="utf-8"))
        if looks_like_article(parsed["text"]):
            return parsed
    return None


def extract_html(url):
    response = requests.get(
        url,
        headers={
            "user-agent": WECHAT_USER_AGENT,
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        },
        timeout=45,
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    content = soup.select_one("#js_content")
    if not content:
        return None
    for tag in content.select("script,style,noscript"):
        tag.decompose()
    title = None
    title_node = soup.select_one("#activity-name")
    if title_node:
        title = title_node.get_text(" ", strip=True)
    text = content.get_text("\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if looks_like_article(text):
        return {"title": title, "text": text}
    return None


async def capture_screenshot(url, output_path):
    from camoufox.async_api import AsyncCamoufox

    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page(viewport={"width": 1280, "height": 1800}, user_agent=WECHAT_USER_AGENT)
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        try:
            await page.wait_for_selector("#js_content", timeout=20000)
        except Exception:
            pass
        await page.wait_for_timeout(2500)
        content = page.locator("#js_content")
        if await content.count():
            await content.first.screenshot(path=str(output_path))
        else:
            await page.screenshot(path=str(output_path), full_page=True)


def extract_article(url, on_stage):
    durations = {}
    with tempfile.TemporaryDirectory(prefix="atlora-wechat-") as temporary:
        temporary_path = Path(temporary)
        on_stage("extracting_text")
        started = time.monotonic()
        try:
            html = extract_html(url)
        except requests.RequestException:
            html = None
        durations["html"] = round((time.monotonic() - started) * 1000)
        if html:
            return {
                **html,
                "strategy": "wechat_markdown",
                "confidence": 1.0,
                "durationsMs": durations,
            }

        started = time.monotonic()
        try:
            markdown = extract_markdown(url, temporary_path / "markdown")
        except (subprocess.SubprocessError, OSError):
            markdown = None
        durations["markdown"] = round((time.monotonic() - started) * 1000)
        if markdown:
            return {
                **markdown,
                "strategy": "wechat_markdown",
                "confidence": 1.0,
                "durationsMs": durations,
            }

        on_stage("capturing_screenshot")
        screenshot = temporary_path / "article.png"
        started = time.monotonic()
        asyncio.run(capture_screenshot(url, screenshot))
        durations["screenshot"] = round((time.monotonic() - started) * 1000)
        on_stage("recognizing_text")
        started = time.monotonic()
        from .ocr import recognize_screenshot

        ocr = recognize_screenshot(screenshot)
        durations["ocr"] = round((time.monotonic() - started) * 1000)
        if not looks_like_article(ocr["text"]):
            raise RuntimeError("OCR_TEXT_UNUSABLE")
        return {
            "title": next((line.strip() for line in ocr["text"].splitlines() if line.strip()), None),
            "text": ocr["text"],
            "strategy": "wechat_screenshot_ocr",
            "confidence": ocr["confidence"],
            "durationsMs": durations,
        }
