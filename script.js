
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

let allProducts = [];
let activeFilter = "All";
let searchTerm = "";

/* Change this to your actual WhatsApp number.
   Include country code, without +, spaces or dashes. */
const WHATSAPP_NUMBER = "919888000000";

/* Safe text helper */
function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

/* Format price in Indian Rupees */
function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return "Price on request";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

/* Normalize category names for filtering */
function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

/* WhatsApp order link */
function createWhatsAppLink(product) {
  const message = [
    "Hello Kashmiri Shawl House,",
    "",
    "I am interested in this product:",
    product.name || "Kashmiri product",
    "Price: " + formatPrice(product.price),
    "Collection: " + (product.category || "Not specified"),
    "",
    "Please share more details."
  ].join("\n");

  return "https://wa.me/" + WHATSAPP_NUMBER +
    "?text=" + encodeURIComponent(message);
}

/* Render one product card */
function createProductCard(product) {
  const card = makeElement("article", "product-card");
  const imageWrap = makeElement("div", "product-image-wrap");

  if (product.imageUrl) {
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = product.imageUrl;
    image.alt = product.name || "Kashmiri shawl";
    image.loading = "lazy";
    image.decoding = "async";

    image.onerror = () => {
      image.remove();
      imageWrap.classList.add("product-image-unavailable");

      if (!imageWrap.querySelector(".image-fallback")) {
        imageWrap.append(
          makeElement(
            "span",
            "image-fallback",
            "Kashmiri Shawl House"
          )
        );
      }
    };

    imageWrap.append(image);
  } else {
    imageWrap.classList.add("product-image-unavailable");
    imageWrap.append(
      makeElement(
        "span",
        "image-fallback",
        "Kashmiri Shawl House"
      )
    );
  }

  if (
    normalizeCategory(product.category) === "new arrivals" ||
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
      makeElement(
        "p",
        "product-description",
        product.description
      )
    );
  }

  details.append(
    makeElement("p", "product-price", formatPrice(product.price))
  );

  const actions = makeElement("div", "product-actions");
  const orderLink = document.createElement("a");

  orderLink.className = "btn product-order-btn";
  orderLink.href = createWhatsAppLink(product);
  orderLink.target = "_blank";
  orderLink.rel = "noopener noreferrer";
  orderLink.textContent = "Order on WhatsApp";

  actions.append(orderLink);
  details.append(actions);
  card.append(imageWrap, details);

  return card;
}

/* Filter products by collection and search */
function getFilteredProducts() {
  return allProducts.filter(product => {
    const category = normalizeCategory(product.category);

    const matchesCategory =
      activeFilter === "All" ||
      category === normalizeCategory(activeFilter);

    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.description
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}

/* Display matching products */
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

    if (emptyProducts) {
      emptyProducts.hidden = false;
    }

    return;
  }

  productGrid.hidden = false;

  if (emptyProducts) {
    emptyProducts.hidden = true;
  }

  const fragment = document.createDocumentFragment();

  products.forEach(product => {
    fragment.append(createProductCard(product));
  });

  productGrid.append(fragment);
}

/* Show loading/error message */
function showProductMessage(message) {
  if (!productGrid) return;

  productGrid.hidden = false;
  productGrid.replaceChildren();

  const messageBox = makeElement("div", "products-loading");
  messageBox.append(makeElement("p", "", message));
  productGrid.append(messageBox);

  if (productCount) {
    productCount.textContent = "Our collection";
  }

  if (emptyProducts) {
    emptyProducts.hidden = true;
  }
}

/* Load products from Firestore */
async function loadProducts() {
  showProductMessage("Discovering our collection...");

  try {
    const snapshot = await getDocs(collection(db, "Products"));

    allProducts = snapshot.docs.map(documentSnapshot => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
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

    searchTerm = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    renderProducts();

    document.getElementById("featured")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

/* Collection filter buttons */
if (filtersContainer) {
  filtersContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");

    if (!button) return;

    activeFilter = button.dataset.filter || "All";

    filtersContainer.querySelectorAll("[data-filter]").forEach(filterButton => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderProducts();
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
    activeFilter = link.dataset.collectionLink || "All";

    const matchingButton = filtersContainer
      ? Array.from(filtersContainer.querySelectorAll("[data-filter]"))
          .find(button => button.dataset.filter === activeFilter)
      : null;

    if (matchingButton) {
      matchingButton.click();
    } else {
      activeFilter = "All";

      filtersContainer?.querySelectorAll("[data-filter]").forEach(button => {
        const isActive = button.dataset.filter === "All";
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      renderProducts();
    }
  });
});

/* Footer collection links */
document.querySelectorAll("[data-footer-filter]").forEach(link => {
  link.addEventListener("click", () => {
    const requestedFilter = link.dataset.footerFilter || "All";

    const matchingButton = filtersContainer
      ? Array.from(filtersContainer.querySelectorAll("[data-filter]"))
          .find(button => button.dataset.filter === requestedFilter)
      : null;

    if (matchingButton) {
      matchingButton.click();
    }
  });
});

/* Reset products button */
if (resetButton) {
  resetButton.addEventListener("click", () => {
    activeFilter = "All";
    searchTerm = "";

    if (searchInput) {
      searchInput.value = "";
    }

    if (filtersContainer) {
      filtersContainer.querySelectorAll("[data-filter]").forEach(button => {
        const isActive = button.dataset.filter === "All";
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }

    renderProducts();
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

/* Current year */
const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* Start website */
loadProducts();

