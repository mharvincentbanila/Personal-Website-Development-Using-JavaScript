/* =====================================================================
   Mhar Vincent B. Banila: Personal Website (script.js)

   OOP CONCEPTS DEMONSTRATED
   ---------------------------------------------------------------------
   Classes & objects : Person, Student, Project, ProjectGallery, Lightbox,
                       ThemeManager, Navigation, FormValidator, ContactForm
   Encapsulation     : private fields (#name, #birth, #title, #rules ...)
                       exposed only through getters and methods
   Inheritance       : Student extends Person
                       DesignProject / WebProject extend Project
   Polymorphism      : details(), badge(), mediaClass(), footer() are
                       overridden in subclasses; the gallery calls
                       project.render() without caring which subclass it is
   ===================================================================== */
"use strict";

/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Create a DOM element: h("div", { class: "x" }, "text", childNode) */
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;      // skip empty slots
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

/** localStorage that never throws (private windows / blocked storage). */
const safeStorage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
};

/* =====================================================================
   1. PERSON  ->  STUDENT   (About Me section)
   ===================================================================== */
class Person {
  #name;   // private: only readable through the getters below
  #birth;

  constructor(name, birthDate) {
    this.#name = name;
    this.#birth = birthDate;
  }

  get name() { return this.#name; }

  /** Age is calculated from the birth date, so it is always current. */
  get age() {
    const today = new Date();
    let years = today.getFullYear() - this.#birth.getFullYear();
    const hadBirthday = today >= new Date(today.getFullYear(), this.#birth.getMonth(), this.#birth.getDate());
    if (!hadBirthday) years--;
    return years;
  }

  get birthText() {
    return this.#birth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  /** Rows shown in the "Personal information" card. */
  details() {
    return [
      ["Name", this.#name],
      ["Birth Date", this.birthText],
      ["Age", `${this.age} years old`]
    ];
  }
}

class Student extends Person {            // inheritance
  constructor(name, birthDate, extraDetails) {
    super(name, birthDate);
    this.extraDetails = extraDetails;
  }

  details() {                              // polymorphism: extends the parent's rows
    return [...super.details(), ...this.extraDetails];
  }
}

/* =====================================================================
   2. PROJECT  ->  DESIGN PROJECT / WEB PROJECT   (Portfolio section)
   ===================================================================== */
class Project {
  #title;

  constructor({ title, category, summary, points, image, imageAlt, tint }) {
    this.#title = title;
    Object.assign(this, { category, summary, points, image, imageAlt, tint });
  }

  get title() { return this.#title; }

  /* Methods that subclasses override (polymorphism) */
  badge() { return "Project"; }
  footer() { return ""; }
  mediaClass() { return "proj-media"; }
  mediaTop() { return null; }              // optional element above the image

  /** Build the project card. The gallery only ever calls this one method. */
  render(index) {
    const number = String(index + 1).padStart(2, "0");

    const media = h("button", {
      class: this.mediaClass(),
      type: "button",
      style: `--tint:${this.tint}`,
      "aria-label": `View larger image: ${this.title}`
    },
      this.mediaTop(),
      h("img", { src: this.image, alt: this.imageAlt, loading: "lazy", decoding: "async" }),
      h("span", { class: "zoom-hint", "aria-hidden": "true" }, "Click to enlarge")
    );
    media.dataset.full = this.image;
    media.dataset.alt = this.imageAlt;

    const body = h("div", { class: "proj-body" },
      h("span", { class: "proj-num" }, `PROJECT ${number}`),
      h("span", { class: "tag" }, this.badge()),
      h("h3", {}, this.title),
      h("p", {}, this.summary),
      h("ul", { class: "proj-points" }, this.points.map(p => h("li", {}, p))),
      h("div", { class: "proj-foot" }, this.footer())
    );

    const card = h("article", { class: "card project reveal" }, media, body);
    card.dataset.category = this.category;
    return card;
  }
}

class DesignProject extends Project {      // inheritance
  badge() { return "🎨 Visual Design"; }
  mediaClass() { return "proj-media tall"; }
  footer() {
    return h("span", {}, h("b", {}, "Made for: "), "digital campaigns and printed promo materials");
  }
}

class WebProject extends Project {         // inheritance
  constructor(data, stack) {
    super(data);
    this.stack = stack;
  }
  badge() { return "💻 Web Platform"; }
  mediaTop() {                             // fake browser bar above the screenshot
    return h("div", { class: "browser-bar", "aria-hidden": "true" }, h("i"), h("i"), h("i"));
  }
  footer() {
    return h("span", {}, h("b", {}, "Focus: "), this.stack);
  }
}

/* Project data: descriptions come from the course brief. */
const PROJECTS = [
  new DesignProject({
    title: "House of Unlimited Chicken Wings",
    category: "design",
    summary: "A high-impact promotional design and visual marketing project created to highlight restaurant menu offerings and increase foot traffic for branch locations.",
    points: [
      "Unlimited wings, rice, and lemonade promotion",
      "20 distinct flavors, including Cajun and Salted Egg",
      "Vibrant food imagery with high-contrast typography",
      "Operating hours, pricing, and branch location included"
    ],
    image: "images/project-chicken-wings.jpg",
    imageAlt: "Promotional poster for House of Unlimited Chicken Wings showing Cajun and Salted Egg wings, a 399 pesos unlimited deal, and the Pasig branch details",
    tint: "linear-gradient(135deg,#3b1707,#7c2d12)"
  }),
  new WebProject({
    title: "Cultivating Change",
    category: "web",
    summary: "A digital web platform built to advance urban agriculture, streamline livestock tracking, and expand local community food access across Metro Manila.",
    points: [
      "Tools to manage crop cycles and micro-farming logistics",
      "Connects growers directly with neighbors and community food pantries",
      "Cuts out middleman costs",
      "Verification protocols for listed sellers and products"
    ],
    image: "images/project-cultivating-change.jpg",
    imageAlt: "Cultivating Change home page with a dark wheat-field background, an orange Explore Directory button, and three feature cards",
    tint: "#0c0c0d"
  }, "Urban agriculture and community food access in Metro Manila"),
  new WebProject({
    title: "NexusDB",
    category: "web",
    summary: "A lightweight, responsive database management dashboard engineered for efficient data tracking and administration.",
    points: [
      "Browser-based localStorage keeps records between sessions",
      "No heavy backend required",
      "Live widgets for total records, data integrity, and storage usage",
      "Real-time activity log"
    ],
    image: "images/project-nexusdb.jpg",
    imageAlt: "NexusDB dashboard overview showing 15 total records, 100 percent data integrity, system status, storage usage, and recent activity",
    tint: "#e8ebf4"
  }, "Data tracking and administration with localStorage persistence")
];

/* =====================================================================
   3. PROJECT GALLERY: renders cards + category filters
   ===================================================================== */
class ProjectGallery {
  #projects;
  #list;
  #filters;

  constructor(projects, listEl, filtersEl, onOpenImage) {
    this.#projects = projects;
    this.#list = listEl;
    this.#filters = filtersEl;
    this.onOpenImage = onOpenImage;
  }

  init() {
    this.#list.replaceChildren(...this.#projects.map((p, i) => p.render(i)));   // polymorphic render

    const labels = { all: "All", design: "Visual Design", web: "Web" };
    const buttons = Object.entries(labels).map(([key, label]) => {
      const btn = h("button", { type: "button", class: "filter", "aria-pressed": String(key === "all") }, label);
      btn.dataset.filter = key;
      return btn;
    });
    this.#filters.replaceChildren(...buttons);

    this.#filters.addEventListener("click", e => {
      const btn = e.target.closest(".filter");
      if (btn) this.#apply(btn.dataset.filter);
    });

    this.#list.addEventListener("click", e => {
      const media = e.target.closest(".proj-media");
      if (media) this.onOpenImage(media.dataset.full, media.dataset.alt, media);
    });
  }

  #apply(key) {
    this.#filters.querySelectorAll(".filter").forEach(b =>
      b.setAttribute("aria-pressed", String(b.dataset.filter === key)));
    this.#list.querySelectorAll(".project").forEach(card =>
      card.classList.toggle("is-hidden", key !== "all" && card.dataset.category !== key));
  }
}

