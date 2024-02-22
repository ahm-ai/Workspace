import fs from "fs";
import path from "path";

const HAR_FILE = "flowbite.com.har";
const JSON_API_FILE = "flowbite.json";

// Function to read HAR file and return its content as a JavaScript object
function readHARFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const harContent = JSON.parse(fileContent);
    return harContent;
  } catch (error) {
    console.error("Error reading or parsing HAR file:", error);
    return null;
  }
}

// Function to parse HAR content and save requests in a map
function parseHARAndSaveInMap(harContent) {
  const requestsMap = new Map();

  if (
    !harContent ||
    !harContent.log ||
    !Array.isArray(harContent.log.entries)
  ) {
    console.error("Invalid HAR content");
    return requestsMap;
  }

  harContent.log.entries.forEach((entry) => {
    const { method, url, postData } = entry.request;
    const key = `${method} ${url}`;

    let payload = null;
    if (postData && postData.text) {
      try {
        payload = JSON.parse(postData.text);
      } catch {
        payload = postData.text; // Use raw text if JSON parsing fails
      }
    }

    // @FILTER by url

    requestsMap.set(key, { url, method, payload, pattern: [] });
  });

  return requestsMap;
}

const filePath = path.join(HAR_FILE); // Update with the actual HAR file path
const harContent = readHARFile(filePath);
if (harContent) {
  const requestsMap = parseHARAndSaveInMap(harContent);

  const obj = Object.fromEntries(requestsMap);
  try {
    fs.writeFileSync(JSON_API_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving requests map to JSON file:", error);
  }
} else {
  console.log("Failed to read or parse HAR file.");
}
