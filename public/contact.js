/**
 * Author: Jay Dong
 * CS 132 Spring 2024
 * Date: June 7, 2024
 * This file handles the logic of the contact form. It allows users to send
 * feedback for their user experience. They are rate limited to one entry
 * per 5 seconds.
 */
(function () {
    "use strict";
    function init() {
        id("input-form").addEventListener("submit", function (evt) {
            evt.preventDefault();
            submitFeedback();
        });
    }

    /**
     * Let the user know their feedback has been submitted successfully.
     * A message will appear, and the form will be cleared. There is a
     * wait time of 5 seconds before the user can submit again.
     * @param none
     * @returns none
     */
    function sendFeedbackSuccess() {
        qs("#message-area").classList.add("hidden");
        id("form-success").classList.remove("hidden");
        id("submit-btn").disabled = true;
        setTimeout(() => {
            id("form-success").classList.add("hidden");
            id("submit-btn").disabled = false;
        }, 5000);
        // Clear the form
        id("input-form").reset();
    }

    /**
     * Submit the feedback form to the server.
     * @param none
     * @returns none
     */
    function submitFeedback() {
        const url = "http://localhost:8000/comments";
        const form = id("input-form");
        const params = new FormData(form);
        fetch(url, { method: "POST", body: params })
            .then(checkStatus)
            .then(sendFeedbackSuccess)
            .catch(handleError);
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
                "An error ocurred trying to submit your feedback. Please try again later.";
        }
        qs("#message-area").classList.remove("hidden");
    }

    init();
})();