/* =====================================================================
   4. LIGHTBOX: full-size project images
   ===================================================================== */
class Lightbox {
  #root; #img; #closeBtn; #opener = null;

  constructor(root, img, closeBtn) {
    this.#root = root; this.#img = img; this.#closeBtn = closeBtn;
    closeBtn.addEventListener("click", () => this.close());
    root.addEventListener("click", e => { if (e.target === root) this.close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !root.hidden) this.close(); });
  }

  open(src, alt, opener) {
    this.#opener = opener;
    this.#img.src = src;
    this.#img.alt = alt;
    this.#root.hidden = false;
    document.body.style.overflow = "hidden";
    this.#closeBtn.focus();
  }

  close() {
    this.#root.hidden = true;
    this.#img.removeAttribute("src");
    document.body.style.overflow = "";
    this.#opener?.focus();
  }
}

/* =====================================================================
   5. THEME MANAGER: light / dark toggle (remembered)
   ===================================================================== */
class ThemeManager {
  #root = document.documentElement;
  #btn;

  constructor(btn) {
    this.#btn = btn;
    this.#sync();
    btn.addEventListener("click", () => this.toggle());
  }

  get current() { return this.#root.dataset.theme === "light" ? "light" : "dark"; }

  toggle() {
    this.#root.dataset.theme = this.current === "dark" ? "light" : "dark";
    safeStorage.set("mvb-theme", this.current);
    this.#sync();
  }

  #sync() {
    this.#btn.setAttribute("aria-label", `Switch to ${this.current === "dark" ? "light" : "dark"} theme`);
  }
}

