function formatGoFunctionForVSCSnippet(
  goFunctionString,
  snippetName,
  snippetTrigger,
  snippetDescription
) {
  // Escape backslashes and double quotes
  const escapedString = goFunctionString
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // Split the function string into lines
  const lines = escapedString.split("\n");

  // Create the snippet body
  const snippetBody = lines.map((line) => line.replace(/\\n$/, "")); // Remove newline escape at the end of each line

  // Construct the snippet object
  const snippet = {
    [snippetName]: {
      prefix: snippetTrigger,
      body: snippetBody,
      description: snippetDescription,
    },
  };

  // Convert the snippet object to a JSON string
  return JSON.stringify(snippet, null, 2); // Pretty print the JSON
}

// Example usage
const goFunctionString = ``;
const snippetName = "LogValue Function";
const snippetTrigger = "logValue";
const snippetDescription =
  "Logs a value with optional title and depth for debugging.";

const snippetJson = formatGoFunctionForVSCSnippet(
  goFunctionString,
  snippetName,
  snippetTrigger,
  snippetDescription
);

console.log(snippetJson);
