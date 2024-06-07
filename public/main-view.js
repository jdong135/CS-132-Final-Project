/**
 * Author: Jay Dong
 * CS 132 Spring 2024
 * Date: June 7, 2024
 * This file handles the logic for the storefront and switching between views.
 * It dynamically creates the product cards and single view for each product.
 */
(function () {
    "use strict";
    function init() {
        document.addEventListener("DOMContentLoaded", async () => {
            const products = await getProducts("all");
            displayProducts(products);
        });

        qs("#home-banner a").addEventListener("click", (event) => {
            event.preventDefault();
            id("filter-bar").scrollIntoView({ behavior: "smooth" });
        });

        qs("#dropdown").addEventListener("change", async (event) => {
            const selectedOption = event.target.value;
            let products;
            switch (selectedOption) {
                case "all":
                    products = await getProducts("all");
                    displayProducts(products);
                    break;
                case "planets":
                case "moons":
                case "stars":
                    products = await getProducts(selectedOption);
                    displayFilteredProducts(products, selectedOption);
                    break;
            }
        });

        qs("#contact-us-btn").addEventListener("click", () => {
            qs("#message-area").classList.add("hidden");
            showSection("contact-page");
        });

        qs("h1").addEventListener("click", async () => {
            qs("#message-area").classList.add("hidden");
            showSection("main-view");
            const products = await getProducts("all");
            displayProducts(products);
        });
    }

    /**
     * Fetches product information from the server
     * @param {string} category - category of product
     * @param {string} productName - name of product
     * @returns JSON object of product information
     */
    async function getProductInfo(category, productName) {
        try {
            let resp = await fetch(
                "http://localhost:8000/products/category/" +
                    category +
                    "/product/" +
                    productName,
                {
                    method: "GET",
                }
            );
            resp = checkStatus(resp);
            qs("#message-area").classList.add("hidden");
            const product = await resp.json();
            return product;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Key's have different formats than the product name
     * This function converts the product name to the key format
     * @param {string} name - name of product
     * @returns formatted string of product name
     */
    function parseName(name) {
        if (name === "Barnard's Star") {
            return "barnards-star";
        }
        return name.replace(" ", "-").toLowerCase();
    }

    /**
     * Sends a POST request to the server to purchase a product.
     * Gray out the button and change the text to "Purchased" if
     * successful
     * @param {JSON} productJson - JSON object of product information
     * @param {string} category - category of product
     * @param {HTMLElement} button - button element that was clicked
     */
    async function purchaseProduct(productJson, category, button) {
        const name = parseName(productJson.name);
        const params = {
            category: category,
            product: name,
        };
        try {
            let resp = await fetch("http://localhost:8000/instock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            });
            resp = checkStatus(resp);
            button.disabled = true;
            button.textContent = "Purchased";
            qs("#message-area").classList.add("hidden");
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Creates product details based on category
     * This is the text you see under a product's description in the single
     * view.
     * @param {JSON} productJson - JSON object of product information
     * @param {string} category - category of product
     * @param {HTMLElement} parent - parent element to append product details to
     */
    function createProductDetails(productJson, category, parent) {
        if (category === "stars") {
            const mass = gen("p");
            mass.textContent = "Mass: " + productJson.properties["mass"];
            const radius = gen("p");
            radius.textContent = "Radius: " + productJson.properties["radius"];
            const distance = gen("p");
            distance.textContent =
                "Distance from Earth: " + productJson.properties["distance"];
            parent.appendChild(mass);
            parent.appendChild(radius);
            parent.appendChild(distance);
        } else {
            const surfaceArea = gen("p");
            surfaceArea.textContent =
                "Surface Area: " + productJson.properties["surface-area"];
            const volume = gen("p");
            volume.textContent = "Volume: " + productJson.properties["volume"];
            const density = gen("p");
            density.textContent =
                "Density: " + productJson.properties["density"];
            parent.appendChild(surfaceArea);
            parent.appendChild(volume);
            parent.appendChild(density);
        }
    }

    /**
     * Creates the single view for a product. This is where the user can
     * purchase the product. There is one image, a description, and a
     * button to purchase the product.
     * @param {string} category - category of product
     * @param {string} name - name of product
     */
    async function createSingleView(category, name) {
        const productJson = await getProductInfo(category, name);
        const productContainer = qs("#product-container");
        productContainer.innerHTML = "";
        // Create image
        const img = gen("img");
        img.src = productJson.image;
        img.alt = productJson.name;
        productContainer.appendChild(img);
        // Add product details
        const productDetails = gen("div");
        productDetails.id = "product-details";
        const nameP = gen("p");
        nameP.textContent = uppercaseFirstLetter(productJson.name);
        nameP.classList.add("single-view-title");
        const price = gen("p");
        price.textContent = productJson.price;
        price.classList.add("single-view-price");
        const description = gen("p");
        description.classList.add("single-view-description");
        description.textContent = productJson.description;

        productDetails.appendChild(nameP);
        productDetails.appendChild(price);
        productDetails.appendChild(description);
        createProductDetails(productJson, category, productDetails);

        // Create button based on in stock boolean
        if (productJson["in-stock"]) {
            const button = gen("button");
            button.textContent = "Add to Cart";
            productDetails.appendChild(button);
            button.addEventListener("click", () => {
                purchaseProduct(productJson, category, button);
            });
        } else {
            const outButton = gen("button");
            outButton.textContent = "Out of Stock";
            outButton.disabled = true;
            productDetails.appendChild(outButton);
        }

        productContainer.appendChild(productDetails);
    }

    /**
     * Capitalizes the first letter of a word
     * @param {string} word - word to capitalize
     * @returns string with first letter capitalized
     */
    function uppercaseFirstLetter(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    /**
     * Creates a product container on the storefront
     * @param {string} category - category of product
     * @param {JSON} item - JSON object of product information
     * @param {string} name - name of product
     * @returns HTMLElement div element (product container) on storefront
     */
    function createProduct(category, item, name) {
        const product = gen("div");
        const img = gen("img");
        img.src = item.image;
        img.alt = item.name;
        product.appendChild(img);
        const nameP = gen("p");
        nameP.classList.add("product-name");
        nameP.textContent = uppercaseFirstLetter(name);
        product.appendChild(nameP);
        const price = gen("p");
        price.textContent = item.price;
        product.appendChild(price);
        const buyBtn = gen("button");
        buyBtn.textContent = "Purchase";
        product.appendChild(buyBtn);
        // When product is clicked, show #single-view
        buyBtn.addEventListener("click", () => {
            showSection("single-view");
            createSingleView(category, name);
        });
        return product;
    }

    /**
     * Displays products that are filtered by category
     * @param {JSON} products - JSON object of products
     * @param {string} category - category of products
     */
    function displayFilteredProducts(products, category) {
        const productsContainer = qs("#items-view");
        productsContainer.innerHTML = "";
        for (const [name, item] of Object.entries(products)) {
            const product = createProduct(category, item, name);
            productsContainer.appendChild(product);
        }
        qs("#item-count").textContent = productsContainer.children.length;
        qs("#filter-title").textContent = uppercaseFirstLetter(category);
    }

    /**
     * Displays all products on the storefront
     * @param {JSON} products - JSON object of products
     */
    function displayProducts(products) {
        const productsContainer = qs("#items-view");
        productsContainer.innerHTML = "";
        const categories = products["categories"];
        for (const [category, categoryItems] of Object.entries(categories)) {
            for (const [name, item] of Object.entries(categoryItems)) {
                const product = createProduct(category, item, name);
                productsContainer.appendChild(product);
            }
        }
        qs("#item-count").textContent = productsContainer.children.length;
        qs("#filter-title").textContent = "All Items";
    }

    /**
     * Fetches products from the server based on category
     * @param {string} category - category of product
     * @returns JSON object of products
     */
    async function getProducts(category) {
        let url = "http://localhost:8000/products";
        try {
            if (category != "all") {
                url += "/category/" + category;
            }
            let resp = await fetch(url, {
                method: "GET",
            });
            resp = checkStatus(resp);
            qs("#message-area").classList.add("hidden");
            const products = await resp.json();
            return products;
        } catch (err) {
            handleError(err);
        }
    }

    /**
     * Handle errors that occur when calling endpoints
     * @param {any} errMsg - error that is passed in
     */
    function handleError(errMsg) {
        if (typeof errMsg === "string") {
            qs("#message-area").textContent = errMsg;
        } else {
            qs("#message-area").textContent =
                "An error ocurred fetching the celestial data. Please try again later.";
        }
        qs("#message-area").classList.remove("hidden");
    }

    /**
     * Shows a section of the webpage. Hides the current section.
     * @param {string} sectionId - id of section to show
     */
    function showSection(sectionId) {
        const currView = qs("section:not(.hidden)");
        currView.classList.add("hidden");
        qs("#" + sectionId).classList.remove("hidden");
    }

    init();
})();
