

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

/* Firebase configuration */
const firebaseConfig = {
  apiKey: "AIzaSyDeFQB3iMiTr7QDwjQW1nxpEdYpfmcBRzc",
  authDomain: "kashmiri-shawl-house.firebaseapp.com",
  projectId: "kashmiri-shawl-house",
  storageBucket: "kashmiri-shawl-house.firebasestorage.app",
  messagingSenderId: "835316672741",
  appId: "1:835316672741:web:4a1010af10e8904cb54c0c",
  measurementId: "G-HT079L4276"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* Website elements */
const productGrid = document.getElementById("productGrid");
const emptyProducts = document.getElementById("emptyProducts");
const productCount = document.getElementById("productCount");
const searchInput = document.getElementById("productSearch");
const searchForm = document.getElementById("searchForm");
const filtersContainer = document.getElementById("collectionFilters");
const resetButton = document.getElementById("resetProducts");

const WHATSAPP_NUMBER = "918082460330";

let allProducts = [];
let activeFilter = "All";
let searchTerm = "";
let lightbox;
let lightboxImage;
let lightboxCategory;
let lightboxTitle;
let lightboxDescription;
let lightboxPrice;
let lightboxOrder;
let zoomed = false;

/* Helpers */
function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "Price on request";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function normalizeCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  const aliases = {
    "all shawls": "shawls",
    "pashmina collection": "shawls",
    "premium collection": "shawls",
    "winter collection": "shawls",
    "kalamkari suits": "suits",
    "suit": "suits",
    "fheran": "fheran",
    "fheran": "fheran",
    "fherans": "fheran",
    "shawl": "shawls",
    "stole": "stoles"
  };

  return aliases[value] || value;
}

function getProductCategory(product) {
  return normalizeCategory(product.category);
}

function createWhatsAppLink(product) {
  const message = [
    "Hello Kashmiri Shawl House,",
    "",
    "I am interested in:",
    product.name || "Kashmiri product",
    "Price: " + formatPrice(product.price),
    "Collection: " + (product.category || "Not specified"),
    "",
    "Please share more details."
  ].join("\n");

  return "https://wa.me/" + WHATSAPP_NUMBER +
    "?text=" + encodeURIComponent(message);
}

/* Product photo viewer */
function createLightbox() {
  lightbox = makeElement("div", "product-lightbox");
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Product details");
  lightbox.setAttribute("aria-hidden", "true");

  const closeButton = makeElement("button", "lightbox-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close product viewer");

  const content = makeElement("div", "lightbox-content");
  const imageArea = makeElement("div", "lightbox-image-area");

  lightboxImage = makeElement("img", "lightbox-image");
  lightboxImage.alt = "";

  const zoomHint = makeElement(
    "p",
    "lightbox-zoom-hint",
    "Tap the photo to zoom in or out"
  );

  imageArea.append(lightboxImage, zoomHint);

  const details = makeElement("div", "lightbox-details");
  lightboxCategory = makeElement("p", "lightbox-category");
  lightboxTitle = makeElement("h2", "");
  lightboxDescription = makeElement("p", "lightbox-description");
  lightboxPrice = makeElement("p", "lightbox-price");
  lightboxOrder = makeElement("a", "lightbox-order", "Order on WhatsApp");

  lightboxOrder.target = "_blank";
  lightboxOrder.rel = "noopener noreferrer";

  details.append(
    lightboxCategory,
    lightboxTitle,
    lightboxDescription,
    lightboxPrice,
    lightboxOrder
  );

  content.append(imageArea, details);
  lightbox.append(closeButton, content);
  document.body.append(lightbox);

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    zoomed = false;
    lightboxImage.classList.remove("is-zoomed");
  }

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  lightboxImage.addEventListener("click", () => {
    zoomed = !zoomed;
    lightboxImage.classList.toggle("is-zoomed", zoomed);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

function openLightbox(product) {
  if (!product.imageUrl) return;

  if (!lightbox) createLightbox();

  zoomed = false;
  lightboxImage.classList.remove("is-zoomed");

  lightboxImage.src = product.imageUrl;
  lightboxImage.alt = product.name || "Kashmiri product";
  lightboxCategory.textContent = product.category || "Kashmiri Collection";
  lightboxTitle.textContent = product.name || "Kashmiri Product";
  lightboxDescription.textContent =
    product.description || "Contact us on WhatsApp for more product details.";
  lightboxPrice.textContent = formatPrice(product.price);
  lightboxOrder.href = createWhatsAppLink(product);

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

/* Product card */
function createProductCard(product) {
  const card = makeElement("article", "product-card");
  const imageWrap = makeElement("div", "product-image-wrap");

  if (product.imageUrl) {
    const image = makeElement("img", "product-image");
    image.src = product.imageUrl;
    image.alt = product.name || "Kashmiri product";
    image.loading = "lazy";
    image.decoding = "async";
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", "View " + (product.name || "product"));

    image.addEventListener("click", () => openLightbox(product));
    image.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(product);
      }
    });

    image.onerror = () => {
      image.remove();
      imageWrap.classList.add("product-image-unavailable");

      if (!imageWrap.querySelector(".image-fallback")) {
        imageWrap.append(
          makeElement("span", "image-fallback", "Image unavailable")
        );
      }
    };

    imageWrap.append(image);
  } else {
    imageWrap.classList.add("product-image-unavailable");
    imageWrap.append(
      makeElement("span", "image-fallback", "Image unavailable")
    );
  }

  if (
    getProductCategory(product) === "new arrivals" ||
    product.isNew === true
  ) {
    imageWrap.append(
      makeElement("span", "product-badge", "New Arrival")
    );
  }

  const details = makeElement("div", "product-details");

  details.append(
    makeElement(
      "p",
      "product-category",
      product.category || "Kashmiri Collection"
    ),
    makeElement(
      "h3",
      "product-title",
      product.name || "Kashmiri Product"
    )
  );

  if (product.description) {
    details.append(
      makeElement("p", "product-description", product.description)
    );
  }

  details.append(
    makeElement("p", "product-price", formatPrice(product.price))
  );

  const actions = makeElement("div", "product-actions");
  const orderLink = makeElement("a", "btn product-order-btn", "Order on WhatsApp");

  orderLink.href = createWhatsAppLink(product);
  orderLink.target = "_blank";
  orderLink.rel = "noopener noreferrer";

  actions.append(orderLink);
  details.append(actions);
  card.append(imageWrap, details);

  return card;
}

