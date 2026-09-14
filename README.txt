This folder is where your real project images go.

Based on data.js, the site currently expects these files (feel
free to rename things — just update the matching path in data.js):

images/project-one-hero.jpg
images/project-one-render-1.jpg
images/project-one-render-2.jpg
images/project-one-render-3.jpg
images/project-one-render-4.gif
images/project-one-render-4-poster.jpg

images/project-two-hero.jpg
images/project-two-render-1.jpg
images/project-two-render-2.jpg
images/project-two-render-3.jpg

images/project-three-hero.jpg
images/project-three-render-1.jpg
images/project-three-render-2.jpg
images/project-three-render-3.jpg

images/project-four-hero.jpg
images/project-four-render-1.jpg
images/project-four-render-2.jpg
images/project-four-render-3.jpg

images/project-five-hero.jpg
images/project-five-render-1.jpg
images/project-five-render-2.jpg
images/project-five-render-3.jpg

Renders aren't limited to .jpg/.png — a render's image can be a
.gif too (see project-one-render-4.gif above), and it just works:
same fullscreen/magnifier behavior, and it autoplays once it's the
one selected, since that's how browsers already handle animated
GIFs in an image. Give it a `poster` in data.js (a plain static
image, like project-one-render-4-poster.jpg above) and its
thumbnail shows that still frame instead of animating in the stack
— the main preview still plays the real .gif once it's selected.

Until these exist, the site shows a plain labeled placeholder
instead of a broken image icon, so nothing will look "broken"
while you're still adding content.

Delete this file whenever you like — it's just a checklist.
