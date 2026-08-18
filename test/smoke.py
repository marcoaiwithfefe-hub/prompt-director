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
import struct
import threading
import sys
import zlib
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
SHOTS = ROOT / "test" / "screenshots"
VIEWPORTS = [("desktop", 1440, 900), ("phone", 390, 844)]
CHARACTER_MODES = {"face-lock", "outfit-styling", "char-sheet"}
SUBJECT = "a woman with jet black hair in a cropped white ribbed tank"
ACTION = "she lifts the bottle and turns it toward the lens"
VIDEO_BLOCK_LABELS = [
    "Scene & Mood",
    "Subject Lock",
    "Movement",
    "Last Frame",
    "World Plate",
    "Sound Bed",
    "Capture Realism",
    "Camera Capture",
]

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


def select_mode(page, mode):
    """The media toggle owns the mode list, so a mode is reached through it."""
    page.click(f'.segment[data-media="{mode["mediaType"]}"]')
    page.wait_for_timeout(40)
    page.click(f'.mode[data-mode="{mode["id"]}"]')
    page.wait_for_timeout(60)


def locked_groups(mode):
    return [cid for cid, group in mode.get("controls", {}).items() if group.get("locked")]


def open_chip_groups(mode):
    return [cid for cid, group in mode.get("controls", {}).items() if not group.get("locked")]


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

    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(40)
    page.click('.mode[data-mode="face-lock"]')
    page.wait_for_timeout(60)
    page.fill("#subject", SUBJECT)
    if not page.locator("#enhanceBox[open]").count():
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


PREVIEW_GLOB = "**/previews/*.webp"
MISSING_PREVIEW = "**/previews/detail--backdrop--moody.webp"
# mirrors NO_PREVIEW_CONTROLS in docs/previews.js: sound chips render bare
NO_PREVIEW_CONTROLS = {"sound"}


def stub_picture(width, height, body, border, thickness=4):
    """A flat placeholder PNG, built here so the suite needs no image files on disk.

    The real previews are webp and land later; the browser decodes by
    content-type, so a PNG served at a .webp url is preview enough to prove the
    card, the thumbnail and the geometry.
    """
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # per-scanline filter: none
        for x in range(width):
            edge = x < thickness or y < thickness or x >= width - thickness or y >= height - thickness
            raw += bytes(border if edge else body)

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b""))


STUB = stub_picture(320, 400, (31, 31, 35), (215, 245, 66))


def serve_stub(route):
    route.fulfill(status=200, content_type="image/png", body=STUB)


def serve_missing(route):
    route.fulfill(status=404, content_type="text/plain", body="not generated yet")


def hover_fresh(page, target):
    """Point somewhere neutral first: re-hovering what the pointer already sits
    on fires no pointerover, and the card would never open."""
    page.mouse.move(760, 120)
    page.wait_for_timeout(40)
    target.hover()


def settle_fonts(page):
    """The web font arrives late here and shifts the panel by ~45px when it does.
    A screenshot waits for fonts, so an unsettled page moves the chip out from
    under the pointer mid-capture and the card closes."""
    page.evaluate("() => document.fonts.ready")
    page.wait_for_timeout(60)


def reopen(page):
    """Reload into a known state: no remembered probes, subject typed in."""
    page.mouse.move(760, 120)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_selector('body[data-ready="true"]', timeout=10000)
    page.fill("#subject", SUBJECT)
    settle_fonts(page)


def shoot_card(page, filename, tag):
    """A screenshot is the proof, so prove the card was in it."""
    page.screenshot(path=str(SHOTS / filename))
    check(f"{tag}: the card is still open in the screenshot",
          page.locator(".previewpop.is-open").count() == 1)


