(function () {
  const originalEventSource = window.EventSource;

  window.EventSource = function (url, options) {
    console.log({ url });
    if (typeof url === "string") {
      console.log("EventSource URL:", url);
      console.log("EventSource options:", options);

      const eventSource = new originalEventSource(url, options);

      eventSource.addEventListener("message", function (event) {
        console.log("Event data:", event.data);
      });

      eventSource.addEventListener("error", function (event) {
        console.error("EventSource error:", event);
      });

      return eventSource;
    }

    return new originalEventSource(url, options);
  };

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
          // Skipping logging for text/event-stream responses
          // as they are handled by the EventSource interception
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
