import { photos } from "./photos.js";

const collections = [
  { id: "food", label: "Food" },
  { id: "graduation-2025", label: "Graduation 2025" },
  { id: "nature", label: "Nature" },
  { id: "photography-class", label: "Photography class" },
  { id: "randoms", label: "Randoms" },
  { id: "travel", label: "Travel" },
];
const grid = document.querySelector("#photo-grid");
const emptyMessage = document.querySelector("#gallery-empty");
const filterList = document.querySelector("#filter-list");
const galleryMore = document.querySelector("#gallery-more");
const lightbox = document.querySelector("#lightbox");
let activeFilter = "all";
let visiblePhotos = [];
let currentPhotoIndex = 0;
let displayLimit = 24;

function getFilteredPhotos() {
  if (activeFilter === "all") return photos;
  return photos.filter((photo) => photo.category === activeFilter);
}

function renderFilters() {
  const filters = [{ id: "all", label: "All photos" }, ...collections];
  filterList.replaceChildren();

  filters.forEach(({ id, label }) => {
    const count = id === "all"
      ? photos.length
      : photos.filter((photo) => photo.category === id).length;
    const button = document.createElement("button");
    button.className = `filter-button${activeFilter === id ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.filter = id;
    button.setAttribute("aria-pressed", String(activeFilter === id));
    button.append(document.createTextNode(label));

    const countLabel = document.createElement("span");
    countLabel.textContent = String(count).padStart(2, "0");
    button.append(countLabel);
    filterList.append(button);
  });
}

function renderGallery() {
  visiblePhotos = getFilteredPhotos();
  grid.replaceChildren();
  emptyMessage.hidden = visiblePhotos.length > 0;

  visiblePhotos.slice(0, displayLimit).forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = `photo-card photo-${photo.shape || "square"}`;
    card.dataset.category = photo.category;

    const button = document.createElement("button");
    button.className = "photo-button";
    button.type = "button";
    button.setAttribute("aria-label", `View ${photo.title} from ${photo.location}`);

    const image = document.createElement("img");
    image.src = photo.image;
    image.alt = photo.alt;
    image.loading = "lazy";
    image.decoding = "async";
    button.append(image);

    const overlay = document.createElement("span");
    overlay.className = "photo-overlay";
    const caption = document.createElement("span");
    caption.className = "photo-caption";
    const title = document.createElement("strong");
    title.textContent = photo.title;
    const location = document.createElement("span");
    location.textContent = photo.location;
    caption.append(title, location);
    const arrow = document.createElement("span");
    arrow.className = "photo-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    overlay.append(caption, arrow);
    button.append(overlay);
    button.addEventListener("click", () => openLightbox(index));
    card.append(button);
    grid.append(card);
  });

  const remaining = visiblePhotos.length - displayLimit;
  galleryMore.hidden = remaining <= 0;
  if (remaining > 0) {
    galleryMore.textContent = `Load ${Math.min(24, remaining)} more photos · ${remaining} remaining`;
  }
}

function updateFilter(filter) {
  activeFilter = filter;
  displayLimit = 24;
  document.querySelectorAll(".filter-button").forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderGallery();
}

function showLightboxPhoto() {
  const photo = visiblePhotos[currentPhotoIndex];
  if (!photo) return;
  const image = document.querySelector("#lightbox-image");
  image.src = photo.image;
  image.alt = photo.alt;
  document.querySelector("#lightbox-caption").textContent = `${photo.title} · ${photo.location}`;
  document.querySelector("#lightbox-count").textContent =
    `${String(currentPhotoIndex + 1).padStart(2, "0")} / ${String(visiblePhotos.length).padStart(2, "0")}`;
}

function openLightbox(index) {
  currentPhotoIndex = index;
  showLightboxPhoto();
  lightbox.showModal();
}

function moveLightbox(direction) {
  currentPhotoIndex = (currentPhotoIndex + direction + visiblePhotos.length) % visiblePhotos.length;
  showLightboxPhoto();
}

filterList.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-button");
  if (button) updateFilter(button.dataset.filter);
});

galleryMore.addEventListener("click", () => {
  displayLimit = Math.min(displayLimit + 24, visiblePhotos.length);
  renderGallery();
});

document.querySelector(".menu-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isExpanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isExpanded));
  button.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  document.querySelector(".primary-nav").classList.toggle("is-open", !isExpanded);
});

document.querySelectorAll(".primary-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    document.querySelector(".primary-nav").classList.remove("is-open");
  });
});

document.querySelector("[data-close-lightbox]").addEventListener("click", () => lightbox.close());
document.querySelector(".lightbox-prev").addEventListener("click", () => moveLightbox(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => moveLightbox(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

document.querySelector("#year").textContent = String(new Date().getFullYear());
document.querySelector(".image-index").textContent =
  `01 / ${String(photos.length).padStart(2, "0")}`;
renderFilters();
renderGallery();
