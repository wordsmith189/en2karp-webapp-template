# en2karp-webapp-template

Static, installable (PWA) browser for the `catalog.json` + `metadata.json`
pair produced by the [`en2karp-catalog`](https://github.com/wordsmith189/lars-claude-skills)
skill. Zero build, zero backend — drop in the two JSON files, open
`index.html`, optionally add it to your iOS home screen.

## Quick start

```bash
# Option A — let the catalog skill scaffold it for you (recommended)
claude-code  # then: "scaffold the notes webapp at ~/repos/my-notes"

# Option B — clone manually
git clone https://github.com/wordsmith189/en2karp-webapp-template.git my-notes
cd my-notes
python3 -m http.server 8000
open http://localhost:8000
```

Then refresh data any time with:

```bash
python3 ~/repos/lars-claude-skills/en2karp-catalog/scripts/export_json.py --out ./
```

or ask Claude Code: *"export catalog to webapp"*.

## Install to iOS home screen

1. Serve the site over HTTPS (GitHub Pages works — the workflow in
   `.github/workflows/pages.yml` deploys on push) or use
   `http-server --ssl` locally.
2. Open in Safari on iOS.
3. Share → Add to Home Screen.
4. The service worker caches the shell + last-seen data so it works offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Single-file UI. Search (debounced) + folder/status/tag/sort filters + expandable card list with "Load more" pagination. |
| `manifest.json` | PWA manifest. |
| `sw.js` | Service worker — cache-first for shell, network-first for JSON. |
| `catalog.json` | One object per live note. Replaced by `export_json.py`. |
| `metadata.json` | Folders, tags-with-counts, totals. Replaced by `export_json.py`. |
| `icon-192.png`, `icon-512.png` | Placeholder app icons (192×192 / 512×512). Replace with your own art before publishing. |

## JSON schema

See `en2karp-catalog/scripts/_shared/catalog.py` (functions
`export_catalog_json`, `export_metadata_json`) for the authoritative schema.

`catalog.json` is a flat list; each note has:
`note_id`, `title`, `folder`, `tags[]`, `created_date`, `modified_date`,
`word_count`, `source_url`, `image_count`, `has_ocr`, `wiki_status`.

`metadata.json`:
`generated_at`, `total_notes`, `folders[]`, `tags[{tag, count}]`.

## Customizing

The UI is intentionally minimal (one HTML file, no framework). Edit the
inline `<style>` for colors, the render functions for layout. Keep the
service worker `CACHE_VERSION` bumped whenever you change `index.html` or
`manifest.json`, otherwise cached shells will stick around.

## License

MIT.
