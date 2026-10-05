import { photos as featuredPhotos } from "./photos.js";

const databaseName = "alex-morgan-photo-library";
const storeName = "photos";
const collections = [
  { id: "food", label: "Food" },
  { id: "graduation-2025", label: "Graduation 2025" },
  { id: "nature", label: "Nature" },
  { id: "photography-class", label: "Photography class" },
  { id: "randoms", label: "Randoms" },
  { id: "travel", label: "Travel" },
  { id: "my-uploads", label: "My uploads" },
];
const grid = document.querySelector("#photo-grid");
const emptyMessage = document.querySelector("#gallery-empty");
const filterList = document.querySelector("#filter-list");
const galleryMore = document.querySelector("#gallery-more");
const lightbox = document.querySelector("#lightbox");
const uploader = document.querySelector("#upload-dialog");
const uploadStatus = document.querySelector("#upload-status");
const uploadedList = document.querySelector("#uploaded-list");
const photoInput = document.querySelector("#photo-input");
const libraryInput = document.querySelector("#library-input");
const photoCategory = document.querySelector("#photo-category");
let activeFilter = "all";
let currentPhotos = [];
let visiblePhotos = [];
let currentPhotoIndex = 0;
let displayLimit = 24;
let databasePromise;

function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("This browser does not support local photo storage."));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the photo library."));
  });
  return databasePromise;
}

async function readUploadedPhotos() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not read the photo library."));
  });
}

async function storePhotos(photos) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    photos.forEach((photo) => store.put(photo));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the photos."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Saving the photos was cancelled."));
  });
}

async function removePhoto(id) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove the photo."));
  });
}

function showError(error) {
  uploadStatus.textContent = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  uploadStatus.classList.add("is-error");
}

function getFilteredPhotos() {
  if (activeFilter === "all") return currentPhotos;
  if (activeFilter === "my-uploads") return currentPhotos.filter((photo) => photo.uploaded);
  return currentPhotos.filter((photo) => photo.category === activeFilter);
}

