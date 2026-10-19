const {Buffer}=require('node:buffer');
const fs=require('node:fs');
const path=require('node:path');
const sharp=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp') : 'sharp');
const defs=`<defs><radialGradient id="orb" cx="32%" cy="25%" r="75%"><stop stop-color="#f8f1e7"/><stop offset=".35" stop-color="#bbcec1"/><stop offset=".7" stop-color="#7f9a89"/><stop offset="1" stop-color="#324f44"/></radialGradient><radialGradient id="glow"><stop stop-color="#e9d0c0" stop-opacity=".8"/><stop offset="1" stop-color="#e9d0c0" stop-opacity="0"/></radialGradient></defs>`;
const sphere=`${defs}<circle cx="512" cy="512" r="450" fill="url(#glow)"/><circle cx="512" cy="494" r="310" fill="url(#orb)"/><ellipse cx="512" cy="520" rx="375" ry="96" fill="none" stroke="#e5ddcb" stroke-width="8" transform="rotate(-23 512 512)"/><ellipse cx="512" cy="520" rx="375" ry="96" fill="none" stroke="#fbf9f0" stroke-opacity=".65" stroke-width="2" transform="rotate(-23 512 512)"/>`;
const svg=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${body}</svg>`;
(async()=>{fs.writeFileSync('assets/sphere.svg',svg(sphere));await sharp(Buffer.from(svg(sphere))).png().toFile('assets/sphere.png');await sharp(Buffer.from(svg('<rect width="1024" height="1024" fill="#F7F5F0"/>'+sphere))).png().toFile('assets/icon.png');await sharp(Buffer.from(svg(`<g transform="translate(128 128) scale(.75)">${sphere}</g>`))).png().toFile('assets/adaptive-icon.png');})();
