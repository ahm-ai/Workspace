


export async function selectRandomOptionFromDropdown(page, dropdownSelector, value?) {

  const combobox = await page.getByRole("combobox", { name: dropdownSelector });
  await combobox.click();

  const options = await page.$$eval("role=option", (options) =>
    options.map((option) => option.textContent)
  );
  if (options.length === 0) {
    throw new Error(`No options found in the dropdown: ${dropdownSelector}`);
  }
  const randomIndex = Math.floor(Math.random() * options.length);
  const randomOption = options[randomIndex];
  await page.getByRole("option", { name: value || randomOption }).click();
}

export async function waitForNetworkcall(page, pathUrl, timeout = 30000) {
  try {
    const response = await page.waitForResponse(
      (response) => {
        if (response.url().includes(pathUrl)) console.log([response.url()]);
        return response.url().includes(pathUrl) && response.ok();
      },
      { timeout }


   
     


    );
    const responseBody = await response.json();
    return responseBody;
  } catch (error) {
    console.log("Timeout URL:", { pathUrl });
    console.log("Timeout error", error.message);
  }
}


export async function clickButtonWaitForResponse(page, buttonName, pathUrl) {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes(pathUrl)
  );
  await page.getByRole("button", { name: buttonName }).click();
  await responsePromise;
}

// Sets the route listener to modify or get a copy of the request body.
export async function getRequestBody(page) {
  let data = null;
  await page.route('**/<URL_PATH>', async (route, request) => {
    // Intercept the request
    const postData = await request.postData(); // Get the request data.
    data = JSON.parse(postData || '{}'); // Parse the request data as JSON

    // Manipulate the request if needed

    // Continue the request
    await route.continue();
  });
}
