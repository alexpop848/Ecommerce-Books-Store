import items from '../server/items.json'
import addGlobalEventListener from "./addGlobalEventListener.js"

const cartButton = document.querySelector("[data-cart-button]")
const cartItemsWrapper = document.querySelector("[data-cart-items-wrapper]")
const cartItemTemplate = document.querySelector("#cart-item-template")
const cartItemContainer = document.querySelector("[data-cart-items]")
const cartItemsQuantity = document.querySelector("[cart-items-quantity]")
const cartTotal = document.querySelector("[data-cart-total]")
const cart = document.querySelector("[data-cart]")
const SESSION_STORAGE_KEY = 'SHOPPING_CART-cart'
let shoppingCart = loadCart()


// Remove items from cart when delete button is clicked 
export function setupShoppingCart() {
    addGlobalEventListener("click", '[data-remove-from-cart-button]', (e) => {
        const id = parseInt(e.target.closest("[data-item]").dataset.itemId)
        removeFromCart(id)
    })
    renderCart()
}

export function isItemInCart(id) {
    return shoppingCart.some(entry => entry.id === id);
}


// Save Cart Items to Local Storage
function saveCart() {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(shoppingCart))
}

function loadCart() {
    const cart = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return JSON.parse(cart) || []
}

// Show/Hide Cart Items
cartButton.addEventListener('click', () => {
    cartItemsWrapper.classList.toggle('invisible')
})

// Add items to Cart
export function addToCart(id) {
    const existingItem = shoppingCart.find(entry => entry.id === id)
    if (existingItem) {
        existingItem.quantity++
    } else {
        shoppingCart.push({ id: id, quantity: 1 })
    }
    renderCart()
    saveCart()
}

// Remove items from Cart
function removeFromCart(id) {
    const existingItem = shoppingCart.find(entry => entry.id === id)
    if (existingItem == null) return
    shoppingCart = shoppingCart.filter(entry => entry.id !== id)
    renderCart()
    saveCart()
}

// Display Cart Icon only if there are items in the Cart
function renderCart() {
    if (shoppingCart.length === 0) {
        hideCart()
    } else {
        showCart()
        renderCartItems()
    }
}

function hideCart() {
    cart.classList.add("invisible")
    cartItemsWrapper.classList.add("invisible")
}

function showCart() {
    cart.classList.remove("invisible")
}

// Render items to Cart
function renderCartItems() {
    cartItemContainer.innerHTML = ""

    cartItemsQuantity.innerText = shoppingCart.length

    // calculate the total sum of the items inside the cart
    const total = shoppingCart.reduce((sum, entry) => {
        const item = items.find(i => entry.id === i.id)
        return sum + item.priceInCents * entry.quantity
    }, 0)

    cartTotal.innerText = `$${total / 1000}`


    shoppingCart.forEach(entry => {
        const item = items.find(i => entry.id === i.id)
        const cartElementClone = cartItemTemplate.content.cloneNode(true)

        cartElementClone.querySelector("[data-item-name]").textContent = item.name

        const container = cartElementClone.querySelector("[data-item]")
        container.setAttribute('data-item-id', item.id)

        const imageElement = cartElementClone.querySelector("[data-item-image]");
        if (item.imageUrl) {
            imageElement.src = item.imageUrl;
        } else {
            imageElement.src = item.img;
        }

        const quantityElement = cartElementClone.querySelector("[data-item-quantity]")
        if (entry.quantity > 1) {
            quantityElement.textContent = `x${entry.quantity}`
        } else {
            quantityElement.style.display = "none"  // hide items quantity if the cart contains no items
        }

        const priceElement = cartElementClone.querySelector("[data-item-price]")
        priceElement.textContent = `$${item.priceInCents / 1000 * entry.quantity}`

        cartItemContainer.appendChild(cartElementClone)
    })
}
