# Steven Widinata — About Me

> Curious Mind, Endless Possibilities

My personal website. It covers who I am, my journey from school to BINUS University, my projects and achievements, and what I want to explore next.

Built from scratch with plain HTML, CSS and JavaScript. There is no build step. The only library is [three.js](https://threejs.org/) for the 3D intro, loaded from cdnjs on first visit.

## What's on the page

- **3D intro:** stars swirl together into my name. Move the cursor to scatter them, then press **Start my journey** to warp into the site. It plays once per browser session. Links to a section (like `/#projects`) skip it, and so does the reduced-motion setting. **Replay intro** is in the footer.
- **Star sky:** the background stars can be dragged and thrown.
- **Journey:** the timeline fills in and its stars light up as you scroll.
- **Project doors:** each project sits behind a door. Hover to peek, click to walk through into the project room. Locked doors are projects that are still coming.
- Dark and light mode, and English / Bahasa Indonesia.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Customising

- **Projects:** door markup is in the `PROJECTS` section of `index.html`. The project room text and links live in the `PROJECTS` object in `js/main.js`. Screenshots are in `assets/covers/`.
- **Add a project:** turn a "Coming soon" door into a live one: give it `data-project="<id>"`, a background image on `.door__inside`, the `slot--live` class, and add `<id>` to `PROJECTS`.
- **Indonesian text:** all translations live in `js/i18n.js`. English is the key, Indonesian is the value.
- **Photo:** `assets/portrait.jpg` (hero) and `assets/profile.jpg` (share preview).
- **CV:** replace `assets/Steven_Widinata_CV.pdf`.
- **Share preview:** after deploying, change `og:image` in `index.html` to the full URL, for example `https://steven-widinata.vercel.app/assets/profile.jpg`.

## Structure

```
index.html          page markup
css/style.css       styles (dark/light themes)
js/main.js          interactions: theme, language, star sky, journey, doors
js/intro.js         3D intro (three.js)
js/i18n.js          Indonesian translations
assets/             photos, CV, favicon, project screenshots
```
