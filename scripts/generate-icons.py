#!/usr/bin/env python3
"""Generate every production ANYA icon from one four-plate geometry."""

from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
STORE = ROOT / "store" / "assets"

GOLD = "#F2C718"
DARK = "#141D29"

# Four equal machined plates moving from upper-left to lower-right. The generous
# gaps and simple chamfers are sized to remain separate in a 16 px raster.
PLATES = (
    ((16.0, 24.0), (21.3, 18.7), (53.3, 18.7), (58.7, 24.0),
     (58.7, 32.0), (53.3, 37.3), (21.3, 37.3), (16.0, 32.0)),
    ((33.8, 48.0), (39.1, 42.7), (71.1, 42.7), (76.4, 48.0),
     (76.4, 56.0), (71.1, 61.3), (39.1, 61.3), (33.8, 56.0)),
    ((51.6, 72.0), (56.9, 66.7), (88.9, 66.7), (94.2, 72.0),
     (94.2, 80.0), (88.9, 85.3), (56.9, 85.3), (51.6, 80.0)),
    ((69.3, 96.0), (74.7, 90.7), (106.7, 90.7), (112.0, 96.0),
     (112.0, 104.0), (106.7, 109.3), (74.7, 109.3), (69.3, 104.0)),
)


def path_data() -> str:
    def number(value: float) -> str:
        return str(int(value)) if value.is_integer() else f"{value:.1f}"

    subpaths = []
    for plate in PLATES:
        points = " ".join(f"{number(x)},{number(y)}" for x, y in plate)
        subpaths.append(f"M{points}Z")
    return "".join(subpaths)


def mark_svg() -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <path fill="{DARK}" d="{path_data()}"/>
</svg>
'''


def small_svg() -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="{GOLD}"/>
  <path fill="{DARK}" d="{path_data()}"/>
</svg>
'''


def large_svg() -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#FFDA3A"/>
      <stop offset="1" stop-color="#E5B40A"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#6B4E00" flood-opacity=".38"/>
    </filter>
  </defs>
  <rect x="16" y="16" width="96" height="96" rx="21" fill="url(#gold)"/>
  <path fill="{DARK}" filter="url(#shadow)" transform="translate(16 16) scale(.75)" d="{path_data()}"/>
</svg>
'''


def notification_svg() -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="25" fill="{DARK}"/>
  <rect x="8" y="8" width="112" height="112" rx="21" fill="{GOLD}"/>
  <path fill="{DARK}" transform="translate(11.5 11.5) scale(.82)" d="{path_data()}"/>
</svg>
'''


def rasterize(source: Path, destination: Path, size: int) -> None:
    command = shutil.which("rsvg-convert")
    if not command:
        raise SystemExit("rsvg-convert is required to generate PNG icons")
    subprocess.run(
        [command, "-w", str(size), "-h", str(size), str(source), "-o", str(destination)],
        check=True,
    )


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)

    mark = ICONS / "mark.svg"
    large = ICONS / "icon.svg"
    small = ICONS / "icon-16.svg"
    notification = ICONS / "notification.svg"
    mark.write_text(mark_svg())
    large.write_text(large_svg())
    small.write_text(small_svg())
    notification.write_text(notification_svg())

    rasterize(small, ICONS / "icon-16.png", 16)
    rasterize(small, ICONS / "icon-32.png", 32)
    rasterize(large, ICONS / "icon-48.png", 48)
    rasterize(large, ICONS / "icon-128.png", 128)
    rasterize(notification, ICONS / "notification.png", 128)
    shutil.copyfile(ICONS / "icon-128.png", STORE / "icon-128.png")

    print("Generated icons at 16, 32, 48, and 128 px plus notification artwork")


if __name__ == "__main__":
    main()
