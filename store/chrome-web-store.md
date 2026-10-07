# Chrome Web Store listing

Package: build with `node scripts/build-chromium.mjs`, then zip the **contents** of
`dist/chromium/` (the CI also attaches this zip to every GitHub release).
The same package is used for Edge. See [edge-addons.md](edge-addons.md).

The listing is edited in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
Fields marked *(from manifest)* are filled in automatically from `_locales/`.

## Store listing tab

| Field | Value |
| --- | --- |
| Default language | English |
| Additional language | Portuguese (Brazil) |
| Category | Productivity |
| Homepage URL | https://github.com/FelipheMP/show-video-controls-firefox |
| Support URL | https://github.com/FelipheMP/show-video-controls-firefox/issues |

### English

**Name** *(from manifest)*: Always Show Video Controls

**Summary** *(from manifest, 132 characters maximum)*:
Automatically turns on the browser's native controls for HTML5 videos, so you never right-click "Show Controls" again.

**Description**: paste [description.en.md](description.en.md), then add this line at the end:

```
Available for desktop versions of Chrome.
```

### Português (Brasil)

**Nome** *(do manifest)*: Sempre Mostrar Controles de Vídeo

**Resumo** *(do manifest, máximo de 132 caracteres)*:
Ativa automaticamente os controles nativos do navegador em vídeos HTML5, sem precisar clicar em "Mostrar controles" toda vez.

**Descrição**: cole o conteúdo de [description.pt-BR.md](description.pt-BR.md) e acrescente esta linha no final:

```
Disponível para as versões de computador do Chrome.
```

### Screenshot captions (optional)

| Screenshot | English | Português (Brasil) |
| --- | --- | --- |
| Popup, light theme | Choose where controls appear, with a separate list for each mode. | Escolha onde os controles aparecem, com uma lista separada para cada modo. |
| Popup, dark theme | Light, dark or system theme, in English or Brazilian Portuguese. | Tema claro, escuro ou do sistema, em inglês ou português do Brasil. |
| A page with a video | Native controls turned on automatically, with no right-click. | Controles nativos ligados automaticamente, sem clicar com o botão direito. |

## Privacy tab

The text fields in this tab are reviewed by Google staff, so they are in English only.

**Single purpose**

> Automatically turns on the browser's built-in playback controls for HTML5 video elements on the websites the user allows.

**Permission justifications**

| Permission | Justification |
| --- | --- |
| `storage` | Saves the user's choices locally: the mode (all sites except a list, or only a list), the two site lists, the interface language and the theme. Nothing is synced or sent anywhere. |
| `activeTab` | When the user opens the popup, reads the address of the current tab only to prefill the "Site domain" field, so a site can be added to the list in one click. It is not used in the background. |
| Content script on all sites (`<all_urls>` match in `content_scripts`) | The extension has to find `<video>` elements on whichever page the user visits in order to turn on their controls. The script only reads the page's host name, the user's saved site lists and `<video>` elements. It collects, stores and transmits no page content. It is already inactive on the sites the user excludes and on the video services excluded in the manifest. |

**Remote code**: No. All code is in the package, and there is no `eval` or remotely hosted script.

**Data usage**: select none of the data types. Check all three certifications (no sale of data, no use unrelated to the single purpose, no use for creditworthiness or lending).

**Privacy policy URL**: https://github.com/FelipheMP/show-video-controls-firefox/blob/master/PRIVACY.md

## Test instructions (Distribution tab)

No account or login is needed. To see the extension work:

1. Open https://example.com and the browser's developer console.
2. Paste the line below. It adds a video **without** controls. The extension turns them on right away.

```js
document.body.append(Object.assign(document.createElement('video'), { src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', width: 480 }))
```

3. Click the toolbar icon. The domain `example.com` is already filled in. Select **Add site**. The controls disappear from the open page, because the site is now excluded. Select **Remove** and they come back.

(If the browser blocks pasting, type `allow pasting` in the console first.)

## Images

See [README.md](README.md#images) for sizes and what to capture.
