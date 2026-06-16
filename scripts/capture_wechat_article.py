import asyncio
import sys
from pathlib import Path

from camoufox.async_api import AsyncCamoufox


async def main(url: str, output_path: str) -> None:
    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page(viewport={"width": 1280, "height": 1800})
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector("#js_content", timeout=15000)
        await page.wait_for_function(
            """() => {
                const node = document.querySelector("#js_content");
                return node && node.innerText && node.innerText.trim().length > 120;
            }""",
            timeout=15000,
        )
        await page.wait_for_timeout(1200)
        await page.screenshot(path=output_path, full_page=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: capture_wechat_article.py <url> <output_path>")
    asyncio.run(main(sys.argv[1], sys.argv[2]))
