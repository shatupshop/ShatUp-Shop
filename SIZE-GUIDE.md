# ShatUp Shop — image & video size guide

Measured from the real layout. Photos are shrunk automatically in the browser before upload
(so a big phone photo is fine), but the **shape** matters because pictures are cropped to fit.
The admin panel now warns you (in amber) if the shape or size is off.

| Where | Best size | Shape | What is shown / keep safe |
|---|---|---|---|
| **Main banner** (Admin → Banners) | **1600 × 600 px** | wide 8:3 | Phone shows the centre ~62% of the width; desktop shows the centre ~68% of the height. **Keep text & faces inside the middle 960 × 400 px.** Video: MP4, under 20 MB (≈8 MB loads fastest). |
| **Promo strip** (Admin → Promo Strip) | **1200 × 375 px** | 3.2:1 | Phone shows the whole picture. Desktop is a thinner strip (7:1) and crops top & bottom, so **keep the important part in the middle 1200 × 170 px band**. |
| **Product photos** | **1000 × 1000 px** (min 600) | square 1:1 | Shown square on cards, in the popup and in the cart. First photo = cover. Up to 8 photos. |
| **Product video** | MP4 / WebM, **under 8 MB** (max 20 MB) | square or vertical | Up to 2 per product. Plays inside the product popup. |
| **Collections** (Admin → Collections) | **800 × 800 px** | square 1:1 | The collection name sits on the bottom third — keep that area plain. |
| **Logo** (`public/logo.png`) | 512 × 512 px, transparent PNG | square | Used in the footer and as the browser icon source. |

Rendered sizes (CSS px): main banner 369×224 (phone) / 1248×320 (desktop); promo strip 369×115 / 1248×178;
product card 179×179 / 237×237; collection card 115×115 / 405×405.
