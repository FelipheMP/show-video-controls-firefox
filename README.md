# Show Video Controls for Firefox

**Stop hunting for video controls. Start watching your way.**

A video starts playing, but its playback controls are missing. Show Video Controls
for Firefox automatically enables native controls on supported HTML videos so you
can pause, seek, adjust the volume, or enter fullscreen when the player and platform
support it.

Especially useful for WebM clips and sites such as 9GAG. No repeated right-clicks
or “Show controls” steps for each video.

**[Get it on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/show-video-controls-firefox/)**
· [Report a bug](https://github.com/FelipheMP/show-video-controls-firefox/issues/new?template=bug_report.md)
· [Support the project](https://ko-fi.com/coreboolean)

## Built for the way you browse

- **Firefox on desktop and Android.** Manage your settings with a compact interface
  and comfortable touch targets.
- **Controls that appear automatically.** The add-on watches for dynamically
  added videos as you browse supported pages.
- **Your sites, your rules.** Run on supported sites by default, or enable controls
  only for the sites you choose. Each mode keeps its own list.
- **An appearance that fits.** Choose Light, Dark, or System and keep that preference
  between sessions.
- **English or Brazilian Portuguese.** Pick **🇺🇸 en-US** or **🇧🇷 pt-BR** from the
  language menu. Switching languages preserves the domain you are typing.
- **Settings stored locally.** Your site lists, language, and theme stay in Firefox's
  local add-on storage.

## A cleaner way to manage your controls

<p>
  <img src="docs/images/popup-light.png" alt="Light theme: language and theme selectors, site rules, and support and review links" width="320" />
  <img src="docs/images/popup-dark.png" alt="Dark theme showing the same settings and contribution options" width="320" />
</p>

## Get started

1. Install the  from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/show-video-controls-firefox/).
2. Visit a page with a supported HTML video. Native controls are enabled automatically
   unless the site is excluded.
3. Open **Show Video Controls** from Firefox's s menu to customize where it runs.

The current source requires **Firefox 140 or later on desktop** and **Firefox 142
or later on Android**, as declared in [manifest.json](manifest.json).

### Choose where it runs

| Mode | What happens | What your list contains |
| --- | --- | --- |
| **On all sites** — default | Enables controls on supported sites, except those you list. | Excluded sites |
| **Only on selected sites** | Enables controls only on supported sites you list. | Allowed sites |

Enter a domain such as `example.com`, without `https://` or a path, and select
**Add site**. When available, the current page's domain is filled in for you.
Choose **Remove** to delete an entry.

- A base domain such as `example.com` also matches its subdomains.
- Switching modes preserves both lists.
- An empty allowed-sites list enables controls nowhere in **Only on selected sites** mode.
- Reload affected pages after changing site rules or switching modes.

### Make it yours

Use **Language** to choose **en-US** or **pt-BR**, and **Theme** to choose **Light**,
**Dark**, or **System**. English and the system theme are the defaults. Both
preferences are saved automatically.

The language menu supports touch, arrow keys, Enter, and Escape. Click outside the
menu or move focus away to dismiss it.

## Compatibility and limitations

This add-on enables the browser's native controls on HTML `<video>` elements.
It does not replace a website's player or add a new playback engine.

- **Custom players may not work.** Sites can use their own overlays or player logic
  that hides, replaces, or interferes with native controls.
- **Some sites are excluded by design.** The manifest excludes several major video
  services, including YouTube, Netflix, Vimeo, and Twitch. Adding one of those sites
  to your allowed list does not override the manifest exclusions.
- **Protected Firefox pages cannot be modified.** The site-list form also rejects
  local domains and IP addresses.
- **Controls vary by platform and media.** Available actions depend on Firefox,
  the video, and the surrounding player.

See [manifest.json](manifest.json) for the complete URL exclusions. If controls
are missing on another site, [report the issue](https://github.com/FelipheMP/show-video-controls-firefox/issues/new?template=bug_report.md)
with the page URL, Firefox version, platform, and steps to reproduce it.

## Permissions and privacy

| Permission | Why it is used |
| --- | --- |
| Website access (`<all_urls>` and `*://*/*`) | Finds supported video elements and enables controls on pages where the add-on is allowed to run. |
| `activeTab` | Reads the active page's domain to prefill the site-list form. |
| `storage` | Saves site rules, language, and appearance locally. |

The add-on code does not send browsing activity or settings to an analytics
service. The manifest declares that no data collection is required. The optional
support and review links open Ko-fi and Firefox Add-ons in a new tab.

## Help this project grow

If this add-on makes your browsing easier, there are two ways to help:

- **[Support the project on Ko-fi](https://ko-fi.com/coreboolean)** to contribute to
  its continued development.
- **[Rate it on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/show-video-controls-firefox/)**
  and share your experience with other Firefox users.

Bug reports and feature ideas are welcome too:
[report a bug](https://github.com/FelipheMP/show-video-controls-firefox/issues/new?template=bug_report.md)
or [suggest an improvement](https://github.com/FelipheMP/show-video-controls-firefox/issues/new?template=feature_request.md).

## Develop and contribute

The add-on uses plain HTML, CSS, and JavaScript. **No build step or UI framework
is required.**

### Run the source locally

1. Clone this repository and open Firefox on desktop.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on…** and choose this repository's `manifest.json`.
4. Open the add-on's popup and visit a supported page to try it.

Temporary installations are removed when Firefox restarts. For device testing,
follow Mozilla's [Firefox for Android add-on development guide](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/).

### Find your way around

| File | Responsibility |
| --- | --- |
| [manifest.json](manifest.json) | Firefox requirements, permissions, and script registration. |
| [showvideocontrolsbydefault.js](showvideocontrolsbydefault.js) | Video controls, site matching, and site-specific overlay handling. |
| [popup.html](popup.html) | Settings layout, accessible controls, and contribution links. |
| [css/styles.css](css/styles.css) | Responsive layout and light/dark theme tokens. |
| [popup.js](popup.js) | Popup interaction, domain validation, and local storage. |
| [popup-i18n.js](popup-i18n.js) | English and Brazilian Portuguese interface text. |

Keep changes readable and commented. Add matching translation keys to both
language dictionaries, and preserve the existing `mode`, `excludedDomains`, and
`includedDomains` storage keys. The `language` and `theme` keys hold UI preferences.

### Check your changes

- Test in **Firefox desktop and Firefox for Android**. A Chromium-only check is not
  a substitute for either target.
- Check both languages and all three themes, including keyboard navigation and
  narrow screens with the on-screen keyboard open.
- Add and remove sites, switch modes, and reopen the popup to verify persistence.
- Verify controls on a supported page and confirm that excluded sites stay excluded.
- With Mozilla's `web-ext` available, run `web-ext lint` from the repository root.

For an additional code overview,
[explore the project on DeepWiki](https://deepwiki.com/FelipheMP/show-video-controls-firefox).

## Credits and license

This is an **unofficial Firefox adaptation** of *Show Video Controls by Default*,
originally created by **marcintracz.official** for Chrome.

Licensed under the [GNU General Public License v3.0](LICENSE).
