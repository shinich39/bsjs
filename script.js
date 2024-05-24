import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import bs from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_PATH = path.join(__dirname, "input");

;(async function() {
  for (const file of fs.readdirSync(INPUT_PATH)) {
    if ([".wav", ".mp3"].indexOf(path.extname(file)) === -1) {
      console.error(`Not supported: ${file}`);
      continue;
    }
    try {
      const filePath = path.join(INPUT_PATH, file);
      console.log(`Start generating: ${file}`);
      await bs.generate(filePath);
      console.log(`Complete generating: ${file}`);
    } catch(err) {
      console.error(`Error ocurred: ${file}, ${err.message}`);
      // console.error(err);
    }
  }
})();