/* Filtering and search */
function getFilteredProducts() {
  return allProducts.filter(product => {
    const category = getProductCategory(product);

    const matchesCategory =
      activeFilter === "All" ||
      (
        activeFilter === "New Arrivals"
          ? category === "new arrivals" || product.isNew === true
          : category === normalizeCategory(activeFilter)
      );

    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.description
    ].join(" ").toLowerCase();

    return matchesCategory && searchableText.includes(searchTerm);
  });
}

function renderProducts() {
  if (!productGrid) return;

  const products = getFilteredProducts();
  productGrid.replaceChildren();

  if (productCount) {
    productCount.textContent =
      products.length + (products.length === 1 ? " product" : " products");
  }

  if (products.length === 0) {
    productGrid.hidden = true;
    if (emptyProducts) emptyProducts.hidden = false;
    return;
  }

  productGrid.hidden = false;
  if (emptyProducts) emptyProducts.hidden = true;

  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    fragment.append(createProductCard(product));
  });

  productGrid.append(fragment);
}

function showProductMessage(message) {
  if (!productGrid) return;

  productGrid.hidden = false;
  productGrid.replaceChildren();

  const messageBox = makeElement("div", "products-loading");
  messageBox.append(makeElement("p", "", message));
  productGrid.append(messageBox);

  if (productCount) productCount.textContent = "Our collection";
  if (emptyProducts) emptyProducts.hidden = true;
}

/* Load from Firebase */
async function loadProducts() {
  showProductMessage("Discovering our collection...");

  try {
    const snapshot = await getDocs(collection(db, "Products"));

    allProducts = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    renderProducts();

    if (allProducts.length === 0) {
      showProductMessage(
        "Our collection is being prepared. Please check back soon."
      );
    }
  } catch (error) {
    console.error("Could not load products:", error);
    showProductMessage(
      "We could not load our collection right now. Please try again later."
    );
  }
}

/* Filter button states */
function selectFilter(filter) {
  activeFilter = filter;

  if (filtersContainer) {
    filtersContainer.querySelectorAll("[data-filter]").forEach(button => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  renderProducts();
}

if (filtersContainer) {
  filtersContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    selectFilter(button.dataset.filter || "All");
  });

  filtersContainer.querySelectorAll("[data-filter]").forEach(button => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.filter === "All")
    );
  });
}

/* Collection cards */
document.querySelectorAll("[data-collection-link]").forEach(link => {
  link.addEventListener("click", () => {
    const requested = link.dataset.collectionLink || "All";
    const filter = requested === "All Products" ? "All" : requested;

    const matchingButton = filtersContainer
      ? Array.from(filtersContainer.querySelectorAll("[data-filter]"))
          .find(button => button.dataset.filter === filter)
      : null;

    selectFilter(matchingButton ? filter : "All");
  });
});

/* Footer collection links */
document.querySelectorAll("[data-footer-filter]").forEach(link => {
  link.addEventListener("click", () => {
    const requested = link.dataset.footerFilter || "All";
    const matchingButton = filtersContainer
      ? Array.from(filtersContainer.querySelectorAll("[data-filter]"))
          .find(button => button.dataset.filter === requested)
      : null;

    if (matchingButton) selectFilter(requested);
  });
});

/* Search */
if (searchInput) {
  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderProducts();
  });
}

if (searchForm) {
  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    renderProducts();

    document.getElementById("featured")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

/* Reset */
if (resetButton) {
  resetButton.addEventListener("click", () => {
    searchTerm = "";
    if (searchInput) searchInput.value = "";
    selectFilter("All");
  });
}

/* Mobile navigation */
const mobileMenuButton = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

if (mobileMenuButton && mainNav) {
  mobileMenuButton.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");

    mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
    mobileMenuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      mobileMenuButton.setAttribute("aria-expanded", "false");
      mobileMenuButton.setAttribute("aria-label", "Open navigation");
    });
  });
}

/* Footer year */
const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* Start */
loadProducts();
