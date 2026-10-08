# Firefox Add-ons (AMO) listing

Use this to update the existing listing at
https://addons.mozilla.org/firefox/addon/show-video-controls-firefox/
(Developer Hub, **Edit Product Page**). Package: `web-ext build` from the repository root.

Name and summary also come from the manifest (`_locales/`), but AMO stores its own
copy of each, so update them in the Developer Hub as well.

## Basic information

| Field | Value |
| --- | --- |
| Categories (Firefox) | Photos, Music & Videos |
| Categories (Android) | Photos, Music & Videos |
| Homepage | https://github.com/FelipheMP/auto-on-video-controls |
| Support site | https://github.com/FelipheMP/auto-on-video-controls/issues |
| License | GNU General Public License v3.0 (GPL-3.0-only) |
| Privacy policy | https://github.com/FelipheMP/auto-on-video-controls/blob/master/PRIVACY.md |
| Tags | `video`, `controls`, `html5`, `webm`, `media`, `player` |
| Contributions (support) | https://github.com/sponsors/FelipheMP |

## English (US)

**Name**: Auto-On Video Controls

**Summary** (250 characters maximum):

```
Automatically turns on the browser's native video controls on HTML5 videos, so you never right-click "Show Controls" again. You choose the sites. Light on resources, private and open source.
```

**Description**: paste [description.en.md](description.en.md), then add this line at the end:

```
Works on Firefox for desktop and for Android.
```

**Version notes** (for the release that ships Manifest V3):

```
Now built on Manifest V3, with no change in behavior. New icon. Also adds localized store information in English and Brazilian Portuguese.
```

## Português (Brasil)

**Nome**: Auto-On Video Controls

**Resumo** (máximo de 250 caracteres):

```
Ativa automaticamente os controles nativos do navegador em vídeos HTML5, sem precisar clicar em "Mostrar controles" toda vez. Você escolhe os sites. Leve, privada e de código aberto.
```

**Descrição**: cole o conteúdo de [description.pt-BR.md](description.pt-BR.md) e acrescente esta linha no final:

```
Funciona no Firefox para computador e para Android.
```

**Notas da versão** (para a versão que traz o Manifest V3):

```
Agora usa o Manifest V3, sem mudança no comportamento. Novo ícone. Também inclui as informações da loja em inglês e português do Brasil.
```

## Notes to reviewer

Written in English because the review team reads it.

> There is no build step, minification or bundling: the submitted package is the plain source in https://github.com/FelipheMP/auto-on-video-controls, so no separate source archive is attached.
>
> The content script (`showvideocontrolsbydefault.js`) is registered for `<all_urls>` and `host_permissions` is `<all_urls>`, because Manifest V3 on Firefox needs the host permission for a content script to run. The script only reads the page's host name, the saved site lists and `<video>` elements, and it turns on the native `controls` attribute. The extension makes no network requests and declares `data_collection_permissions: none`.
>
> To test: open https://example.com and the web console, then paste `document.body.append(Object.assign(document.createElement('video'), { src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', width: 480 }))`. A video without controls is added and the add-on turns them on. Click the toolbar icon, select "Add site" for the prefilled domain, and the controls disappear from the open page; "Remove" brings them back.
