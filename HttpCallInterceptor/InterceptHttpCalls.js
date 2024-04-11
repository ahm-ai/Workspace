(function () {
  const originalFetch = window.fetch;

  window.fetch = function () {
    const requestUrl = arguments[0];

    if (typeof requestUrl === "string") {
      return originalFetch.apply(this, arguments).then(function (response) {
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          response
            .clone()
            .json()
            .then(function (data) {
              console.log("Request URL:", response.url);
              console.log("Request method:", response.method);
              console.log("Request JSON:", data);
            })
            .catch(function (error) {
              console.error("Error parsing JSON:", error);
            });
        } else if (contentType && contentType.includes("text/event-stream")) {
          response
            .clone()
            .text()
            .then(function (body) {
              console.log("Request URL:", response.url);
              console.log("Request method:", response.method);
              console.log("Event Stream:", body);
            });
        } else {
          response
            .clone()
            .text()
            .then(function (body) {
              console.log("Request URL:", response.url);
              console.log("Request method:", response.method);
              console.log("Request body:", body);
            });
        }

        return response;
      });
    }

    return originalFetch.apply(this, arguments);
  };
})();
