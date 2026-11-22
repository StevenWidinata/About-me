# Steven Widinata — About Me

> Curious Mind, Endless Possibilities

My personal website. It covers who I am, my journey from school to BINUS University, my projects and achievements, and what I want to explore next.

Built from scratch with plain HTML, CSS and JavaScript. There is no build step. The only library is [three.js](https://threejs.org/) (r128 from cdnjs) for the 3D space.

## What's on the page

- **3D intro (about 7 s):** a comet sweeps across a solar system (the sun and all 8 planets, painted in code) and leaves a trail of stars that gathers into my name. Drag anywhere to orbit the scene, hover the name to ripple its stars, then press **Start my journey**: the name scatters into stardust and the camera dives into the sun. It plays once per browser session. Links to a section (like `/#projects`) skip it, and so does the reduced-motion setting. **Replay intro** is in the footer.
- **Space background:** the same solar system stays behind the whole site, seen from far away, dimmed and slowly turning, with a comet every 4–8 seconds.
- **Journey:** the timeline fills in and its stars light up as you scroll.
- **Project doors:** each project sits behind a door. Hover to peek, click to walk through into the project room. Locked doors are projects that are still coming. Below the doors: a link to my [3D gallery of every project](https://sliding-url.vercel.app), and a "More work" list that includes team builds.
- Dark design, in English / Bahasa Indonesia.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Customising

- **Projects:** door markup is in the `PROJECTS` section of `index.html`. The project room text and links live in the `PROJECTS` object in `js/main.js`. Screenshots are in `assets/covers/`.
- **Add a project:** turn a "Coming soon" door into a live one: give it `data-project="<id>"`, a background image on `.door__inside`, the `slot--live` class, and add `<id>` to `PROJECTS`. Smaller projects go in the "More work" list; add `<small class="more__team">Team</small>` after the name for team builds. Keep the "Live projects online" number in the stats row up to date.
- **Solar system:** planet sizes, orbits and painted textures are `PLANETS` and `PAINT` in `js/space.js`; comet timing is in `updateComets`. The intro timeline (`T_SWEEP`, `T_GATHER`, `T_READY`) is at the top of `js/intro.js`.
- **Indonesian text:** all translations live in `js/i18n.js`. English is the key, Indonesian is the value.
- **Photo:** `assets/portrait.jpg` (hero) and `assets/profile.jpg` (share preview).
- **CV:** replace `assets/Steven_Widinata_CV.pdf`.
- **Share preview:** after deploying, change `og:image` in `index.html` to the full URL, for example `https://steven-widinata.vercel.app/assets/profile.jpg`.

## Structure

```
index.html          page markup
css/style.css       styles (dark/light themes)
js/main.js          interactions: language, menu, journey, doors
js/space.js         3D space: sun, planets, stars, comets (three.js)
js/intro.js         intro: comet trail → name, drag to orbit, dive into the sun
js/i18n.js          Indonesian translations
assets/             photos, CV, favicon, project screenshots
```