def check_previews(page, presets, name):
    """Hover previews on a pointer that can hover: card geometry, degradation,
    and the alt text following the language."""
    view = page.viewport_size

    # each file is probed once per visit and the answer is remembered, so both
    # halves of this check start from a fresh page
    page.route(PREVIEW_GLOB, serve_missing)  # real files may exist on disk now
    reopen(page)

    # with every picture missing, the page must look exactly as before
    hover_fresh(page, page.locator('.mode[data-mode="detail"]'))
    page.wait_for_timeout(400)
    check(f"{name}: a missing picture builds no card at all", page.locator(".previewpop").count() == 0)
    check(f"{name}: a missing picture leaves no image node", page.locator("#controlGroups img").count() == 0)
    check(f"{name}: a hovering pointer gets no inline thumbnail", page.locator(".previewthumb").count() == 0)

    page.route(PREVIEW_GLOB, serve_stub)
    page.route(MISSING_PREVIEW, serve_missing)  # later route wins, so this one 404s
    reopen(page)
    nav_bottom = page.evaluate("() => document.querySelector('.topnav').getBoundingClientRect().bottom")

    flipped = 0
    for mode in presets["modes"]:
        mode_id = mode["id"]
        if not mode.get("controls"):
            continue
        select_mode(page, mode)

        chip = page.locator("#controlGroups .presetrow").first.locator("button").first
        label = chip.inner_text()
        hover_fresh(page, chip)
        page.wait_for_selector(".previewpop.is-open", timeout=4000)

        card = page.locator(".previewpop")
        box = card.bounding_box()
        check(f"{name}/{mode_id}: first-row card is not clipped",
              box["x"] >= 0 and box["y"] >= 0
              and box["x"] + box["width"] <= view["width"]
              and box["y"] + box["height"] <= view["height"], str(box))
        check(f"{name}/{mode_id}: card clears the top nav", box["y"] >= nav_bottom,
              f'y={box["y"]} nav={nav_bottom}')
        check(f"{name}/{mode_id}: card shows the chip it belongs to",
              page.get_attribute(".previewpop img", "alt") == label,
              page.get_attribute(".previewpop img", "alt"))
        if "is-below" in (card.get_attribute("class") or ""):
            flipped += 1
        shoot_card(page, f"preview-clip-{mode_id}.png", f"{name}/{mode_id}")

    # force the no-room-above case: the first mode row sits too close to the
    # nav for the card to fit above it
    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(60)
    hover_fresh(page, page.locator('.mode[data-mode="face-lock"]'))
    page.wait_for_selector(".previewpop.is-open", timeout=4000)
    flipped += 1 if "is-below" in (page.locator(".previewpop").get_attribute("class") or "") else 0
    check(f"{name}: a control with no room above flips below", flipped > 0, f"{flipped} flips")

    # one absent file degrades on its own while its neighbours keep working
    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(60)
    page.click('.mode[data-mode="detail"]')
    page.wait_for_timeout(60)
    hover_fresh(page, page.locator('[data-preview="detail--backdrop--moody.webp"]'))
    page.wait_for_timeout(400)
    check(f"{name}: one 404 among working pictures opens no card",
          page.locator(".previewpop.is-open").count() == 0)

    # mode buttons carry pictures too
    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(60)
    page.click('.mode[data-mode="scene"]')
    page.wait_for_timeout(60)
    hover_fresh(page, page.locator('.mode[data-preview="scene.webp"]'))
    page.wait_for_selector(".previewpop.is-open", timeout=4000)
    check(f"{name}: mode card is named after the mode",
          page.get_attribute(".previewpop img", "alt") == "Scene",
          page.get_attribute(".previewpop img", "alt"))
    shoot_card(page, "preview-popover-en.png", f"{name}/english card")

    golden = '[data-preview="scene--lighting--golden.webp"]'
    hover_fresh(page, page.locator(golden))
    page.wait_for_selector(".previewpop.is-open", timeout=4000)
    alt_en = page.get_attribute(".previewpop img", "alt")
    check(f"{name}: card alt is the chip's own label", alt_en == page.inner_text(golden), alt_en)

    # the language toggle rebuilds every control: one card node, alt follows
    page.click("#langBtn")
    page.wait_for_timeout(150)
    check(f"{name}: switching language keeps exactly one card node",
          page.locator(".previewpop").count() == 1, str(page.locator(".previewpop").count()))
    hover_fresh(page, page.locator(golden))
    page.wait_for_selector(".previewpop.is-open", timeout=4000)
    alt_yue = page.get_attribute(".previewpop img", "alt")
    check(f"{name}: card alt is the translated label", alt_yue == page.inner_text(golden), alt_yue)
    check(f"{name}: card alt actually changed with the language", alt_yue != alt_en, f"{alt_en} / {alt_yue}")
    shoot_card(page, "preview-popover-yue.png", f"{name}/translated card")

    page.click("#langBtn")
    page.wait_for_timeout(150)
    check(f"{name}: switching back keeps exactly one card node",
          page.locator(".previewpop").count() == 1, str(page.locator(".previewpop").count()))
    hover_fresh(page, page.locator(golden))
    page.wait_for_selector(".previewpop.is-open", timeout=4000)
    check(f"{name}: card alt is English again",
          page.get_attribute(".previewpop img", "alt") == alt_en,
          page.get_attribute(".previewpop img", "alt"))

    page.mouse.move(760, 120)
    page.wait_for_timeout(60)
    check(f"{name}: pointing away closes the card", page.locator(".previewpop.is-open").count() == 0)


