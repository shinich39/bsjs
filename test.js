import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from 'node:url';
import bs from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

;(async function() {
  await bs.generate(path.join(__dirname, "test", "ODDS&ENDS.wav"));
})();