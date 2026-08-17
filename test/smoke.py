#!/usr/bin/env python3
"""Playwright smoke pass over the built page.

Serves docs/ on a local port, then drives the real UI at desktop and phone
widths: type a subject, cycle every mode, check the locked rows and the live
assembly, check Copy is disabled with an empty subject. Screenshots land in
test/screenshots/.

    python3 test/smoke.py

Node Playwright is not installed on this machine, the Python package is, so this
is the Python one.
"""

import http.server
import json
import functools
import socket
import socketserver
import threading
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SHOTS = ROOT / "test" / "screenshots"
VIEWPORTS = [("desktop", 1440, 900), ("phone", 390, 844)]
CHARACTER_MODES = {"face-lock", "outfit-styling", "char-sheet"}
SUBJECT = "a woman with jet black hair in a cropped white ribbed tank"

failures = []
checks = 0


def check(label, condition, detail=""):
    global checks
    checks += 1
    if not condition:
        failures.append(f"{label} :: {detail}" if detail else label)


def carries_subject(text, subject):
    """Modes that open on the subject capitalize its first letter."""
    return subject in text or subject[0].upper() + subject[1:] in text


ENHANCE_URL = "https://openrouter.ai/api/v1/chat/completions"


def check_enhance_wiring(page, name):
    """Drive the enhance accordion with a stubbed OpenRouter, no network, no key."""
    seen = {}

    def stub(status, body):
        def handler(route):
            seen["url"] = route.request.url
            seen["auth"] = route.request.headers.get("authorization", "")
            seen["body"] = route.request.post_data
            route.fulfill(status=status, content_type="application/json", body=body)
        return handler

    page.fill("#subject", SUBJECT)
    page.click("#enhanceBox summary")
    page.fill("#apiKey", "sk-or-v1-fake-key")
    before = page.inner_text("#promptOut")

    page.route(ENHANCE_URL, stub(401, '{"error":{"message":"no"}}'))
    page.click("#enhanceBtn")
    page.wait_for_selector("#enhanceError:not([hidden])", timeout=5000)
    check(f"{name}: 401 shows an inline error",
          "rejected that key" in page.inner_text("#enhanceError"),
          page.inner_text("#enhanceError"))
    check(f"{name}: 401 leaves the deterministic prompt untouched",
          page.inner_text("#promptOut") == before)
    check(f"{name}: 401 leaves the enhanced panel hidden", page.locator("#enhancedPanel").is_hidden())
    check(f"{name}: key rides the Authorization header",
          seen.get("auth") == "Bearer sk-or-v1-fake-key", seen.get("auth", ""))
    check(f"{name}: key is never in the request URL", "sk-or-v1-fake-key" not in seen.get("url", ""))
    check(f"{name}: key is never in the request body", "sk-or-v1-fake-key" not in (seen.get("body") or ""))
    page.unroute(ENHANCE_URL)

    page.route(ENHANCE_URL, stub(200, '{"choices":[{"message":{"content":"an enhanced prompt"}}]}'))
    page.click("#enhanceBtn")
    page.wait_for_selector("#enhancedPanel:not([hidden])", timeout=5000)
    check(f"{name}: success renders in its own panel",
          "an enhanced prompt" in page.inner_text("#enhancedOut"))
    check(f"{name}: success never overwrites the deterministic prompt",
          page.inner_text("#promptOut") == before)
    page.unroute(ENHANCE_URL)

    page.click("#clearKeyBtn")
    check(f"{name}: clear key empties the field", page.input_value("#apiKey") == "")


def free_port():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve(port):
    handler = functools.partial(QuietHandler, directory=str(DOCS))
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd


