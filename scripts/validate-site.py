import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parent.parent


class LocalAssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.local_assets = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name not in {"href", "src"} or not value:
                continue

            url = urlsplit(value)
            if url.scheme or url.netloc or url.path.startswith("#"):
                continue

            path = unquote(url.path)
            if path:
                self.local_assets.append(path)


def main():
    source = (ROOT / "photos.js").read_text(encoding="utf-8-sig")
    prefix = "export const photos = "
    if not source.startswith(prefix):
        raise SystemExit("photos.js must export its photo catalog as JSON.")

    try:
        photos = json.loads(source[len(prefix):].rsplit(";", 1)[0])
    except json.JSONDecodeError as error:
        raise SystemExit(f"Could not parse photos.js catalog: {error}") from error

    ids = [photo.get("id") for photo in photos]
    if len(ids) != len(set(ids)):
        raise SystemExit("Photo catalog contains duplicate IDs.")

    catalog_paths = set()
    for photo in photos:
        image_path = photo.get("image", "")
        if not image_path.startswith("./images/"):
            raise SystemExit(f"Photo must use a site-relative image path: {image_path}")
        relative_path = unquote(image_path.removeprefix("./"))
        path = (ROOT / relative_path).resolve()
        if not path.is_relative_to(ROOT / "images"):
            raise SystemExit(f"Photo path escapes the images directory: {image_path}")
        if not path.is_file():
            raise SystemExit(f"Catalog image does not exist: {image_path}")
        if relative_path in catalog_paths:
            raise SystemExit(f"Image is registered more than once: {image_path}")
        catalog_paths.add(relative_path)

    html = LocalAssetParser()
    html.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    for asset in html.local_assets:
        if not (ROOT / asset).is_file():
            raise SystemExit(f"HTML asset does not exist: {asset}")

    image_files = {
        path.relative_to(ROOT).as_posix()
        for path in (ROOT / "images").rglob("*")
        if path.is_file()
    }
    if image_files != catalog_paths:
        unlisted = sorted(image_files - catalog_paths)
        missing = sorted(catalog_paths - image_files)
        raise SystemExit(f"Catalog and images/ differ. Unlisted files: {unlisted}; missing files: {missing}")

    print(f"Validated {len(photos)} photos and all local HTML assets.")


if __name__ == "__main__":
    main()
