# Steven Widinata — About Me

> Curious Mind, Endless Possibilities

My personal website. It covers who I am, my journey from school to BINUS University, my projects and achievements, and what I want to explore next.

Built from scratch with plain HTML, CSS and JavaScript. There is no build step. The only library is [three.js](https://threejs.org/) for the 3D intro, loaded from cdnjs on first visit.

## What's on the page

- **3D intro:** my journey drawn as a constellation. A line traces an "SW" star by star, and four of the stars are chapters (2013 SD, 2019 SMP, 2022 SMA, 2026 BINUS) that light up with their year. Point at (or tap) a star to highlight its chapter, then press **Start my journey** to fly into the 2026 star and warp into the site. It plays once per browser session. Links to a section (like `/#projects`) skip it, and so does the reduced-motion setting. **Replay intro** is in the footer.
- **Star sky:** a faint far layer of stars drifts with the scroll, the nearer stars can be dragged and thrown, and every now and then a comet crosses the sky.
- **Journey:** the timeline fills in and its stars light up as you scroll.
- **Project doors:** each project sits behind a door. Hover to peek, click to walk through into the project room. Locked doors are projects that are still coming. Below the doors: a link to my [3D gallery of every project](https://sliding-url.vercel.app), and a "More work" list that includes team builds.
- Dark and light mode, and English / Bahasa Indonesia.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Customising

- **Projects:** door markup is in the `PROJECTS` section of `index.html`. The project room text and links live in the `PROJECTS` object in `js/main.js`. Screenshots are in `assets/covers/`.
- **Add a project:** turn a "Coming soon" door into a live one: give it `data-project="<id>"`, a background image on `.door__inside`, the `slot--live` class, and add `<id>` to `PROJECTS`. Smaller projects go in the "More work" list; add `<small class="more__team">Team</small>` after the name for team builds. Keep the "Live projects online" number in the stats row up to date.
- **Intro constellation:** the star path and chapter stars are `SHAPE` and `CHAPTERS` at the top of `js/intro.js`; the chapter labels are in `.intro__labels` in `index.html`.
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