def run():
    SHOTS.mkdir(parents=True, exist_ok=True)
    presets = json.loads((ROOT / "grammar" / "presets.json").read_text())
    port = free_port()
    httpd = serve(port)
    url = f"http://127.0.0.1:{port}/index.html"

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for name, width, height in VIEWPORTS:
                page = browser.new_page(viewport={"width": width, "height": height})
                problems = []
                page.on("console", lambda message: problems.append(message.text)
                        if message.type == "error" else None)
                page.on("pageerror", lambda error: problems.append(f"pageerror: {error}"))

                page.goto(url, wait_until="domcontentloaded")
                page.wait_for_selector('body[data-ready="true"]', timeout=10000)

                # empty subject: copy is off, hint is shown
                check(f"{name}: copy disabled with empty subject",
                      page.is_disabled("#copyBtn"))
                check(f"{name}: empty-state hint shown",
                      "Type a subject" in page.inner_text("#copyState"),
                      page.inner_text("#copyState"))
                check(f"{name}: enhance accordion present", page.is_visible("#enhanceBox"))

                # typing turns the tool on
                page.fill("#subject", SUBJECT)
                check(f"{name}: copy enabled with a subject", page.is_enabled("#copyBtn"))
                first_prompt = page.inner_text("#promptOut")
                check(f"{name}: prompt contains the subject", carries_subject(first_prompt, SUBJECT))
                check(f"{name}: character count rendered",
                      "characters" in page.inner_text("#charCount"),
                      page.inner_text("#charCount"))

                for mode in presets["modes"]:
                    mode_id = mode["id"]
                    page.click(f'.mode[data-mode="{mode_id}"]')
                    page.wait_for_timeout(60)

                    check(f"{name}/{mode_id}: mode selected",
                          page.get_attribute(f'.mode[data-mode="{mode_id}"]', "aria-checked") == "true")

                    text = page.inner_text("#promptOut")
                    check(f"{name}/{mode_id}: prompt still carries the subject",
                          carries_subject(text, SUBJECT))
                    check(f"{name}/{mode_id}: ratio hint shown",
                          mode["recommendedRatio"] in page.inner_text("#ratioChip"),
                          page.inner_text("#ratioChip"))

                    control_count = len(mode.get("controls", {}))
                    rendered = page.locator("#controlGroups .presetrow").count()
                    check(f"{name}/{mode_id}: controls rendered",
                          rendered == control_count, f"{rendered} of {control_count}")

                    locked = page.locator("#controlGroups .lockrow").count()
                    if mode_id in CHARACTER_MODES:
                        check(f"{name}/{mode_id}: locked row rendered", locked == 1)
                        check(f"{name}/{mode_id}: locked row explains why",
                              mode["lockedNote"] in page.inner_text("#controlGroups .lockrow"))
                    else:
                        check(f"{name}/{mode_id}: no locked row", locked == 0)

                    # live assembly: flip the first control and the prompt must move
                    presets_buttons = page.locator("#controlGroups .presetrow").first.locator("button")
                    if presets_buttons.count() > 1:
                        before = page.inner_text("#promptOut")
                        presets_buttons.nth(1).click()
                        page.wait_for_timeout(60)
                        after = page.inner_text("#promptOut")
                        check(f"{name}/{mode_id}: prompt updates live", before != after)
                        presets_buttons.nth(0).click()
                        page.wait_for_timeout(60)

                    page.screenshot(path=str(SHOTS / f"{name}-{mode_id}.png"), full_page=(name == "phone"))

                check_enhance_wiring(page, name)

                # empty it again and copy locks back up
                page.fill("#subject", "   ")
                page.wait_for_timeout(60)
                check(f"{name}: copy re-disabled on whitespace subject", page.is_disabled("#copyBtn"))

                fatal = [p for p in problems if "Content Security Policy" in p or "pageerror" in p]
                check(f"{name}: no CSP violations or page errors", not fatal, "; ".join(fatal))
                if problems:
                    print(f"  console noise ({name}): {problems}")

                page.close()
            browser.close()
    finally:
        httpd.shutdown()

    status = "FAIL" if failures else "PASS"
    print(f"{status}  smoke (playwright)  ({checks} checks)")
    for failure in failures:
        print(f"      {failure}")
    print(f"  screenshots: {SHOTS}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run())