/* =====================================================================
   6. NAVIGATION: mobile menu, active link, scroll progress
   ===================================================================== */
class Navigation {
  #nav; #menuBtn; #bar; #links;

  constructor(nav, menuBtn, progressBar) {
    this.#nav = nav; this.#menuBtn = menuBtn; this.#bar = progressBar;
    this.#links = [...nav.querySelectorAll("a")];
  }

  init() {
    this.#menuBtn.addEventListener("click", () => this.#setOpen(!this.#nav.classList.contains("open")));
    this.#links.forEach(a => a.addEventListener("click", () => this.#setOpen(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.#setOpen(false); });
    document.addEventListener("click", e => {
      if (!this.#nav.contains(e.target) && !this.#menuBtn.contains(e.target)) this.#setOpen(false);
    });

    this.#watchSections();
    this.#watchScroll();
  }

  #setOpen(open) {
    this.#nav.classList.toggle("open", open);
    this.#menuBtn.setAttribute("aria-expanded", String(open));
    this.#menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  #watchSections() {
    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        this.#links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(s => spy.observe(s));
  }

  #watchScroll() {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      this.#bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }
}

/* =====================================================================
   7. FORM VALIDATION  (Contact page requirement)
   ===================================================================== */
class FormValidator {
  #form;
  #rules;   // { fieldName: value => "error message" | "" }

  constructor(form, rules) {
    this.#form = form;
    this.#rules = rules;
  }

  /** Validate one field and show or hide its message. Returns true if valid. */
  check(name) {
    const input = this.#form.elements[name];
    const value = input.value.trim();
    const message = this.#rules[name](value);
    const wrapper = input.closest(".field");

    wrapper.querySelector(".err").textContent = message;
    wrapper.classList.toggle("invalid", Boolean(message));
    wrapper.classList.toggle("valid", !message && value.length > 0);
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  }

