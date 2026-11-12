document.documentElement.classList.add("js");

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav");
const desktop = matchMedia("(min-width: 900px)");

function setMenu(open) {
  navigation.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

menuToggle.hidden = false;
menuToggle.addEventListener("click", () => setMenu(!navigation.classList.contains("is-open")));
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("is-open")) {
    setMenu(false);
    menuToggle.focus();
  }
});
desktop.addEventListener("change", () => setMenu(false));

for (const group of document.querySelectorAll("[data-accordion]")) {
  const buttons = [...group.querySelectorAll("button[aria-controls]")];

  group.addEventListener("click", (event) => {
    const selected = event.target.closest("button[aria-controls]");
    if (!buttons.includes(selected)) return;

    const opening = selected.getAttribute("aria-expanded") === "false";
    for (const button of buttons) {
      const expanded = button === selected && opening;
      button.setAttribute("aria-expanded", String(expanded));
      document.getElementById(button.getAttribute("aria-controls")).inert = !expanded;
    }
  });
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");



for (const journey of document.querySelectorAll("[data-care-journey]")) {
  const svg = journey.querySelector(".journey-path");
  const base = svg.querySelector(".journey-path-base");
  const progress = svg.querySelector(".journey-path-progress");
  const steps = [...journey.querySelectorAll(".journey-step")];
  let points = [];
  let nodeLengths = [];
  let totalLength = 0;
  let frame = 0;

  function updateJourney() {
    frame = 0;
    if (!totalLength) return;

    const target = innerHeight * .6 - journey.getBoundingClientRect().top;
    let filledLength = totalLength;
    if (!reducedMotion.matches) {
      const next = points.findIndex(point => point.y > target);
      if (next === 0) filledLength = 0;
      if (next > 0) {
        const previous = next - 1;
        const fraction = (target - points[previous].y) / (points[next].y - points[previous].y);
        filledLength = nodeLengths[previous] + fraction * (nodeLengths[next] - nodeLengths[previous]);
      }
    }
    progress.style.strokeDashoffset = totalLength - filledLength;

    const current = points.findLastIndex(point => point.y <= target);
    steps.forEach((step, index) => {
      step.classList.toggle("is-reached", reducedMotion.matches || index <= current);
      step.classList.toggle("is-current", !reducedMotion.matches && index === current);
    });
  }

  function measureJourney() {
    const bounds = journey.getBoundingClientRect();
    points = steps.map(step => {
      const marker = step.querySelector(".journey-number").getBoundingClientRect();
      const row = step.getBoundingClientRect();
      return {
        x: marker.left + marker.width / 2 - bounds.left,
        y: marker.top + marker.height / 2 - bounds.top,
        top: row.top - bounds.top,
        bottom: row.bottom - bounds.top,
      };
    });

    nodeLengths = [0];
    let path = "M " + points[0].x + " " + points[0].y;
    for (let index = 0; index < points.length - 1; index++) {
      const start = points[index];
      const end = points[index + 1];
      const direction = Math.sign(end.x - start.x);
      if (Math.abs(end.x - start.x) < 1) {
        path += " L " + end.x + " " + end.y;
        progress.setAttribute("d", path);
        nodeLengths.push(progress.getTotalLength());
        continue;
      }

      const middleY = (start.bottom + end.top) / 2;
      const radius = Math.min(32, Math.abs(end.x - start.x) / 2);
      path += " L " + start.x + " " + (middleY - radius);
      path += " Q " + start.x + " " + middleY + " " + (start.x + direction * radius) + " " + middleY;
      path += " L " + (end.x - direction * radius) + " " + middleY;
      path += " Q " + end.x + " " + middleY + " " + end.x + " " + (middleY + radius);
      path += " L " + end.x + " " + end.y;
      progress.setAttribute("d", path);
      nodeLengths.push(progress.getTotalLength());
    }

    svg.setAttribute("viewBox", "0 0 " + bounds.width + " " + bounds.height);
    base.setAttribute("d", path);
    progress.setAttribute("d", path);
    totalLength = progress.getTotalLength();
    progress.style.strokeDasharray = totalLength + " " + totalLength;
    updateJourney();
  }

  function scheduleJourneyUpdate() {
    if (!frame) frame = requestAnimationFrame(updateJourney);
  }

  new ResizeObserver(measureJourney).observe(journey);
  addEventListener("scroll", scheduleJourneyUpdate, { passive: true });
  addEventListener("resize", scheduleJourneyUpdate);
  reducedMotion.addEventListener("change", scheduleJourneyUpdate);
  document.fonts.ready.then(measureJourney);
  measureJourney();
}

for (const carousel of document.querySelectorAll("[data-concern-carousel]")) {
  const track = carousel.querySelector(".concerns-track");
  const cards = [...track.querySelectorAll(".concern-card")];
  const controls = carousel.querySelector(".concerns-controls");
  const counter = controls.querySelector("[data-count]");
  const previous = controls.querySelector("[data-prev]");
  const next = controls.querySelector("[data-next]");

  let active = 0;
  let destination = null;
  let scrollTimer;
  let previousWidth = 0;

  function layout() {
    const visible = Number(getComputedStyle(track).getPropertyValue("--cards-visible"));
    return {
      visible,
      last: Math.max(0, cards.length - visible),
      stride: cards[1].offsetLeft - cards[0].offsetLeft,
    };
  }

  function showPosition(index) {
    const { visible, last } = layout();
    active = Math.max(0, Math.min(index, last));
    const target = destination ?? active;
    previous.disabled = target === 0;
    next.disabled = target === last;
    const first = String(active + 1).padStart(2, "0");
    const end = String(Math.min(active + visible, cards.length)).padStart(2, "0");
    const total = String(cards.length).padStart(2, "0");
    const position = visible === 1 ? first : first + "–" + end;
    counter.textContent = position + " / " + total;
  }

  function goTo(index) {
    const { last, stride } = layout();
    destination = Math.max(0, Math.min(index, last));
    showPosition(active);
    track.scrollTo({
      left: destination * stride,
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }

  previous.addEventListener("click", () => goTo((destination ?? active) - 1));
  next.addEventListener("click", () => goTo((destination ?? active) + 1));

  track.addEventListener("keydown", (event) => {
    const targets = {
      ArrowLeft: (destination ?? active) - 1,
      ArrowRight: (destination ?? active) + 1,
      Home: 0,
      End: layout().last,
    };
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      goTo(targets[event.key]);
    }
  });

  track.addEventListener("pointerdown", () => {
    destination = null;
  }, { passive: true });

  track.addEventListener("scroll", () => {
    const index = Math.round(track.scrollLeft / layout().stride);
    if (index !== active) showPosition(index);
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      destination = null;
      showPosition(Math.round(track.scrollLeft / layout().stride));
    }, 130);
  }, { passive: true });

  new ResizeObserver(() => {
    if (track.clientWidth === previousWidth) return;
    previousWidth = track.clientWidth;
    const { last, stride } = layout();
    active = Math.min(destination ?? active, last);
    destination = null;
    track.scrollTo({ left: active * stride, behavior: "instant" });
    showPosition(active);
  }).observe(track);

  controls.hidden = false;
  showPosition(active);
}

