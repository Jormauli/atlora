import asyncio
import platform

from camoufox.async_api import AsyncCamoufox


async def main() -> None:
    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page()
        await page.set_content('<main id="probe">atlora-wechat-extractor</main>')
        value = await page.locator("#probe").inner_text()
        if value != "atlora-wechat-extractor":
            raise RuntimeError(f"unexpected browser output: {value!r}")
        print(f"smoke_ok platform={platform.machine()} browser=camoufox")


if __name__ == "__main__":
    asyncio.run(main())
