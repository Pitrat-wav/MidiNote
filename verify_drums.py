from playwright.sync_api import sync_playwright
import os

def run_verification(page):
    # 1. Load the app
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # 2. Click 'Запустить движок'
    page.get_by_role("button", name="Запустить движок").click()
    page.wait_for_timeout(1000)

    # 3. Start playback
    # The first button is the play button
    page.locator("button").first.click()
    page.wait_for_timeout(2000)

    # 4. Navigate to Drums tab
    page.get_by_role("button", name="Drums").click()
    page.wait_for_timeout(500)

    # 5. Scroll to see the cowbell and patterns
    page.evaluate("window.scrollTo(0, 1000)")
    page.wait_for_timeout(1000)

    # Take screenshot of the Drums view with Cowbell
    page.screenshot(path="/home/jules/verification/screenshots/drums_with_cowbell.png")

    # 6. Open Mixer
    # Mixer is visible at the top
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/mixer_with_cowbell.png")

    # 7. Toggle kit to 808
    page.get_by_role("button", name="808").click()
    page.wait_for_timeout(1000)

    # Final state
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_verification(page)
        finally:
            context.close()
            browser.close()
