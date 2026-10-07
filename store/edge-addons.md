# Microsoft Edge Add-ons listing

Package: the **same Chromium zip** used for the Chrome Web Store (see
[chrome-web-store.md](chrome-web-store.md)). Uploading is free of charge.
The listing is edited in the [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview).
Name and short description come from the package (`_locales/`), so they match Chrome.

## Properties

| Field | Value |
| --- | --- |
| Category | Productivity |
| Website URL | https://github.com/FelipheMP/show-video-controls-firefox |
| Support contact | https://github.com/FelipheMP/show-video-controls-firefox/issues |
| Privacy policy URL | https://github.com/FelipheMP/show-video-controls-firefox/blob/master/PRIVACY.md |
| Mature content | No |

## Store listings

### English (United States)

**Name** *(from the package)*: Always Show Video Controls

**Description**: paste [description.en.md](description.en.md), then add this line at the end:

```
Available for desktop versions of Microsoft Edge.
```

**Search terms** (up to 7):

```
video controls
show controls
html5 video
video player
webm
media controls
video settings
```

### Português (Brasil)

**Nome** *(do pacote)*: Sempre Mostrar Controles de Vídeo

**Descrição**: cole o conteúdo de [description.pt-BR.md](description.pt-BR.md) e acrescente esta linha no final:

```
Disponível para as versões de computador do Microsoft Edge.
```

**Termos de pesquisa** (até 7):

```
controles de vídeo
mostrar controles
vídeo html5
player de vídeo
webm
controles de mídia
configurações de vídeo
```

## Notes for certification

Written in English because the certification team reads it.

> No account or login is needed. To see the extension work: open https://example.com, open the developer console and paste the line below. It adds a video without controls, and the extension turns them on right away.
>
> `document.body.append(Object.assign(document.createElement('video'), { src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', width: 480 }))`
>
> Then click the toolbar icon: the domain `example.com` is prefilled. Select "Add site" and the controls disappear from the open page, because the site is now excluded. Select "Remove" and they return.
>
> The extension makes no network requests, collects no data and stores only its settings locally. Permissions: `storage` (settings), `activeTab` (prefill the current domain in the popup) and a content script on all sites, needed to find video elements. The source is plain JavaScript with no build step: https://github.com/FelipheMP/show-video-controls-firefox

## Images

See [README.md](README.md#images). Edge requires a 300 x 300 logo in addition to the screenshots.
