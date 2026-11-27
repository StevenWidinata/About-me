# Steven Widinata — About Me

> Curious Mind, Endless Possibilities

My personal website. It covers who I am, my journey from school to BINUS University, my projects and achievements, and what I want to explore next.

Built from scratch with plain HTML, CSS and JavaScript. There is no build step. The only library is [three.js](https://threejs.org/) (r128 from cdnjs) for the 3D space.

## What's on the page

- **3D intro (about 4.5 s):** a comet sweeps across a solar system (the sun and all 8 planets, painted in code) and leaves a trail of stars that gathers into my name. Then the system is yours to explore:
  - **On a computer:** scroll to fly forward and back, drag to look around, use WASD or the arrow keys to move, or click a planet, the sun or my name to glide there (the camera follows a planet along its orbit). Planet names show when you hover or fly close. A faint dotted globe marks the edge of the space, and **Back to my name** returns you to the start.
  - **On a phone:** drag to orbit the scene.
  - Hover the name to ripple its stars. **Start my journey** scatters the name into stardust and dives into the sun from wherever you are.
  - It plays once per browser session. Links to a section (like `/#projects`) skip it, and so does the reduced-motion setting. **Replay intro** is in the footer.
- **Space background:** the same solar system stays behind the whole site, seen from far away, dimmed and slowly turning, with a comet every 4–8 seconds.
- **Journey:** the timeline fills in and its stars light up as you scroll.
- **Project hall:** the projects stand on a curved wall, like a round room. Drag or swipe it, use the arrows or the arrow keys to turn it; clicking a side door turns it to you and opens it. Every door is dressed as the project behind it (synthwave for Mewing Academy, graph paper and stripes for ZeroSignal, an arcade cabinet for Glitch Type, a doodled sketchbook for Sketchy), and Reelo, a phone app, gets a cinema ticket booth. Each project's own mascot waits by its door (Mewy, Ping, Shift, the Sketchy raccoon and Reelo): click one and it does its trick, says hi and opens the door. A door without `data-project` stays locked and rattles when clicked. Below the doors: a link to my [3D gallery of every project](https://sliding-url.vercel.app), and a "More work" list that includes team builds.
- Dark design, in English / Bahasa Indonesia.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Customising

- **Projects:** door markup is in the `PROJECTS` section of `index.html`. The project room text and links live in the `PROJECTS` object in `js/main.js`. Screenshots are in `assets/covers/`.
- **Add a project:** copy a `slot--live` door and give it `data-project="<id>"`, a background image on `.door__inside`, its own `door--<theme>` class with an SVG `.door__art` on the leaf, and add `<id>` to `PROJECTS`. Covers are 1200 x 750 screenshots of the live site. Add the project's mascot as a `.mascot` button in its slot and a line in `CAST` in `js/main.js`; the pixel mascots in `assets/mascots/` are sprite sheets rendered from each project's own drawing code, one frame after another in a row. Smaller projects go in the "More work" list; add `<small class="more__team">Team</small>` after the name for team builds. Keep the "Live projects online" number in the stats row up to date.
- **Solar system:** planet sizes, orbits and painted textures are `PLANETS` and `PAINT` in `js/space.js`, and the explorable space is `BORDER_C` / `BORDER_R`. Comet timing is in `updateComets`. The intro timeline (`T_SWEEP`, `T_GATHER`, `T_READY`) is at the top of `js/intro.js`, and flight speed and the click-to-fly distances are in `updateFly` and `flyTo`.
- **Indonesian text:** all translations live in `js/i18n.js`. English is the key, Indonesian is the value.
- **Photo:** `assets/portrait.jpg` (hero) and `assets/profile.jpg` (share preview).
- **CV:** replace `assets/Steven_Widinata_CV.pdf`.
- **Share preview:** after deploying, change `og:image` in `index.html` to the full URL, for example `https://steven-widinata.vercel.app/assets/profile.jpg`.

## Structure

```
index.html          page markup
css/style.css       styles
js/main.js          interactions: language, menu, journey, doors
js/space.js         3D space: sun, planets, stars, comets (three.js)
js/intro.js         intro: comet trail → name, free flight, click to fly, dive into the sun
js/i18n.js          Indonesian translations
assets/             photos, CV, favicon, project screenshots
```
