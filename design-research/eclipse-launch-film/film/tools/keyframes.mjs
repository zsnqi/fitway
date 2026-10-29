// Prints the contact sheet's frames (the keys of keyframes.json), for render.sh.
import fs from 'node:fs';
console.log(Object.keys(JSON.parse(fs.readFileSync(new URL('./keyframes.json', import.meta.url)))).join(','));
