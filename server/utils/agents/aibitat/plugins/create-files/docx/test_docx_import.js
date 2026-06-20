const { loadLibraries } = require("./utils.js");
async function run() {
  const libs = await loadLibraries();
  console.log("docx type:", typeof libs.docx);
  console.log("docx keys:", Object.keys(libs.docx));
  console.log("has Document:", !!libs.docx.Document);
}
run();
