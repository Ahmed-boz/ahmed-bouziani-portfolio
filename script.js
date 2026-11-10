(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.add("js-anim");

  // Ambient network diagram used behind the terminal.
  const canvas = document.getElementById("reseau");
  const ctx = canvas && canvas.getContext("2d");
  const hero = canvas && canvas.closest(".hero");
  const cursor = document.getElementById("curseur-perso");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: -1000, y: -1000, active: false };
  if (cursor && finePointer) document.body.classList.add("curseur-actif");
  let points = [];
  let frame = 0;
  function resizeNetwork() {
    if (!canvas || !ctx) return;
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(box.width * ratio));
    canvas.height = Math.max(1, Math.floor(box.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(24, Math.min(76, Math.floor(box.width * box.height / 18000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * box.width,
      y: Math.random() * box.height,
      vx: (Math.random() - 0.5) * 0.24,
      vy: (Math.random() - 0.5) * 0.24,
      pulse: Math.random() > 0.9
    }));
  }
  function drawNetwork() {
    if (!canvas || !ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      if (!reducedMotion) {
        a.x += a.vx;
        a.y += a.vy;
      }
      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;
      if (pointer.active) {
        const px = a.x - pointer.x;
        const py = a.y - pointer.y;
        const pointerDistance = Math.sqrt(px * px + py * py);
        if (pointerDistance < 150) {
          const influence = 1 - pointerDistance / 150;
          if (pointerDistance > 0) {
            a.vx += (px / pointerDistance) * influence * 0.01;
            a.vy += (py / pointerDistance) * influence * 0.01;
          }
          ctx.strokeStyle = "rgba(61,220,132," + (0.38 * influence) + ")";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(a.x, a.y);
          ctx.stroke();
        }
      }
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 145) {
          ctx.strokeStyle = "rgba(34,211,238," + (0.17 * (1 - distance / 145)) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const color = a.pulse && Math.sin(frame / 36 + i) > 0.82 ? "#3ddc84" : "#22d3ee";
      ctx.fillStyle = color;
      ctx.globalAlpha = a.pulse ? 0.75 : 0.35;
      ctx.fillRect(a.x - 2, a.y - 2, a.pulse ? 5 : 4, a.pulse ? 5 : 4);
      ctx.globalAlpha = 1;
    }
    frame++;
    if (!reducedMotion) {
      window.requestAnimationFrame(drawNetwork);
    }
  }
  if (canvas && ctx) {
    resizeNetwork();
    drawNetwork();
    window.addEventListener("resize", resizeNetwork, { passive: true });
  }
  if (hero) {
    hero.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.active = true;
      if (reducedMotion) drawNetwork();
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
  }
  if (cursor && finePointer) {
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      cursor.style.left = event.clientX + "px";
      cursor.style.top = event.clientY + "px";
      cursor.classList.add("visible");
    }, { passive: true });
    document.addEventListener("pointerover", (event) => {
      if (event.target.closest("a, button, input, [role='button']")) cursor.classList.add("survol");
    }, { passive: true });
    document.addEventListener("pointerout", (event) => {
      const fromControl = event.target.closest("a, button, input, [role='button']");
      const toControl = event.relatedTarget instanceof Element && event.relatedTarget.closest("a, button, input, [role='button']");
      if (fromControl && !toControl) cursor.classList.remove("survol");
    }, { passive: true });
    window.addEventListener("blur", () => cursor.classList.remove("visible", "survol"));
  }

  // Reveal sections as they enter the viewport and keep the navigation in sync.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
  document.querySelectorAll("section.apparait, .cascade").forEach((element) => observer.observe(element));

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav nav a"));
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.hash === "#" + entry.target.id;
        link.classList.toggle("actif", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-22% 0px -62% 0px" });
  sections.forEach((section) => navObserver.observe(section));

  // A short typewriter effect matches the command-line labels in the original page.
  function typeText(element, value, speed) {
    if (!element || element.dataset.typed === "yes") return;
    element.dataset.typed = "yes";
    element.textContent = "";
    let index = 0;
    const timer = window.setInterval(() => {
      element.textContent += value.charAt(index++);
      if (index >= value.length) window.clearInterval(timer);
    }, speed || 22);
  }
  const typeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      typeObserver.unobserve(element);
      typeText(element, element.dataset.texte, element.classList.contains("cmd") ? 16 : 38);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".cmd[data-texte], .tape[data-texte]").forEach((element) => typeObserver.observe(element));

  const form = document.getElementById("terminal-form");
  const input = document.getElementById("cmd-entree");
  const screen = document.getElementById("terminal-ecran");
  const knownSections = {
    accueil: "accueil", profil: "profil", parcours: "parcours", competences: "competences",
    compétences: "competences", réalisations: "realisations", realisations: "realisations", stages: "stages",
    stage: "stages", veille: "veille", contact: "contact", outils: "outils"
  };
  const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);

  function response(text, extraClass) {
    const block = document.createElement("div");
    block.className = "reponse" + (extraClass ? " " + extraClass : "");
    const pre = document.createElement("pre");
    pre.innerHTML = text;
    block.appendChild(pre);
    screen.insertBefore(block, form);
    screen.scrollTop = screen.scrollHeight;
    return block;
  }
  function run(command) {
    const raw = command.trim();
    if (!raw) return;
    const parts = raw.split(/\s+/);
    const verb = parts[0].toLowerCase();
    const argument = parts.slice(1).join(" ");
    const line = document.createElement("p");
    line.className = "ligne";
    line.innerHTML = '<span class="prompt">ahmed@sio:~$</span> ' + escapeHTML(raw);
    if (verb === "clear") {
      screen.innerHTML = "";
      screen.appendChild(line);
      screen.appendChild(form);
      input.value = "";
      screen.scrollTop = screen.scrollHeight;
      return;
    }
    screen.insertBefore(line, form);
    input.value = "";

    if (verb === "help") {
      response("Commandes disponibles :\n  <span class=\"commande-aide\">whoami</span>         qui je suis\n  <span class=\"commande-aide\">formation</span>      mon parcours\n  <span class=\"commande-aide\">competences</span>    état des compétences du référentiel\n  <span class=\"commande-aide\">outils</span>         mes compétences techniques\n  <span class=\"commande-aide\">realisations</span>   mes réalisations\n  <span class=\"commande-aide\">stage</span>          ma recherche de stage\n  <span class=\"commande-aide\">veille</span>         ma méthode de veille\n  <span class=\"commande-aide\">contact</span>       me joindre\n  <span class=\"commande-aide\">cv</span>             ouvrir mon CV\n  <span class=\"commande-aide\">ipconfig</span>       configuration réseau\n  <span class=\"commande-aide\">ping</span>  [hôte]   tester une connexion\n  <span class=\"commande-aide\">ls</span> / <span class=\"commande-aide\">cd</span> [section]  naviguer dans la page\n  <span class=\"commande-aide\">clear</span>          effacer l'écran");
    } else if (verb === "whoami") {
      response("<b>Ahmed Bouziani</b>\nÉtudiant en BTS SIO, option SISR, au CNED.\nJe recherche un stage de 4 à 5 semaines en systèmes et réseaux.");
    } else if (verb === "formation") {
      response("BTS Services informatiques aux organisations – option SISR\nCNED · 1re année · 2026 – 2028\nL1 Mathématiques et Informatique · Université de Lille · 2024 – 2025\nL1 MPCSI · Université de Lille · 2024\nBaccalauréat STI2D · 2023");
      navigate("parcours", false);
    } else if (verb === "competences") {
      response("État des interfaces du switch SIO-SW01 :\nC1  Gérer le patrimoine informatique\nC2  Répondre aux incidents et aux demandes d'assistance et d'évolution\nC3  Développer la présence en ligne de l'organisation   <b>UP</b>\nC4  Travailler en mode projet\nC5  Mettre à disposition des utilisateurs un service informatique\nC6  Organiser son développement professionnel   <b>UP</b>");
      navigate("competences", false);
    } else if (verb === "outils") {
      response("Systèmes : Windows 11, Windows Server, Active Directory, Debian, Ubuntu, PowerShell\nRéseaux : Cisco IOS\nServices : Apache HTTP Server, MariaDB, impression, sauvegarde\nVirtualisation : VirtualBox\nGestion de parc : GLPI, OCS Inventory\nWeb : HTML, CSS, JavaScript, GitHub");
      navigate("outils", false);
    } else if (verb === "realisations" || verb === "réalisations") {
      response("R1 · Formation · Octobre 2026\nConstruction de mon identité professionnelle\nDocument : <a href=\"metier-administrateur-systemes-reseaux.pdf\">fiche métier (PDF)</a>");
      navigate("realisations", false);
    } else if (verb === "stage") {
      response("stage0 : en recherche de connexion\nStage de 4 à 5 semaines, entre mai et août, en systèmes et réseaux.");
      navigate("stages", false);
    } else if (verb === "veille") {
      response("Veille technologique :\n01 Collecter · alertes, flux RSS et sites spécialisés\n02 Vérifier · méthode QQOQCCP\n03 Classer · Pearltrees\n04 Exploiter · formation, stage et laboratoire");
      navigate("veille", false);
    } else if (verb === "contact") {
      response("mail      rami.bouziani@icloud.com\nlinkedin  linkedin.com/in/ahmed-bouziani-9917a72a2\ngithub    github.com/Ahmed-boz");
      navigate("contact", false);
    } else if (verb === "cv") {
      response("Ouverture du CV d'Ahmed Bouziani…");
      window.open("cv-ahmed-bouziani.pdf", "_blank", "noopener");
    } else if (verb === "ipconfig") {
      response("Carte Ethernet labo :\n  IPv4 . . . . . . . . . . : 192.168.10.20\n  Masque de sous-réseau . . : 255.255.255.0\n  Passerelle par défaut . . : 192.168.10.1\n  DNS . . . . . . . . . . . : serveur Active Directory");
    } else if (verb === "ping") {
      const host = argument || "objectif";
      if (host.toLowerCase() === "objectif") response("64 bytes from <b>administrateur systèmes et réseaux</b> : statut = en route");
      else response("Envoi d'une requête à <b>" + escapeHTML(host) + "</b>…\nRéponse : hôte joignable · temps = 12 ms · TTL = 64");
    } else if (verb === "ls") {
      if (argument.includes("realisations")) response("R1-identite-professionnelle.md\nmetier-administrateur-systemes-reseaux.pdf");
      else response("profil/  parcours/  competences/  realisations/  stages/  veille/  contact/");
    } else if (verb === "cd") {
      const section = argument.replace(/^\/+|\/$/g, "").replace(/^~/, "").replace(/^\//, "");
      const name = section.split("/").pop().toLowerCase();
      const target = knownSections[name];
      if (target) {
        response("Navigation vers /" + escapeHTML(name));
        navigate(target, false);
      } else if (!argument || argument === "/" || argument === "~") {
        response("Retour à l'accueil.");
        navigate("accueil", false);
      } else response("Section introuvable : " + escapeHTML(argument) + "\nTape <b>ls /</b> pour voir les sections disponibles.");
    } else {
      response("Commande inconnue : " + escapeHTML(raw) + "\nTape <b>help</b> pour afficher les commandes disponibles.");
    }
    screen.scrollTop = screen.scrollHeight;
  }
  function navigate(id, updateHash) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (updateHash) history.replaceState(null, "", "#" + id);
  }
  if (form && input && screen) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      run(input.value);
      input.focus();
    });
    screen.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      input.focus();
    });
  }

  document.querySelectorAll('.nav nav a, .logo, .btn, footer a').forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.hash && link.hash.slice(1);
      if (id) window.setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.classList.add("visible");
      }, 80);
    });
  });
})();
