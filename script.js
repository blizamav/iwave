const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealTargets = document.querySelectorAll("[data-reveal]");
const canvas = document.querySelector(".data-canvas");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  });
}

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.14,
    rootMargin: "0px 0px -48px 0px",
  }
);

revealTargets.forEach((element) => revealObserver.observe(element));

if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const context = canvas.getContext("2d");
  const nodes = [];
  const nodeCount = Math.min(72, Math.max(36, Math.floor(window.innerWidth / 18)));
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const setCanvasSize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  const createNodes = () => {
    nodes.length = 0;

    for (let index = 0; index < nodeCount; index += 1) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.46,
        vy: (Math.random() - 0.5) * 0.46,
        radius: Math.random() * 1.8 + 1.1,
      });
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);

    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > width) {
        node.vx *= -1;
      }

      if (node.y < 0 || node.y > height) {
        node.vy *= -1;
      }

      context.beginPath();
      context.fillStyle = "rgba(121, 215, 255, 0.8)";
      context.shadowColor = "rgba(30, 144, 255, 0.35)";
      context.shadowBlur = 12;
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();

      for (let innerIndex = index + 1; innerIndex < nodes.length; innerIndex += 1) {
        const target = nodes[innerIndex];
        const dx = node.x - target.x;
        const dy = node.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 170) {
          continue;
        }

        context.beginPath();
        context.shadowBlur = 0;
        context.strokeStyle = `rgba(121, 215, 255, ${0.2 - distance / 1000})`;
        context.lineWidth = 1;
        context.moveTo(node.x, node.y);
        context.lineTo(target.x, target.y);
        context.stroke();
      }
    }

    animationFrame = window.requestAnimationFrame(draw);
  };

  const initialize = () => {
    setCanvasSize();
    createNodes();
    window.cancelAnimationFrame(animationFrame);
    draw();
  };

  initialize();
  window.addEventListener("resize", initialize);
}