def check_phone_previews(browser, url, presets):
    """A coarse pointer cannot hover, so the selected option shows inline."""
    name = "touch"
    context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    problems = []
    try:
        bare = context.new_page()
        bare.on("pageerror", lambda error: problems.append(f"pageerror: {error}"))
        bare.route(PREVIEW_GLOB, serve_missing)  # real files may exist on disk now
        bare.goto(url, wait_until="domcontentloaded")
        bare.wait_for_selector('body[data-ready="true"]', timeout=10000)
        settle_fonts(bare)
        check(f"{name}: emulation reports a coarse pointer",
              bare.evaluate("() => matchMedia('(pointer: coarse)').matches"))
        bare.wait_for_timeout(500)
        check(f"{name}: missing pictures render no thumbnail", bare.locator(".previewthumb").count() == 0)
        check(f"{name}: missing pictures leave no image node", bare.locator("#controlGroups img").count() == 0)
        bare.close()

        page = context.new_page()
        page.on("pageerror", lambda error: problems.append(f"pageerror: {error}"))
        page.route(PREVIEW_GLOB, serve_stub)
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_selector('body[data-ready="true"]', timeout=10000)
        page.fill("#subject", SUBJECT)
        settle_fonts(page)

        for mode in presets["modes"]:
            mode_id = mode["id"]
            controls = mode.get("controls", {})
            groups = len([c for c in controls if c not in NO_PREVIEW_CONTROLS])
            select_mode(page, mode)
            page.wait_for_function(
                f"() => document.querySelectorAll('#controlGroups .previewthumb').length === {groups}",
                timeout=5000)
            check(f"{name}/{mode_id}: one thumbnail per control group with a picture",
                  page.locator("#controlGroups .previewthumb").count() == groups)
            check(f"{name}/{mode_id}: the mode list stays picture-free",
                  page.locator("#modeList .previewthumb").count() == 0)
            if not groups:
                continue
            check(f"{name}/{mode_id}: thumbnail is visible",
                  page.locator(".previewthumb").first.is_visible())
            selected = page.locator("#controlGroups .presetrow").first.locator('button[aria-checked="true"]')
            check(f"{name}/{mode_id}: thumbnail shows the selected option",
                  page.locator(".previewthumb").first.get_attribute("alt") == selected.inner_text(),
                  page.locator(".previewthumb").first.get_attribute("alt"))
            check(f"{name}/{mode_id}: thumbnail sits under its chip row",
                  page.locator("#controlGroups .field").first.locator(".previewthumb").count() == 1)

        page.click('.segment[data-media="image"]')
        page.wait_for_timeout(60)
        page.click('.mode[data-mode="scene"]')
        page.wait_for_function(
            "() => document.querySelectorAll('#controlGroups .previewthumb').length === 2", timeout=5000)
        page.click('[data-preview="scene--lighting--golden.webp"]')
        page.wait_for_function(
            "() => { const t = document.querySelector('.previewthumb'); return t && t.src.includes('golden'); }",
            timeout=5000)
        check(f"{name}: picking an option swaps the thumbnail",
              "scene--lighting--golden.webp" in page.locator(".previewthumb").first.get_attribute("src"))

        # last thing this page does: a full-page shot drops Chromium's touch
        # emulation for good, and every check above needs a coarse pointer
        page.screenshot(path=str(SHOTS / "preview-thumb-phone.png"), full_page=True)
        page.close()
    finally:
        context.close()

    check(f"{name}: no page errors", not problems, "; ".join(problems))


