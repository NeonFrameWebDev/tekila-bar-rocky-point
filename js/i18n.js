(function () {
"use strict";
const STORAGE_KEY = "nf_lang";
const SUPPORTED = ["en", "es"];
function detectInitialLang() {
const saved = localStorage.getItem(STORAGE_KEY);
if (saved && SUPPORTED.includes(saved)) return saved;
const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
return browser === "es" ? "es" : "en";
}
function applyLang(lang) {
if (!SUPPORTED.includes(lang)) lang = "en";
document.documentElement.lang = lang;
document.body.dataset.lang = lang;
document.querySelectorAll("[data-en][data-es]").forEach((el) => {
const val = el.dataset[lang];
if (typeof val === "string") el.innerHTML = val;
});
const attrSelector = "[data-en-attr], [data-es-attr]";
document.querySelectorAll("*").forEach((el) => {
for (const key of Object.keys(el.dataset)) {
const m = key.match(/^(en|es)Attr([A-Z]\w*)$/);
if (!m) continue;
const [_, kLang, attrPascal] = m;
if (kLang !== lang) continue;
const attr = attrPascal
.replace(/([A-Z])/g, (s, c) => "-" + c.toLowerCase())
.replace(/^-/, "");
el.setAttribute(attr, el.dataset[key]);
}
});
document.querySelectorAll(".lang-toggle").forEach((btn) => {
btn.dataset.current = lang;
btn.setAttribute("aria-label", lang === "en" ? "Cambiar a español" : "Switch to English");
});
localStorage.setItem(STORAGE_KEY, lang);
}
function toggleLang() {
const cur = localStorage.getItem(STORAGE_KEY) || detectInitialLang();
applyLang(cur === "en" ? "es" : "en");
}
document.addEventListener("DOMContentLoaded", () => {
applyLang(detectInitialLang());
document.querySelectorAll(".lang-toggle").forEach((btn) => {
btn.addEventListener("click", (e) => {
e.preventDefault();
toggleLang();
});
});
});
window.NFi18n = { applyLang, toggleLang, detect: detectInitialLang };
})();