function renderFilters() {
  const filters = [{ id: "all", label: "All photos" }, ...collections];
  filterList.replaceChildren();

  filters.forEach(({ id, label }) => {
    const count = id === "all"
      ? currentPhotos.length
      : getCollectionPhotos(id).length;
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

function getCollectionPhotos(collectionId) {
  if (collectionId === "my-uploads") return currentPhotos.filter((photo) => photo.uploaded);
  return currentPhotos.filter((photo) => photo.category === collectionId);
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

  galleryMore.hidden = visiblePhotos.length <= displayLimit;
  if (!galleryMore.hidden) {
    const remaining = visiblePhotos.length - displayLimit;
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function safeTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "New photograph";
}

function renderUploadedList(photos) {
  uploadedList.replaceChildren();
  if (!photos.length) return;

  const heading = document.createElement("p");
  heading.className = "uploaded-heading";
  heading.textContent = `In this browser · ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`;
  uploadedList.append(heading);

  photos.forEach((photo) => {
    const row = document.createElement("div");
    row.className = "uploaded-row";
    const name = document.createElement("span");
    name.textContent = photo.title;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${photo.title}`);
    remove.addEventListener("click", async () => {
      try {
        await removePhoto(photo.id);
        await refreshGallery();
        renderUploadedList(await readUploadedPhotos());
        uploadStatus.classList.remove("is-error");
        uploadStatus.textContent = `${photo.title} removed.`;
      } catch (error) {
        showError(error);
      }
    });
    row.append(name, remove);
    uploadedList.append(row);
  });
}

async function refreshGallery() {
  const uploadedPhotos = await readUploadedPhotos();
  currentPhotos = [...featuredPhotos, ...uploadedPhotos];
  document.querySelector(".image-index").textContent =
    `01 / ${String(featuredPhotos.length).padStart(2, "0")}`;
  renderFilters();
  renderGallery();
}

async function addImageFiles(files) {
  const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (!images.length) {
    showError(new Error("Choose one or more image files to add."));
    return;
  }
  try {
    uploadStatus.classList.remove("is-error");
    uploadStatus.textContent = `Adding ${images.length} ${images.length === 1 ? "photo" : "photos"}…`;
    const uploads = await Promise.all(images.map(async (file) => ({
      id: `upload-${crypto.randomUUID()}`,
      title: safeTitle(file.name),
      category: photoCategory.value,
      location: "Your collection",
      image: await fileToDataUrl(file),
      alt: safeTitle(file.name),
      shape: "square",
      uploaded: true,
    })));
    await storePhotos(uploads);
    await refreshGallery();
    renderUploadedList(await readUploadedPhotos());
    const collectionLabel = collections.find(({ id }) => id === photoCategory.value)?.label ?? "My uploads";
    uploadStatus.textContent = `${uploads.length} ${uploads.length === 1 ? "photo" : "photos"} added to ${collectionLabel}.`;
    photoInput.value = "";
  } catch (error) {
    showError(error);
  }
}

function downloadLibrary(photos) {
  const blob = new Blob([JSON.stringify({ version: 1, photos }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "daren-bryan-photo-library.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importLibrary(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.version !== 1 || !Array.isArray(data.photos)) {
      throw new Error("This file is not a supported photo library export.");
    }
    const validPhotos = data.photos.filter((photo) =>
      photo &&
      typeof photo.id === "string" &&
      typeof photo.title === "string" &&
      typeof photo.image === "string" &&
      photo.image.startsWith("data:image/"),
    );
    if (!validPhotos.length && data.photos.length) {
      throw new Error("No valid photos were found in this library.");
    }
    await storePhotos(validPhotos);
    await refreshGallery();
    renderUploadedList(await readUploadedPhotos());
    uploadStatus.classList.remove("is-error");
    uploadStatus.textContent = `${validPhotos.length} ${validPhotos.length === 1 ? "photo" : "photos"} imported.`;
  } catch (error) {
    showError(error);
  } finally {
    libraryInput.value = "";
  }
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

document.querySelector("#open-uploader").addEventListener("click", async () => {
  uploadStatus.textContent = "";
  uploadStatus.classList.remove("is-error");
  try {
    renderUploadedList(await readUploadedPhotos());
    uploader.showModal();
  } catch (error) {
    showError(error);
    uploader.showModal();
  }
});

document.querySelector("[data-close-upload]").addEventListener("click", () => uploader.close());
document.querySelector("[data-close-lightbox]").addEventListener("click", () => lightbox.close());
document.querySelector(".lightbox-prev").addEventListener("click", () => moveLightbox(-1));
document.querySelector(".lightbox-next").addEventListener("click", () => moveLightbox(1));
photoInput.addEventListener("change", (event) => addImageFiles(event.currentTarget.files));
document.querySelector("#import-library").addEventListener("click", () => libraryInput.click());
libraryInput.addEventListener("change", (event) => {
  const [file] = event.currentTarget.files;
  if (file) importLibrary(file);
});

document.querySelector("#export-library").addEventListener("click", async () => {
  try {
    const photos = await readUploadedPhotos();
    if (!photos.length) {
      uploadStatus.classList.remove("is-error");
      uploadStatus.textContent = "Add a photo first to export your library.";
      return;
    }
    downloadLibrary(photos);
    uploadStatus.classList.remove("is-error");
    uploadStatus.textContent = "Your photo library was exported.";
  } catch (error) {
    showError(error);
  }
});

const dropZone = document.querySelector("#drop-zone");
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragging"));
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  addImageFiles(event.dataTransfer.files);
});

document.querySelector(".lightbox").addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
document.querySelector(".upload-dialog").addEventListener("click", (event) => {
  if (event.target === uploader) uploader.close();
});
document.addEventListener("keydown", (event) => {
  if (!lightbox.open) return;
  if (event.key === "ArrowLeft") moveLightbox(-1);
  if (event.key === "ArrowRight") moveLightbox(1);
});

document.querySelector("#year").textContent = String(new Date().getFullYear());
refreshGallery().catch(showError);
