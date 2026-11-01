# Biswajeet Kumar Parida — Portfolio

A 3D portfolio site (three.js) with HD images, a showreel video and gamification:
a funnel-stage journey meter, the Lead Catcher mini-game, and achievement badges.
Plain HTML, CSS and JavaScript. No build step.

## Folder structure

```
index.html                  The page. Search for "EDIT:" to find things to update.
.nojekyll                   Tells GitHub Pages to serve every file as-is. Keep it.
assets/
  css/style.css             All styling. Colours are at the top.
  js/scene.js               The 3D funnel, falling leads and orbiting metric chips.
  js/game.js                Lead Catcher game. Difficulty settings are at the top.
  js/main.js                Journey meter, quests, toasts, image tilt, showreel autoplay.
  js/vendor/three.min.js    three.js r128, included so nothing loads from outside.
  img/profile.jpg           Your photo (replace with a sharper one, see below).
  img/work-*.webp           Case-study images, 2000 × 1250.
  img/og-image.jpg          Preview image for LinkedIn and WhatsApp shares, 1200 × 630.
  img/funnel.png            Shown instead of 3D on devices without WebGL.
  img/favicon.png           Browser tab icon.
  img/apple-touch-icon.png  iPhone home-screen icon.
  video/showreel.mp4        17-second 1080p showreel.
  video/showreel-poster.jpg Frame shown before the video plays.
```

## Put it on GitHub Pages

1. Open your repository `Biswajeet_Portfolio` on GitHub.
2. Delete the old `index.html`.
3. Click **Add file → Upload files** and drag in everything from this folder,
   including the `assets` folder and `.nojekyll`.
   (On a Mac, press Cmd + Shift + . in Finder to see `.nojekyll`.)
4. Commit. The site updates at
   https://biswajeet-stack.github.io/Biswajeet_Portfolio/ within a minute or two.

## Share an asset directly

Every file has its own public link once uploaded, for example:

- Video: https://biswajeet-stack.github.io/Biswajeet_Portfolio/assets/video/showreel.mp4
- Pipeline image: https://biswajeet-stack.github.io/Biswajeet_Portfolio/assets/img/work-pipeline.webp

## Replace an asset

Keep the same file name and folder, upload, and the site picks it up.

- **Photo:** the current one came from your CV and is low resolution.
  Replace `assets/img/profile.jpg` with a square photo, at least 600 × 600.
- **Video:** replace `assets/video/showreel.mp4` with an MP4 (H.264).
  Under 10 MB keeps the page fast. Update `showreel-poster.jpg` to match.
- **Case images:** any 16:10 image works, ideally 2000 × 1250 WebP or JPG.
  If you change the format, update the file name in `index.html`.

## Tweak the gamification

- **Game difficulty:** top of `assets/js/game.js`. `TARGET_CPL` is the ₹600 to beat,
  `BURN` is ad spend per second, `SPAM_COST` is the penalty for catching spam.
- **Stage names and messages:** `STAGES` near the top of `assets/js/main.js`.
- **Your badges:** the "Unlocked by me" list in `index.html`.
- Visitor progress and best scores are saved in their own browser only.

## Before you go live

- Paste your Google Analytics snippet where `index.html` says `EDIT`.
- Check the résumé link points to your latest CV.
