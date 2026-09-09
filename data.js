// =====================================================
// Project data
// This is the single source of truth for every project on the
// site — the landing page carousel and each project's detail
// page both read from this same array.
//
// To add a new project: copy one of the objects below, give it
// a unique id, and fill in real content. Nothing else needs to
// change — the carousel and detail page both loop over this
// array automatically, so a 6th, 7th, etc. project just works.
//
// Image paths point to an /images folder that sits next to
// these files. Until real files exist there, missing images
// fall back to a plain labeled placeholder (see site.js) —
// nothing will look "broken" while you're still adding content.
// =====================================================
const PROJECTS = [
  {
    id: "project-one",
    name: "Project One",
    heroImage: "images/project-one-hero.jpg",
    story: "Replace this with the full story behind the project — the brief, your process, references, and what you learned along the way. This panel scrolls, so don't worry about length.",
    renders: [
      { image: "images/project-one-render-1.jpg", description: "Describe this specific render — angle, lighting setup, or what it's showing." },
      { image: "images/project-one-render-2.jpg", description: "Description for the second render of this project." },
      { image: "images/project-one-render-3.jpg", description: "Description for the third render of this project." }
    ]
  },
  {
    id: "project-two",
    name: "Project Two",
    heroImage: "images/project-two-hero.jpg",
    story: "Replace this with the story behind Project Two.",
    renders: [
      { image: "images/project-two-render-1.jpg", description: "Description for this render." },
      { image: "images/project-two-render-2.jpg", description: "Description for this render." },
      { image: "images/project-two-render-3.jpg", description: "Description for this render." }
    ]
  },
  {
    id: "project-three",
    name: "Project Three",
    heroImage: "images/project-three-hero.jpg",
    story: "Replace this with the story behind Project Three.",
    renders: [
      { image: "images/project-three-render-1.jpg", description: "Description for this render." },
      { image: "images/project-three-render-2.jpg", description: "Description for this render." },
      { image: "images/project-three-render-3.jpg", description: "Description for this render." }
    ]
  },
  {
    id: "project-four",
    name: "Project Four",
    heroImage: "images/project-four-hero.jpg",
    story: "Replace this with the story behind Project Four.",
    renders: [
      { image: "images/project-four-render-1.jpg", description: "Description for this render." },
      { image: "images/project-four-render-2.jpg", description: "Description for this render." },
      { image: "images/project-four-render-3.jpg", description: "Description for this render." }
    ]
  },
  {
    id: "project-five",
    name: "Project Five",
    heroImage: "images/project-five-hero.jpg",
    story: "Replace this with the story behind Project Five.",
    renders: [
      { image: "images/project-five-render-1.jpg", description: "Description for this render." },
      { image: "images/project-five-render-2.jpg", description: "Description for this render." },
      { image: "images/project-five-render-3.jpg", description: "Description for this render." }
    ]
  }
];
