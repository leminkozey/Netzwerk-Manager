# GitHub Pages

This folder is published as the project's GitHub Pages site (when enabled in
repo settings → Pages → Source: `main` / `/docs`).

## What's here

- `index.html` — redirects to `help/`
- `help/` — a copy of `public/help/`, the embedded help book
- `.nojekyll` — disables Jekyll processing (the help book is plain static HTML)

## Keeping the help book copy in sync

The canonical help book lives in `public/help/`. To refresh the docs copy:

```bash
rsync -a --delete \
  --exclude '.help-book-installed' \
  public/help/ docs/help/
```

Or use the helper script:

```bash
bash docs/sync-help.sh
```

## Running locally

You can preview the docs site without enabling GitHub Pages:

```bash
cd docs && python3 -m http.server 8082
# open http://localhost:8082
```
