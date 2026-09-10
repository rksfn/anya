#!/usr/bin/env python3
"""Render Chrome Web Store screenshots and promo tiles from store/frames."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "store" / "frames"
ASSETS = ROOT / "store" / "assets"

JOBS = [
    ("screenshot-1.html", "screenshot-1.png", (1280, 800)),
    ("screenshot-2.html", "screenshot-2.png", (1280, 800)),
    ("screenshot-3.html", "screenshot-3.png", (1280, 800)),
    ("screenshot-4.html", "screenshot-4.png", (1280, 800)),
    ("promo-small.html", "promo-small.png", (440, 280)),
    ("promo-marquee.html", "promo-marquee.png", (1400, 560)),
]


def chrome_bin() -> str:
    playwright = Path.home() / "Library" / "Caches" / "ms-playwright"
    chromium_apps = sorted(playwright.glob("chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium"))
    for candidate in (
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        str(chromium_apps[-1]) if chromium_apps else "",
        shutil.which("google-chrome"),
        shutil.which("chromium"),
    ):
        if candidate and Path(candidate).exists():
            return candidate
    raise SystemExit("Chrome or Chromium is required to render store assets.")


def assemble_screenshot_1(workdir: Path) -> None:
    card = (FRAMES / "popup-card.html").read_text()
    html = (FRAMES / "screenshot-1.html").read_text().replace("<!--popup-->", card)
    (workdir / "screenshot-1.html").write_text(html)
    shutil.copy(FRAMES / "popup-card.css", workdir / "popup-card.css")


def flatten(src: Path, dest: Path, size: tuple[int, int]) -> None:
    image = Image.open(src).convert("RGBA")
    if image.size != size:
        image = image.resize(size, Image.Resampling.LANCZOS)
    background = Image.new("RGB", size, (255, 255, 255))
    background.paste(image, mask=image.split()[-1])
    background.save(dest, "PNG", optimize=True)


def screenshot(chrome: str, html: Path, png: Path, size: tuple[int, int]) -> None:
    subprocess.run(
        [
            chrome,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=1",
            f"--window-size={size[0]},{size[1]}",
            f"--screenshot={png}",
            html.resolve().as_uri(),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    chrome = chrome_bin()

    with tempfile.TemporaryDirectory() as raw_dir:
        raw = Path(raw_dir)
        work = raw / "frames"
        work.mkdir()
        for name in FRAMES.iterdir():
            if name.is_file():
                shutil.copy(name, work / name.name)
        assemble_screenshot_1(work)
        shutil.copy(ROOT / "icons" / "mark.svg", work / "mark.svg")
        shutil.copy(ROOT / "icons" / "notification.png", work / "notification.png")

        # Keep temporary frame references local to the isolated render directory.
        for frame in work.glob("*.html"):
            html = frame.read_text()
            html = html.replace("../../icons/mark.svg", "mark.svg")
            html = html.replace("../../icons/notification.png", "notification.png")
            frame.write_text(html)

        for html_name, png_name, size in JOBS:
            raw_png = raw / png_name
            screenshot(chrome, work / html_name, raw_png, size)
            flatten(raw_png, ASSETS / png_name, size)
            print(f"wrote {ASSETS / png_name} {size[0]}x{size[1]}")

    icon = Image.open(ROOT / "icons" / "icon-128.png").convert("RGBA")
    icon.save(ASSETS / "icon-128.png", "PNG", optimize=True)
    print(f"wrote {ASSETS / 'icon-128.png'} 128x128")


if __name__ == "__main__":
    main()
