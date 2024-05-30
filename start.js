import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import bs from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_PATH = path.join(__dirname, "input");
const INPUT_HELP_FILE = path.join(__dirname, "input", "PUT_MUSIC_FILES_HERE");

;(async function() {
  if (!fs.existsSync(INPUT_PATH)) {
    fs.mkdirSync(INPUT_PATH);
  }
  if (!fs.existsSync(INPUT_HELP_FILE)) {
    fs.writeFileSync(INPUT_HELP_FILE, "", { encoding: "utf8" });
  }
  
  let startedAt = Date.now();
  let count = 0;
  for (const file of fs.readdirSync(INPUT_PATH)) {
    if ([".wav", ".mp3", ".ogg"].indexOf(path.extname(file)) === -1) {
      // console.error(`> Not supported: ${file}`);
      continue;
    }
    try {
      const filePath = path.join(INPUT_PATH, file);
      // console.log(`> Start generating: ${file}`);
      await bs.generate(filePath);
      count++;
    } catch(err) {
      console.error(err);
      // console.error(`> Error ocurred: ${file}, ${err.message}`);
      // console.error(err);
    }
  }

  console.log(`> Complete generating ${count} files in ${Math.floor(Date.now() - startedAt) / 1000} seconds.`);
})();

