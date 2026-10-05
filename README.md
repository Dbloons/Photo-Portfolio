# Daren Bryan Photography

A responsive, dependency-free photography portfolio. Serve the project folder over HTTP—for example, with VS Code Live Server or `python -m http.server 8000`—and open the local address in a browser. ES modules and the browser photo library require HTTP; opening `index.html` directly as a `file://` URL will not enable all features.

## Publish free with GitHub Pages

This is a static website and requires no paid hosting, build step, domain, or JavaScript packages.

1. Create a **public** GitHub repository (required for GitHub Pages on GitHub Free) and push these website files to its `main` or `master` branch. Keep `index.html`, `photos.js`, `main.js`, `styles.css`, and `images/` at the repository root.
2. In the repository, open **Settings → Pages**. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions** and let **Deploy portfolio to GitHub Pages** finish. You can also run it from **Run workflow**.
4. Open the site URL shown in the deployment job. It will usually be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

The workflow in `.github/workflows/pages.yml` publishes the site on each push to `main` or `master`. If your default branch has a different name, add it to the workflow's `push.branches` list. Future changes go online after you push them and the Pages deployment succeeds.

Before deployment, the workflow runs `scripts/validate-site.py` to check that the photo catalog, image files, and local links are complete and consistent.

## Photo collections

The gallery includes the images from these folders:

- `Food`
- `Graduation 2025`
- `nature`
- `Photography class`
- `Randoms`
- `Travel`

Their website copies are organized under `images/`. The original folders are not modified. The gallery shows 24 photographs at a time; **Load more photos** reveals more, and the collection filters narrow the selection.

## Add photos to the published portfolio

1. Copy an optimized image into the matching collection folder under `images/`.
2. Add a record to the `photos` array in `photos.js`:

```js
{
  id: "travel-evening-01",
  title: "Evening light",
  category: "travel",
  location: "Travel",
  image: "./images/Travel/evening-light.jpg",
  alt: "Warm evening light falls across the landscape",
  shape: "landscape",
},
```

Use a unique `id`, one of the existing collection categories (`food`, `graduation-2025`, `nature`, `photography-class`, `randoms`, or `travel`), and concise descriptive alt text. Use `tall`, `square`, or `landscape` for `shape`.

Photo management is intentionally limited to the repository. Commit and push new image files and their catalog entries to publish them; the public site has no visitor photo-upload feature.

## Personal details

The introduction, biography, and portfolio sections are in `index.html`. Update the copy there if Daren’s biography or preferred contact details change.