def check_media_toggle(page, presets, name):
    """The toggle is the target picker: it filters the list and remembers where
    you were, while the two text boxes belong to the whole session."""
    image_modes = [m["id"] for m in presets["modes"] if m["mediaType"] == "image"]
    video_modes = [m["id"] for m in presets["modes"] if m["mediaType"] == "video"]

    page.fill("#subject", SUBJECT)
    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(60)
    listed = page.locator("#modeList .mode").evaluate_all("nodes => nodes.map(n => n.dataset.mode)")
    check(f"{name}: image lists only image modes", listed == image_modes, str(listed))
    check(f"{name}: the action box is hidden on image", page.locator("#actionField").is_hidden())

    page.click('.mode[data-mode="detail"]')
    page.wait_for_timeout(60)

    page.click('.segment[data-media="video"]')
    page.wait_for_timeout(60)
    listed = page.locator("#modeList .mode").evaluate_all("nodes => nodes.map(n => n.dataset.mode)")
    check(f"{name}: video lists only video modes", listed == video_modes, str(listed))
    check(f"{name}: video opens on Product Ad",
          page.get_attribute('.mode[data-mode="video-product-ad"]', "aria-checked") == "true")
    check(f"{name}: the action box appears on video", page.locator("#actionField").is_visible())
    check(f"{name}: the subject survived the switch", page.input_value("#subject") == SUBJECT)
    check(f"{name}: video modes carry the Seedance badge",
          page.locator('.mode[data-mode="video-ugc"] .badge').count() == 1)
    check(f"{name}: image modes carry no badge",
          page.locator("#modeList .badge").count() == len(video_modes))

    page.fill("#action", ACTION)
    page.wait_for_timeout(60)
    page.click('.mode[data-mode="video-narrative"]')
    page.wait_for_timeout(60)

    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(60)
    check(f"{name}: image comes back where you left it",
          page.get_attribute('.mode[data-mode="detail"]', "aria-checked") == "true")

    page.click('.segment[data-media="video"]')
    page.wait_for_timeout(60)
    check(f"{name}: video comes back where you left it",
          page.get_attribute('.mode[data-mode="video-narrative"]', "aria-checked") == "true")
    check(f"{name}: the action survived both switches", page.input_value("#action") == ACTION)


def check_video_blocks(page, mode, name):
    """Eight labelled blocks, in grammar order, assembled live."""
    text = page.inner_text("#promptOut")
    cursor = -1
    ordered = True
    for label in VIDEO_BLOCK_LABELS:
        at = text.find(f"{label}: ", cursor + 1)
        if at <= cursor:
            ordered = False
            break
        cursor = at
    check(f"{name}/{mode['id']}: eight blocks in grammar order", ordered, text[:120])
    check(f"{name}/{mode['id']}: paragraphs match blocks",
          page.locator("#promptOut p").count() == len(VIDEO_BLOCK_LABELS),
          str(page.locator("#promptOut p").count()))
    check(f"{name}/{mode['id']}: the one-shot clause closes Movement",
          "no internal cuts" in text)
    check(f"{name}/{mode['id']}: Sound Bed opens diegetic", "Diegetic only" in text)

    # the action box drives the Movement block
    page.fill("#action", "")
    page.wait_for_timeout(60)
    default_text = page.inner_text("#promptOut")
    check(f"{name}/{mode['id']}: an empty action fires the mode default",
          mode["defaultAction"] in default_text)
    check(f"{name}/{mode['id']}: an empty action still enables copy", page.is_enabled("#copyBtn"))
    page.fill("#action", ACTION)
    page.wait_for_timeout(60)
    typed_text = page.inner_text("#promptOut")
    check(f"{name}/{mode['id']}: a typed action replaces the default",
          mode["defaultAction"] not in typed_text and "turns it toward the lens" in typed_text)


