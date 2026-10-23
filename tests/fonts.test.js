const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

 test('Fira Code Nerd Font se autoaloja con pesos regular/negrita y licencia', () => {
  const css = fs.readFileSync('styles.css', 'utf8');
  assert.match(css, /@font-face\s*\{[^}]*font-family:\s*['"]Fira Code Nerd Font['"]/);
  for (const weight of ['Regular', 'Bold']) {
    const relative = `assets/fonts/FiraCodeNerdFont-${weight}.ttf`;
    assert.ok(css.includes(relative), `${weight} está declarado en CSS`);
    const bytes = fs.readFileSync(relative);
    assert.equal(bytes.readUInt32BE(0), 0x00010000, `${weight} es un archivo TrueType`);
  }
  assert.match(css, /font-display:\s*swap/);
  assert.match(fs.readFileSync('assets/fonts/LICENSE', 'utf8'), /SIL OPEN FONT LICENSE/);
});
