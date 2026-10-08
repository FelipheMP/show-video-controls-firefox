# Store listings

Everything needed to publish and maintain the extension's store pages. None of these files
are shipped inside the extension packages.

| File | Purpose |
| --- | --- |
| [description.en.md](description.en.md) | Long description, English. Plain text, shared by all three stores. |
| [description.pt-BR.md](description.pt-BR.md) | Long description, Brazilian Portuguese. |
| [chrome-web-store.md](chrome-web-store.md) | Chrome Web Store fields, permission justifications, review test steps (not in use). |
| [edge-addons.md](edge-addons.md) | Microsoft Edge Add-ons fields, search terms, certification notes. |
| [firefox-add-ons.md](firefox-add-ons.md) | Firefox Add-ons fields, version notes, reviewer notes. |
| [../PRIVACY.md](../PRIVACY.md) | Privacy policy linked from every store (English and Brazilian Portuguese). |

**Where the extension is published:**

| Store | Status | Address |
| --- | --- | --- |
| Firefox Add-ons | Published, updated by the release workflow | https://addons.mozilla.org/firefox/addon/show-video-controls-firefox/ |
| Microsoft Edge Add-ons | Published (first version approved), updated by the release workflow | https://microsoftedge.microsoft.com/addons/detail/konenpojbbpaghcelhkempoeamohjgjd |
| Chrome Web Store | Not planned (one-time developer fee). The texts in [chrome-web-store.md](chrome-web-store.md) are kept ready in case that changes. | none |

The extension name and the one-line summary live in [`_locales/`](../_locales), not here,
so the extension page and the store always agree. Edit them there.

## Keeping the texts accurate

The descriptions make claims about behavior (no network requests, no background process,
changes apply without a reload, the list of excluded sites). When the code or
`manifest.json` changes, check those claims and update **both languages**.

## Release flow

1. Raise `version` in [`manifest.json`](../manifest.json) and push to `master`.
   The version must be higher than the one already published on **both** stores
   (the stores reject an equal or lower version).
2. The [release workflow](../.github/workflows/release.yml) then, for that version:
   lints and builds the Firefox package and submits it to Firefox Add-ons; builds the
   Chromium package; creates the tag and the GitHub release with both zips
   (`auto-on-video-controls-firefox-<version>.zip` and `auto-on-video-controls-chromium-<version>.zip`);
   and, in a second job, uploads the Chromium zip to Microsoft Edge Add-ons and submits it for review.
   Both stores review the update before it goes live.
3. A version that already has a tag is skipped, so re-running the workflow is safe. If only the
   Edge job failed (for example an expired API key), fix the cause and use **Re-run failed jobs**:
   the Chromium package is kept as a workflow artifact for 7 days. After that, upload the zip from
   the GitHub release by hand in Partner Center.

Store texts and images are not part of the release: edit them in each store's dashboard,
using the values in this folder.

To build the Chromium package locally: `node scripts/build-chromium.mjs`, then zip the
contents of `dist/chromium/`.

### Setting up the Edge publishing job (once)

The job needs the Edge Add-ons API enabled for the extension (Partner Center, Microsoft Edge,
**Publish API**, which shows the Client ID and creates an API key; the key expires, so note its
expiry date). Then, in the GitHub repository:

| Where | Name | Value |
| --- | --- | --- |
| Settings, Environments, **Edge Add-ons APIs**, secret | `EDGE_CLIENT_ID` | Client ID from the Publish API page |
| Same environment, secret | `EDGE_API_KEY` | API key from the Publish API page |
| Settings, Secrets and variables, Actions, **Variables** | `EDGE_PRODUCT_ID` | Product ID (a GUID) from the extension's overview page in Partner Center |

Until `EDGE_PRODUCT_ID` exists the Edge job is skipped. Firefox uses the secrets `AMO_API_KEY` and
`AMO_API_SECRET` in the **Firefox Add-ons APIs** environment. The upload script,
[`scripts/publish-edge.mjs`](../scripts/publish-edge.mjs), can be checked locally without sending anything:
`EDGE_CLIENT_ID=x EDGE_API_KEY=x EDGE_PRODUCT_ID=<guid> node scripts/publish-edge.mjs package.zip --dry-run`.

## Rate link

The popup's "Rate extension" link points to Firefox Add-ons in the Firefox package. The
Chromium package points it to the Edge Add-ons page: `CHROMIUM_RATE_URL` in
[`scripts/build-chromium.mjs`](../scripts/build-chromium.mjs).

## Naming and policy notes

- The name is "Auto-On Video Controls" in every browser (set in [`_locales/`](../_locales)), chosen because
  Edge policy 1.1.2 rejects names or icons similar to other extensions (an earlier version was rejected
  for that). Keep the name and the icon distinct from the original extension's.
- The repository is named `auto-on-video-controls` (it was `show-video-controls-firefox`), so listing links
  do not reference another browser. Old repository addresses redirect on GitHub. The Firefox Add-ons
  address still uses its original slug, which can only be changed on that site.
- Confirm the original *Show Video Controls by Default* extension's license (still open).
- If the extension is ever published on the Chrome Web Store, a one-time developer fee applies.
- Confirm the image sizes and field limits below in each dashboard, since stores change them.

## Images

The images are not generated by the build. Capture them from the popup and a real page with a video.

| Image | Chrome Web Store | Edge Add-ons |
| --- | --- | --- |
| Icon | 128 x 128 (in the package) | 300 x 300 logo, uploaded separately ([`assets/logo-300.png`](assets/logo-300.png)) |
| Screenshots | 1280 x 800 or 640 x 400, at least 1, up to 5 | 1280 x 800 or 640 x 480, up to 10 |
| Small promo tile | 440 x 280 | 440 x 280 (optional) |
| Marquee promo tile | 1400 x 560 (optional) | 1400 x 560 (optional) |

The icon is an original design. Its source is [`assets/icon.svg`](assets/icon.svg); the PNGs in
[`icons/`](../icons) and [`assets/logo-300.png`](assets/logo-300.png) are rendered from it at 16, 48, 128 and 300 px.

Ready-made screenshots (1280 x 800, same for Edge and Firefox) are in [`screenshots/`](screenshots):
`store-en-1/2.png` (English) and `store-pt-BR-1/2.png` (Brazilian Portuguese), light and dark theme.
They are captures of the real popup, including the "Rate extension" link, placed on a captioned canvas.
`store-video-*.png` (1280 x 800) and `store-640x480-video-*.png` show a page with a video, without and with the extension
(a short original clip, no third-party content). `store-640x480-*.png` are the popup ones in 640 x 480. Promo tiles are in [`promo/`](promo): `small-440x280-*.png`
and `marquee-1400x560-*.png`, English and Brazilian Portuguese. Retake them whenever the popup changes.

Suggested screenshots, in order: the popup in the light theme, the popup in the dark theme,
and a page with a video showing the native controls. [`docs/images`](../docs/images) already
holds the two popup screenshots used by the main README. Captions for them are in
[chrome-web-store.md](chrome-web-store.md#screenshot-captions-optional). Use only
videos you have the right to show, and avoid brand logos of the sites excluded by default.

## Field limits

| Field | Limit |
| --- | --- |
| Extension name (Chrome, Edge) | 75 characters |
| Summary / manifest description (Chrome, Edge) | 132 characters |
| Summary (Firefox Add-ons) | 250 characters |
| Description (Edge Add-ons) | at least 250 characters |
