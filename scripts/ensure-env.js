import fs from "node:fs";
const SRC = "env.example";
const DEST = ".env.local";

if (!fs.existsSync(DEST)) {
  if (fs.existsSync(SRC)) {
    fs.copyFileSync(SRC, DEST);
    console.log(`Created ${DEST} from ${SRC}. Remplis tes clés.`);
  } else {
    fs.writeFileSync(DEST, "");
    console.log(`Created empty ${DEST}.`);
  }
} else {
  console.log(`${DEST} déjà présent.`);
}
