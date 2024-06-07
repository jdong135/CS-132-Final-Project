"use strict";
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const { json } = require("express/lib/response");
const app = express();

app.use(cors());
// Supporting Post Requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

const CLIENT_ERR_CODE = 400;
const SERVER_ERR_CODE = 500;
const SERVER_ERROR =
    "Something went wrong on the server, please try again later.";

app.get("/products", async (req, res, next) => {
    try {
        const data = await fs.promises.readFile("products.json", "utf8");
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.get(
    "/products/category/:category/product/:product",
    async (req, res, next) => {
        const categoryDir = req.params.category.toLowerCase();
        const productDir = req.params.product.toLowerCase();
        try {
            const data = await fs.promises.readFile("products.json", "utf8");
            const jsonFile = JSON.parse(data);
            const categories = jsonFile["categories"];
            if (!categories.hasOwnProperty(categoryDir)) {
                const error = new Error("Category Does Not Exist");
                error.code = "CDNE";
                throw error;
            }
            const products = categories[categoryDir];
            if (!products.hasOwnProperty(productDir)) {
                const error = new Error("Product Does Not Exist");
                error.code = "PDNE";
                throw error;
            }
            res.json(products[productDir]);
        } catch (err) {
            if (err.code == "CDNE") {
                res.status(CLIENT_ERR_CODE);
                err.message = `Category ${req.params.category} Does Not Exist.`;
            } else if (err.code == "PDNE") {
                res.status(CLIENT_ERR_CODE);
                err.message = `Product ${req.params.product} Does Not Exist.`;
            } else {
                res.status(SERVER_ERR_CODE);
                err.message = SERVER_ERROR;
            }
            next(err);
        }
    }
);

app.get("/products/category/:category", async (req, res, next) => {
    const categoryDir = req.params.category.toLowerCase();
    try {
        const data = await fs.promises.readFile("products.json", "utf8");
        const jsonFile = JSON.parse(data);
        const categories = jsonFile["categories"];
        if (!categories.hasOwnProperty(categoryDir)) {
            const error = new Error("Category Does Not Exist");
            error.code = "CDNE";
            throw error;
        }
        res.json(categories[categoryDir]);
    } catch (err) {
        if (err.code == "CDNE") {
            res.status(CLIENT_ERR_CODE);
            err.message = `Category ${req.params.category} Does Not Exist.`;
        } else {
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
        }
        next(err);
    }
});

app.post("/instock", async (req, res, next) => {
    let categoryDir = req.body.category;
    let productDir = req.body.product;
    let jsonFile;
    if (!(categoryDir && productDir)) {
        res.status(CLIENT_ERR_CODE);
        next(Error("Missing POST Parameter: name or comments"));
    }
    try {
        const data = await fs.promises.readFile("products.json", "utf8");
        jsonFile = JSON.parse(data);
        const categories = jsonFile["categories"];
        if (!categories.hasOwnProperty(categoryDir)) {
            const error = new Error("Category Does Not Exist");
            error.code = "CDNE";
            throw error;
        }
        const products = categories[categoryDir];
        if (!products.hasOwnProperty(productDir)) {
            const error = new Error("Product Does Not Exist");
            error.code = "PDNE";
            throw error;
        }
    } catch (err) {
        if (err.code == "CDNE") {
            res.status(CLIENT_ERR_CODE);
            err.message = `Category ${req.params.category} Does Not Exist.`;
        } else if (err.code == "PDNE") {
            res.status(CLIENT_ERR_CODE);
            err.message = `Product ${req.params.product} Does Not Exist.`;
        } else {
            res.status(SERVER_ERR_CODE);
            err.message = SERVER_ERROR;
        }
        next(err);
    }
    jsonFile["categories"][categoryDir][productDir]["in-stock"] = false;
    try {
        await fs.promises.writeFile(
            "products.json",
            JSON.stringify(jsonFile),
            "utf8"
        );
        res.send("Stock Updated!");
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.post("/comments", async (req, res, next) => {
    let name = req.body.name;
    let comments = req.body.comments;
    let current_comments;

    if (!(name && comments)) {
        res.status(CLIENT_ERR_CODE);
        next(Error("Missing POST Parameter: name or comments"));
    }
    let new_comment = { name: name, comments: comments };
    try {
        current_comments = await fs.promises.readFile("feedback.json", "utf8");
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
    current_comments = JSON.parse(current_comments);
    current_comments["feedback"].push(new_comment);
    try {
        await fs.promises.writeFile(
            "feedback.json",
            JSON.stringify(current_comments),
            "utf8"
        );
        res.send("Comment received!");
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

app.post("/customer", async (req, res, next) => {
    let current_customers;
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;

    if (!(firstname && lastname && email && phone)) {
        res.status(CLIENT_ERR_CODE);
        next(
            Error(
                "Missing POST Parameter: first name, last name, email, or phone"
            )
        );
    }

    let new_customer = {
        "first-name": firstname,
        "last-name": lastname,
        email: email,
        phone: phone,
    };
    try {
        current_customers = await fs.promises.readFile(
            "loyalCustomers.json",
            "utf8"
        );
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
    current_customers = JSON.parse(current_customers);
    current_customers["members"].push(new_customer);
    try {
        await fs.promises.writeFile(
            "loyalCustomers.json",
            JSON.stringify(current_customers),
            "utf8"
        );
        res.send("New Customer Received!");
    } catch (err) {
        res.status(SERVER_ERR_CODE);
        err.message = SERVER_ERROR;
        next(err);
    }
});

function errorHandler(err, req, res, next) {
    res.type("json");
    res.send({
        message: err.message,
    });
}
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
