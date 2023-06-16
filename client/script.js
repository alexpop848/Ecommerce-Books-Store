import { getItems } from "./api";
import { purchaseItem } from "./api";
import { downloadItem } from "./api";
import { downloadAll } from "./api";
import addGlobalEventListener from "./addGlobalEventListener.js";
import { isItemInCart } from "./shoppingCart.js";
import { setupShoppingCart } from "./shoppingCart.js";
import { addToCart } from "./shoppingCart";
import items from "../server/items.json";

const itemTemplate = document.getElementById("item-template");
const itemList = document.querySelector("[data-item-list]");
const emailForm = document.querySelector("[data-email-form]");
const emailInput = document.querySelector("[data-email-input]");
const categoryTitles = document.getElementsByClassName("category-title");
const categoryTitlesArray = [...categoryTitles];

// Intro section animations
const tl = gsap.timeline({
  defaults: { duration: 0.75, ease: "Power3.easeOut" },
});

tl.fromTo(
  ".hero-img",
  { scale: 1.25, borderRadius: "0rem" },
  {
    scale: 1,
    borderRadius: "2rem",
    delay: 0.35,
    duration: 2.5,
    ease: "elastic.out(1.5,1)",
  }
);

tl.fromTo(".cta1", { x: "100%", opacity: 0.5 }, { x: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta3", { x: "-100%", opacity: 0.5 }, { x: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta2", { y: "100%", opacity: 0.5 }, { y: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta4", { x: "100%", opacity: 0.5 }, { x: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta6", { x: "-100%", opacity: 0.5 }, { x: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta5", { y: "100%", opacity: 0.5 }, { y: 0, opacity: 1 }, "<20%");
tl.fromTo(".cta-btn", { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, "<");

const browseBtn = document.querySelector(".cta-btn");
const logo = document.querySelector(".logo");
const letters = logo.textContent.split("");

browseBtn.addEventListener("click", () => {
  const tl = gsap.timeline({
    defaults: { duration: 1.5, ease: "Power3.easeOut" },
  });

  tl.fromTo(
    ".item-list",
    { y: "100%", opacity: 0.5 },
    { y: 0, opacity: 1 },
    "<20%"
  );
});

logo.textContent = "";

letters.forEach((letter) => {
  logo.innerHTML += '<span class="letter">' + letter + "</span>";
});
gsap.set(".letter", { display: "inline-block" });
gsap.fromTo(
  ".letter",
  { y: "100%" },
  { y: 0, delay: 2, stagger: 0.05, ease: "back.out(2)" }
);

// Adding categories
categoryTitlesArray.forEach((categoryTitle) => {
  categoryTitle.addEventListener("click", () => {
    const clickedCategory = categoryTitle.innerText;

    categoryTitlesArray.forEach((title) => {
      title.querySelector(".line").classList.remove("active");
      title.querySelector(".name").classList.remove("active");
    });

    const lineDiv = categoryTitle.querySelector(".line");
    const list = categoryTitle.querySelector(".name");
    lineDiv.classList.add("active");
    list.classList.add("active");

    //Items transition
    const tl = gsap.timeline({
      defaults: { duration: 0.75, ease: "Power3.easeOut" },
    });

    tl.fromTo(
      ".item-list",
      { y: "100%", opacity: 0.5 },
      { y: 0, opacity: 1 },
      "<20%"
    );
    itemList.innerHTML = ""; // Clear the item list before loading new items
    
    items.forEach(item => {
      if (item.category === clickedCategory || clickedCategory === "All") {
        const itemElementClone = itemTemplate.content.cloneNode(true);
        itemElementClone.querySelector("[data-item-name]").textContent = item.name;

        itemElementClone.querySelector("[data-item-author]").textContent = item.author;
       
          
        itemElementClone.querySelector("[data-item-description]").textContent = item.description;
      

        const detailsBTN = itemElementClone.querySelector("[data-details-btn]");
        detailsBTN.textContent = "Details";

        detailsBTN.addEventListener("click", () => {
          const modalImage = document.querySelector("[data-modal-image]");
          const modalName = document.querySelector("[data-modal-name]");
          const modalDescription = document.querySelector(
            "[data-modal-description]"
          );
          const modalAuthor = document.querySelector("[data-modal-author]");
          modalImage.src = item.img || "";
          modalName.textContent = item.name;
          modalDescription.textContent = item.description;
          modalAuthor.textContent = item.author;
          

          const modalContainer = document.querySelector(
            "[data-modal-container]"
          );
          modalContainer.classList.add("show");
        });

        const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
        modalCloseBtn.addEventListener("click", () => {
          const modalContainer = document.querySelector(
            "[data-modal-container]"
          );
          modalContainer.classList.remove("show");
        });

        const priceE = itemElementClone.querySelector("[data-item-price]");
        priceE.textContent = `$${item.priceInCents / 1000}`;

        const container = itemElementClone.querySelector("[data-store-item]");
        container.setAttribute("data-item-id", item.id);
        const imageElement =
          itemElementClone.querySelector("[data-item-image]");
        if (item.img) {
          const imgElement = document.createElement("img");
          imgElement.src = item.img;
          imgElement.alt = "Item Image";
          imageElement.appendChild(imgElement);
        } else {
          imageElement.textContent = "No Image Available";
        }

        const addButton = itemElementClone.querySelector(
          "[data-add-to-cart-btn]"
        );
        if (isItemInCart(item.id)) {
          addButton.classList.add("active");
        } else {
          addButton.classList.remove("active");
        }

        const button = itemElementClone.querySelector("[data-item-btn]");
        if (item.purchased) {
          button.classList.add("download-btn");
          button.innerHTML =
            '<span class="material-symbols-outlined">download</span>';
          button.addEventListener("click", () => {
            downloadItem(item.id);
          });
        } else {
          button.classList.add("purchase-btn");
          button.innerHTML =
            '<span class="material-symbols-outlined">payments</span>';
          button.addEventListener("click", () => {
            purchaseItem(item.id);
          });
        }
        itemList.appendChild(itemElementClone);
      }
    });
  });
});

setupShoppingCart();

emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await downloadAll(emailInput.value);
  window.location = window.location;
});

// Render items to page
async function loadItems() {
  const items = await getItems();

  addGlobalEventListener("click", "[data-add-to-cart-btn]", (e) => {
    const id = e.target.closest("[data-store-item]").dataset.itemId;
    addToCart(parseInt(id));
    e.target.classList.add("active");
  });

  itemList.innerHTML = "";
  items.forEach((item) => {
    const itemElementClone = itemTemplate.content.cloneNode(true);
    itemElementClone.querySelector("[data-item-name]").textContent = item.name;

    itemElementClone.querySelector("[data-item-category]").textContent =
      item.category;

    itemElementClone.querySelector("[data-item-author]").textContent =
      item.author;
    itemElementClone.querySelector("[data-item-description]").textContent =
      item.description;

    const container = itemElementClone.querySelector("[data-store-item]");
    container.setAttribute("data-item-id", item.id);
    const imageElement = itemElementClone.querySelector("[data-item-image]");
    if (item.imageUrl) {
      const imgElement = document.createElement("img");
      imgElement.src = item.imageUrl;
      imgElement.alt = "Item Image";
      imageElement.appendChild(imgElement);
    } else {
      imageElement.textContent = "No Image Available";
    }

    const priceElement = itemElementClone.querySelector("[data-item-price]");
    priceElement.textContent = `$${item.price}`;

    const detailsBTN = itemElementClone.querySelector("[data-details-btn]");
    detailsBTN.textContent = "Details";

    const addButton = itemElementClone.querySelector("[data-add-to-cart-btn]");
    if (isItemInCart(item.id)) {
      addButton.classList.add("active");
    } else {
      addButton.classList.remove("active");
    }

    const button = itemElementClone.querySelector("[data-item-btn]");
    if (item.purchased) {
      button.classList.add("download-btn");
      button.innerHTML =
        '<span class="material-symbols-outlined">download</span>';
      button.addEventListener("click", () => {
        downloadItem(item.id);
      });
    } else {
      button.classList.add("purchase-btn");
      button.innerHTML =
        '<span class="material-symbols-outlined">payments</span>';
      button.addEventListener("click", () => {
        purchaseItem(item.id);
      });
    }

    detailsBTN.addEventListener("click", () => {
      console.log(item);

      const modalImage = document.querySelector("[data-modal-image]");
      const modalName = document.querySelector("[data-modal-name]");
      const modalDescription = document.querySelector(
        "[data-modal-description]"
      );
      const modalAuthor = document.querySelector("[data-modal-author]");
      modalImage.src = item.imageUrl || "";
      modalName.textContent = item.name;
      modalDescription.textContent = item.description;
      modalAuthor.textContent = `Author: ${item.author}`;

      const modalContainer = document.querySelector("[data-modal-container]");
      modalContainer.classList.add("show");
    });

    const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
    modalCloseBtn.addEventListener("click", () => {
      const modalContainer = document.querySelector("[data-modal-container]");
      modalContainer.classList.remove("show");
    });
    itemList.appendChild(itemElementClone);
  });
}
loadItems();