for (const gallery of document.querySelectorAll("[data-gallery]")) {
  const track = gallery.querySelector(".gallery-track");
  const slides = [...gallery.querySelectorAll(".gallery-slide")];
  const controls = gallery.querySelector(".gallery-controls");
  const dots = gallery.querySelector("[data-dots]");
  const counter = gallery.querySelector("[data-count]");
  const previous = gallery.querySelector("[data-prev]");
  const next = gallery.querySelector("[data-next]");

  let active = 0;
  let destination = null;
  let scrollTimer;
  const last = slides.length - 1;

  function showPosition(index) {
    active = index;
    const displayedIndex = destination ?? index;
    previous.disabled = displayedIndex === 0;
    next.disabled = displayedIndex === last;
    for (const [dotIndex, dot] of [...dots.children].entries()) {
      dot.setAttribute("aria-current", String(dotIndex === index));
    }
    const position = `${index + 1} / ${slides.length}`;
    if (counter.textContent !== position) counter.textContent = position;
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(index, last));
    if (target === (destination ?? active)) return;
    destination = target;
    showPosition(active);
    track.scrollTo({
      left: slides[target].offsetLeft - slides[0].offsetLeft,
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }

  for (const [index, slide] of slides.entries()) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Foto ${index + 1}: ${slide.querySelector("figcaption").textContent}`);
    dot.setAttribute("aria-controls", track.id);
    dot.addEventListener("click", () => goTo(index));
    dots.append(dot);
  }

  function readPosition() {
    return Math.max(0, Math.min(last, Math.round(track.scrollLeft / track.clientWidth)));
  }

  track.addEventListener("scroll", () => {
    const index = readPosition();
    if (index !== active) showPosition(index);
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      destination = null;
      showPosition(readPosition());
    }, 130);
  }, { passive: true });

  track.addEventListener("pointerdown", () => {
    destination = null;
  }, { passive: true });

  previous.addEventListener("click", () => goTo((destination ?? active) - 1));
  next.addEventListener("click", () => goTo((destination ?? active) + 1));
  track.addEventListener("keydown", (event) => {
    const index = destination ?? active;
    const targets = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last };
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      goTo(targets[event.key]);
    }
  });

  controls.hidden = false;
  showPosition(active);
}