def check_locked_chips(page, mode, name):
    groups = locked_groups(mode)
    check(f"{name}/{mode['id']}: one why line per locked group",
          page.locator("#controlGroups .whynote").count() == len(groups),
          str(page.locator("#controlGroups .whynote").count()))
    for control_id in groups:
        group = mode["controls"][control_id]
        check(f"{name}/{mode['id']}/{control_id}: the why line is shown",
              group["why"] in page.inner_text("#controlGroups"))
    check(f"{name}/{mode['id']}: locked chips cannot be clicked",
          page.locator("#controlGroups .preset.is-locked").count() == len(groups))


def check_refs(page, mode, name):
    refs = mode.get("refs", [])
    boxes = page.locator("#refGroup input[type=checkbox]")
    check(f"{name}/{mode['id']}: one checkbox per reference", boxes.count() == len(refs),
          str(boxes.count()))
    if not refs:
        check(f"{name}/{mode['id']}: no reference block at all",
              page.locator("#refGroup .field").count() == 0)
        return

    before = page.inner_text("#promptOut")
    check(f"{name}/{mode['id']}: no tag before a box is ticked", "@" not in before)
    check(f"{name}/{mode['id']}: no upload line before a box is ticked",
          page.locator("#refGroup .note").count() == 0)

    for ref in refs:
        page.check(f'#refGroup input[data-ref="{ref["id"]}"]')
        page.wait_for_timeout(60)
        text = page.inner_text("#promptOut")
        check(f"{name}/{mode['id']}: {ref['id']} adds its sentence",
              ref["segments"][0]["text"].strip() in text)
        check(f"{name}/{mode['id']}: {ref['id']} names its file",
              ref["filename"] in page.inner_text("#refGroup .note"))

    for ref in refs:
        page.uncheck(f'#refGroup input[data-ref="{ref["id"]}"]')
        page.wait_for_timeout(60)
    check(f"{name}/{mode['id']}: unticking removes every tag",
          "@" not in page.inner_text("#promptOut"))
    check(f"{name}/{mode['id']}: unticking removes the upload line",
          page.locator("#refGroup .note").count() == 0)


def check_register(page, mode, name):
    if not mode.get("registers"):
        check(f"{name}/{mode['id']}: no register toggle", page.locator("#registerToggle").count() == 0)
        return
    check(f"{name}/{mode['id']}: register toggle rendered", page.locator("#registerToggle").count() == 1)
    check(f"{name}/{mode['id']}: register toggle starts off", not page.is_checked("#registerToggle"))
    cinema = page.inner_text("#promptOut")
    page.check("#registerToggle")
    page.wait_for_timeout(60)
    phone = page.inner_text("#promptOut")
    check(f"{name}/{mode['id']}: the phone register changes the prompt", phone != cinema)
    check(f"{name}/{mode['id']}: the phone register says so",
          "smartphone main-lens register" in phone)
    page.uncheck("#registerToggle")
    page.wait_for_timeout(60)
    check(f"{name}/{mode['id']}: toggling back restores the same bytes",
          page.inner_text("#promptOut") == cinema)


