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
//
// A render's `image` can be a .gif as well as .jpg/.png — nothing
// else needs to change. It's displayed exactly like any other
// render (same masking, fullscreen, and magnifier behavior) and
// autoplays once it's the one selected, since that's just how
// browsers already handle animated GIFs in an <img>.
//
// An animated render can also set `poster`: a static image shown in
// its thumbnail instead of `image`, so the thumbnail stack doesn't
// have several GIFs all playing at once — the main preview still
// uses the real (animated) `image` once that render is selected.
// Renders without a `poster` just use their own `image` for the
// thumbnail too, exactly as before. See project-one's 4th render.
// =====================================================
// =====================================================
// Footer social links
// Rendered as icons in the bottom-right of the footer on every page
// (see renderFooterSocial in site.js) — nothing outside this array
// needs to change to add, remove, or edit a link.
//
// To add a link: copy an entry, give it a unique id, set its label
// (used for the tooltip and screen readers), url, and an icon (an
// inline SVG string). To remove a link: delete its entry. To edit a
// link: change its url. Order here is left-to-right render order.
//
// Leave a url as "#" as a placeholder until you have the real one —
// same convention used elsewhere on the site.
// =====================================================
const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/dushko.art",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none"></circle></svg>`
  },
  {
    id: "email",
    label: "Email",
    url: "duhsko.barutovski@gmail.com",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path></svg>`
  },
  {
  id: "artstation",
  label: "ArtStation",
  url: "https://www.artstation.com/dbarutovski",
  icon: `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.2 17.5h9.9l-5.1-8.8-2.2 3.8 2 3.4H7.2a1.8 1.8 0 0 0 0 3.6z"></path>
    <path d="M14.8 5.5h-2.9a2 2 0 0 0-1.7 1L6.4 14.8"></path>
    <path d="M14.1 7.2l4.1 7.1c.8 1.4-.2 3.2-1.8 3.2h-2.5"></path>
  </svg>`
  },
  {
    id: "fiverr",
    label: "Fiverr",
    url: "#",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><text x="12" y="16" text-anchor="middle" font-size="8.5" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">fi</text></svg>`
  }
];

const PROJECTS = [
  {
    id: "project-one",
    name: "Rōdvīras",
    heroImage: "images/project-one-hero.png",
    story: "Rōdvīras is an outsider who arrived from the outer world before the catastrophe, carrying knowledge of what was to come and intending to use it to prevent it. An intellectual among the kind, accustomed to understanding problems through observation, reason, and knowledge, the arrival soon revealed an important limitation: understanding a world was not the same as understanding the people who lived in it. Rōdvīras' warnings were interpreted through faith, questioned through science, and rejected by those who could not imagine their world coming to an end. The catastrophe came shortly after Rōdvīras' arrival, despite every effort to prevent it. Conflicting accounts of what had happened emerged, and questions remained that neither faith nor science could answer alone. Priests interpreted the catastrophe through faith, researchers searched for evidence, and survivors carried memories that often contradicted them both. Rather than choosing one explanation and dismissing the others, Rōdvīras began to wonder if these accounts were different interpretations of the same truth. Rōdvīras became an advisor. Priests, researchers, rulers, and ordinary survivors sought knowledge, and answers were offered when possible. When not, there was never a fear of admitting, “I do not know.” The purpose is no longer simply to understand how the catastrophe could have been prevented, but to understand the world and its people well enough to discover what truly happened. Somewhere between faith, science, memory, and observation may lie the knowledge that could one day allow the catastrophe to be reversed.",
    renders: [
      { image: "images/project-one-render-1.jpg", description: "Describe this specific render — angle, lighting setup, or what it's showing." },
      { image: "images/project-one-render-2.jpg", description: "Description for the second render of this project." },
      { image: "images/project-one-render-3.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-4.gif", poster: "images/project-one-render-4-poster.jpg", description: "Final render composition passes." },
      { image: "images/project-one-render-5.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-6.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-7.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-8.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-9.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-10.jpg", description: "Description for the third render of this project." },
      { image: "images/project-one-render-11.jpg", description: "Description for the third render of this project." }

    ]
  },
  {
    id: "project-two",
    name: "Vandūnas",
    heroImage: "images/project-two-hero.png",
    story: "Vandūnas is a priest of the Third Rank of the Order of the Ones with the Waters, an ancient priesthood that once guided sailors, hunters, researchers, merchants, rulers, and all others whose lives depended on the waters. The waters were believed to have souls of their own and to speak to the priests of the higher ranks. Through whispers and visions, the Order was said to shape the future. But the waters eventually went silent. It may be that the Order lost the ability to listen, or that the waters lost their souls. As the visions faded, the temples emptied, donations ceased, and the priesthood slowly dispersed. Yet when the Order faded, Vandūnas remained. He was never one of the gifted, having never received vivid visions or clear whispers, and never rising beyond the Third Rank. His duties were humble: maintaining the temple, preserving records, tending sacred rituals, and offering blessings to those who depended on the waters. He still does not know if the waters will ever speak, but someone should be there to listen if they do.",
    renders: [
      { image: "images/project-two-render-1.jpg", description: "Vandūnas hero render." },
      { image: "images/project-two-render-2.jpg", description: "Vandūnas clay render." },
      { image: "images/project-two-render-3.jpg", description: "Vandūnas alternate render." },
      { image: "images/project-two-render-4.jpg", description: "Vandūnas alternate render." },
      { image: "images/project-two-render-5.gif", poster: "images/project-two-render-5-poster.jpg", description: "Final render composition passes." },
      { image: "images/project-two-render-6.jpg", description: "Albedo render." },
      { image: "images/project-two-render-7.jpg", description: "Ambient Occulsion (AO) render." },
      { image: "images/project-two-render-8.jpg", description: "Scarf and lapel close up." },
      { image: "images/project-two-render-9.gif", poster: "images/project-two-render-9-poster.jpg", description: "Scarf texture layers" },
      { image: "images/project-two-render-10.jpg", description: "Headshot" },
      { image: "images/project-two-render-11.jpg", description: "Vandūnas'sacred regalia" }

    ]
  },
  {
    id: "project-three",
    name: "Project Three",
    heroImage: "images/project-three-hero.png",
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
    heroImage: "images/project-four-hero.png",
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
    heroImage: "images/project-five-hero.png",
    story: "Replace this with the story behind Project Five.",
    renders: [
      { image: "images/project-five-render-1.jpg", description: "Description for this render." },
      { image: "images/project-five-render-2.jpg", description: "Description for this render." },
      { image: "images/project-five-render-3.jpg", description: "Description for this render." }
    ]
  }
];