  /** Validate every field (map first, so all errors show at once). */
  checkAll() {
    return Object.keys(this.#rules).map(name => this.check(name)).every(Boolean);
  }

  reset() {
    this.#form.reset();
    this.#form.querySelectorAll(".field").forEach(f => {
      f.classList.remove("valid", "invalid");
      f.querySelector(".err").textContent = "";
    });
  }

  get fields() { return Object.keys(this.#rules); }
}

class ContactForm {
  static MAX = 500;
  #form; #validator; #success; #mailLink; #counter;

  constructor(form) {
    this.#form = form;
    this.#success = form.querySelector("#success");
    this.#mailLink = form.querySelector("#mailLink");
    this.#counter = form.querySelector("#counter");

    this.#validator = new FormValidator(form, {
      name: v =>
        !v ? "Please enter your name." :
        v.length < 2 ? "Name must be at least 2 characters." :
        !/^\p{L}[\p{L}\s.'-]*$/u.test(v) ? "Name can only contain letters, spaces, and . ' -" : "",
      email: v =>
        !v ? "Please enter your email address." :
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Enter a valid email, like name@example.com." : "",
      subject: v =>
        !v ? "Please enter a subject." :
        v.length < 3 ? "Subject must be at least 3 characters." : "",
      message: v =>
        !v ? "Please write a message." :
        v.length < 10 ? "Message must be at least 10 characters." :
        v.length > ContactForm.MAX ? `Message must be ${ContactForm.MAX} characters or fewer.` : ""
    });
  }

  init() {
    this.#validator.fields.forEach(name => {
      const input = this.#form.elements[name];
      input.addEventListener("blur", () => this.#validator.check(name));          // when leaving the field
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("invalid")) this.#validator.check(name);  // live fix
        if (name === "message") this.#counter.textContent = `${input.value.length}/${ContactForm.MAX}`;
      });
    });

    this.#form.addEventListener("submit", e => {
      e.preventDefault();
      this.#success.hidden = true;

      if (!this.#validator.checkAll()) {
        this.#form.querySelector(".invalid input, .invalid textarea")?.focus();   // jump to first error
        return;
      }
      this.#showSuccess();
    });
  }

  #showSuccess() {
    const data = Object.fromEntries(new FormData(this.#form));
    const body = `${data.message.trim()}\n\n- ${data.name.trim()} (${data.email.trim()})`;
    this.#mailLink.href =
      `mailto:mharvincentbalmesbanila@gmail.com?subject=${encodeURIComponent(data.subject.trim())}&body=${encodeURIComponent(body)}`;

    this.#validator.reset();
    this.#counter.textContent = `0/${ContactForm.MAX}`;
    this.#success.hidden = false;
    this.#success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
  }
}

/* =====================================================================
   8. HOME PAGE EXTRAS: greeting, rotating role, counters, reveal
   ===================================================================== */
function setGreeting() {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  document.getElementById("greet").textContent = `${part}, and welcome! 👋`;
}

function rotateRole() {
  if (prefersReducedMotion) return;
  const el = document.getElementById("role");
  const roles = ["creative editor", "multi-tasker", "home cook", "web developer in training"];
  let i = 0;
  setInterval(() => {
    el.classList.add("swap");
    setTimeout(() => {
      i = (i + 1) % roles.length;
      el.textContent = roles[i];
      el.classList.remove("swap");
    }, 260);
  }, 2600);
}

function animateCounters(person) {
  const counters = document.querySelectorAll(".stats dd");
  counters.forEach(el => {
    const target = el.hasAttribute("data-age") ? person.age : Number(el.dataset.count);
    if (prefersReducedMotion) { el.textContent = target; return; }
    const start = performance.now(), duration = 1200;
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));   // ease-out
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("in")); return; }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(i => io.observe(i));
}

/* =====================================================================
   9. APP: put everything together
   ===================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // About Me: Student (inherits from Person)
  const me = new Student("Mhar Vincent B. Banila", new Date(2006, 0, 22), [
    ["Birth Place", "San Juan Medical City"],
    ["Civil Status", "Single"],
    ["Gender", "Male"]
  ]);
  document.getElementById("info").replaceChildren(
    ...me.details().map(([label, value]) => h("div", {}, h("dt", {}, label), h("dd", {}, value)))
  );

  // Projects + lightbox
  const lightbox = new Lightbox(
    document.getElementById("lightbox"),
    document.getElementById("lightboxImg"),
    document.getElementById("lightboxClose")
  );
  new ProjectGallery(
    PROJECTS,
    document.getElementById("projectList"),
    document.getElementById("filters"),
    (src, alt, opener) => lightbox.open(src, alt, opener)
  ).init();

  // Theme, navigation, contact form
  new ThemeManager(document.getElementById("themeBtn"));
  new Navigation(document.getElementById("nav"), document.getElementById("menuBtn"), document.getElementById("progress")).init();
  new ContactForm(document.getElementById("contactForm")).init();

  // Home extras
  setGreeting();
  rotateRole();
  animateCounters(me);
  document.getElementById("year").textContent = new Date().getFullYear();
  setupReveal();
});