def check_enhanced_invalidation(page, presets, name):
    """A changed control makes an enhanced panel a lie, so it goes away."""
    video = next(m for m in presets["modes"] if m["id"] == "video-product-ad")
    select_mode(page, video)
    page.fill("#subject", SUBJECT)
    page.fill("#action", ACTION)
    page.wait_for_timeout(60)

    body = ('{"choices":[{"message":{"content":"{\\"scene\\":\\"A quiet counter.\\",'
            '\\"subjectLock\\":\\"The bottle sits square to camera.\\",'
            '\\"movement\\":\\"It turns a slow quarter rotation.\\",'
            '\\"worldPlate\\":\\"A minimal set in soft window light.\\"}"}}]}')

    def handler(route):
        route.fulfill(status=200, content_type="application/json", body=body)

    page.route(ENHANCE_URL, handler)
    if not page.locator("#enhanceBox[open]").count():
        page.click("#enhanceBox summary")
    page.fill("#apiKey", "sk-or-v1-fake-key")
    deterministic = page.inner_text("#promptOut")
    page.click("#enhanceBtn")
    page.wait_for_selector("#enhancedPanel:not([hidden])", timeout=5000)
    enhanced = page.inner_text("#enhancedOut")
    check(f"{name}: the video rebuild keeps the client's locked blocks",
          "no internal cuts" in enhanced and "Diegetic only" in enhanced)
    check(f"{name}: the video rebuild keeps all eight labels",
          all(f"{label}: " in enhanced for label in VIDEO_BLOCK_LABELS))
    check(f"{name}: the model's own words are in there", "A quiet counter." in enhanced)
    check(f"{name}: the deterministic prompt is untouched",
          page.inner_text("#promptOut") == deterministic)

    page.locator("#controlGroups .presetrow").first.locator("button").nth(1).click()
    page.wait_for_timeout(80)
    check(f"{name}: a changed chip clears the enhanced panel",
          page.locator("#enhancedPanel").is_hidden())

    page.click("#enhanceBtn")
    page.wait_for_selector("#enhancedPanel:not([hidden])", timeout=5000)
    page.fill("#action", f"{ACTION} slowly")
    page.wait_for_timeout(80)
    check(f"{name}: a changed action clears the enhanced panel",
          page.locator("#enhancedPanel").is_hidden())

    page.click("#enhanceBtn")
    page.wait_for_selector("#enhancedPanel:not([hidden])", timeout=5000)
    page.click('.segment[data-media="image"]')
    page.wait_for_timeout(80)
    check(f"{name}: a media switch clears the enhanced panel",
          page.locator("#enhancedPanel").is_hidden())

    page.unroute(ENHANCE_URL)
    page.click("#clearKeyBtn")


def check_copy(page, name):
    page.click("#copyBtn")
    page.wait_for_timeout(120)
    state = page.inner_text("#copyState")
    check(f"{name}: copy reports back", state != "", state)


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

                check_media_toggle(page, presets, name)

                for mode in presets["modes"]:
                    mode_id = mode["id"]
                    select_mode(page, mode)
                    if mode["mediaType"] == "video":
                        page.fill("#action", ACTION)
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

                    if mode["mediaType"] == "video":
                        check_video_blocks(page, mode, name)
                    check_locked_chips(page, mode, name)
                    check_refs(page, mode, name)
                    check_register(page, mode, name)
                    check_copy(page, f"{name}/{mode_id}")

                    # live assembly: flip the first control and the prompt must move
                    # flip to an option that is not already selected: a video
                    # mode's first group defaults to its middle chip
                    presets_row = page.locator("#controlGroups .presetrow").first
                    unpicked = presets_row.locator('button[aria-checked="false"]:not([disabled])')
                    if unpicked.count():
                        before = page.inner_text("#promptOut")
                        picked_label = presets_row.locator('button[aria-checked="true"]').inner_text()
                        unpicked.first.click()
                        page.wait_for_timeout(60)
                        after = page.inner_text("#promptOut")
                        check(f"{name}/{mode_id}: prompt updates live", before != after)
                        presets_row.locator("button", has_text=picked_label).first.click()
                        page.wait_for_timeout(60)
                        check(f"{name}/{mode_id}: flipping back restores the prompt",
                              page.inner_text("#promptOut") == before)

                    page.screenshot(path=str(SHOTS / f"{name}-{mode_id}.png"), full_page=(name == "phone"))

                check_enhance_wiring(page, name)
                check_enhanced_invalidation(page, presets, name)
                if name == "desktop":
                    check_previews(page, presets, name)

                # empty it again and copy locks back up
                page.fill("#subject", "   ")
                page.wait_for_timeout(60)
                check(f"{name}: copy re-disabled on whitespace subject", page.is_disabled("#copyBtn"))

                fatal = [p for p in problems if "Content Security Policy" in p or "pageerror" in p]
                check(f"{name}: no CSP violations or page errors", not fatal, "; ".join(fatal))
                if problems:
                    print(f"  console noise ({name}): {problems}")

                page.close()

            check_phone_previews(browser, url, presets)
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
