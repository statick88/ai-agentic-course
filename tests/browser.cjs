const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const root = process.cwd();
const executable = process.env.CHROME_BIN;
if (!executable) {
  console.error('Set CHROME_BIN to a Chromium-compatible browser executable.');
  process.exit(1);
}
fs.mkdirSync(path.join(root, '.verification'), { recursive: true });
const browser = spawn(executable, ['--headless', '--remote-debugging-pipe', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${path.join(root, '.verification/browser-profile')}`], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
const pending = new Map();
let sequence = 0;
let buffer = '';
let session;
const errors = [];
browser.on('error', error => { console.error(error.message); process.exit(1); });
browser.stdio[4].on('data', chunk => {
  buffer += chunk.toString();
  let boundary;
  while ((boundary = buffer.indexOf('\0')) >= 0) {
    const message = JSON.parse(buffer.slice(0, boundary));
    buffer = buffer.slice(boundary + 1);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  }
});
function command(method, params = {}, sessionId = session) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    browser.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
  });
}
async function evaluate(expression) {
  const response = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
const timeout = setTimeout(() => { console.error('Browser check timeout'); browser.kill(); process.exit(1); }, 20000);
(async () => {
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
  ({ sessionId: session } = await command('Target.attachToTarget', { targetId, flatten: true }));
  await command('Runtime.enable');
  await command('Page.enable');
  await command('Page.navigate', { url: `file://${root}/index.html` });
  await evaluate(`new Promise(resolve => { if (document.readyState === 'complete') resolve(); else window.addEventListener('load', resolve, {once:true}); })`);
  await evaluate('document.fonts.ready');
  assert.equal(await evaluate(`document.fonts.load('400 16px "Fira Code Nerd Font"').then(faces => faces.length)`), 1);
  assert.equal(await evaluate(`document.fonts.load('700 16px "Fira Code Nerd Font"').then(faces => faces.length)`), 1);
  assert.match(await evaluate('getComputedStyle(document.body).fontFamily'), /Fira Code Nerd Font/);
  const slideCount = await evaluate('document.querySelectorAll(".slide").length');
  assert.equal(await evaluate(`document.querySelectorAll('.slide[id^="m1-"]').length`), 1);
  assert.equal(await evaluate('document.querySelectorAll("#m1-bienvenida .history-timeline .timeline-events > li").length'), 11);
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm1-bienvenida');
  assert.equal(await evaluate('document.querySelector(".module-menu").open'), false);
  assert.equal(await evaluate('Array.from(document.querySelectorAll(".slide.is-active > .fragment[hidden]"), node => getComputedStyle(node).display).every(display => display === "none")'), true);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm1-bienvenida');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 1);
  assert.equal(await evaluate('document.querySelector(".slide.is-active > details.fragment").getAttribute("aria-hidden")'), 'true');
  assert.equal(await evaluate('document.querySelector(".slide.is-active > details.fragment").inert'), true);
  await evaluate('document.querySelector("[data-action=next]").click()');
  await evaluate('document.querySelector("[data-action=next]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 3);
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const desktopTimeline = await evaluate(`new Promise(resolve => requestAnimationFrame(() => {
    const slide = document.querySelector('#m1-bienvenida');
    const heading = slide.querySelector('h2').getBoundingClientRect();
    const lastEvent = slide.querySelector('.timeline-events > li:last-child').getBoundingClientRect();
    const bounds = slide.getBoundingClientRect();
    resolve({ headingTop: heading.top, lastEventBottom: lastEvent.bottom, slideTop: bounds.top, slideBottom: bounds.bottom });
  }))`);
  assert.ok(desktopTimeline.headingTop >= desktopTimeline.slideTop, JSON.stringify(desktopTimeline));
  assert.ok(desktopTimeline.lastEventBottom <= desktopTimeline.slideBottom, JSON.stringify(desktopTimeline));
  await evaluate('document.querySelector("[data-action=next]").click()');
  assert.equal(await evaluate('document.querySelector("#slide-counter").textContent'), `Diapositiva 2 / ${slideCount}`);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm1-bienvenida');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 3);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 2);
  await command('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
  const timelineLayout = await evaluate(`new Promise(resolve => requestAnimationFrame(() => {
    const slide = document.querySelector('#m1-bienvenida');
    const timeline = slide.querySelector('.history-timeline');
    const lastEvent = timeline.querySelector('.timeline-events > li:last-child');
    resolve({ scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, slideOverflow: getComputedStyle(slide).overflowY, timelineWidth: timeline.getBoundingClientRect().width, lastBottom: lastEvent.offsetTop + lastEvent.offsetHeight, slideScrollHeight: slide.scrollHeight });
  }))`);
  assert.ok(timelineLayout.scrollWidth <= timelineLayout.viewportWidth, JSON.stringify(timelineLayout));
  assert.equal(timelineLayout.slideOverflow, 'auto');
  assert.ok(timelineLayout.timelineWidth <= timelineLayout.viewportWidth, JSON.stringify(timelineLayout));
  assert.ok(timelineLayout.lastBottom <= timelineLayout.slideScrollHeight, JSON.stringify(timelineLayout));
  await evaluate('document.querySelector("#read-all").click()');
  assert.equal(await evaluate('document.querySelectorAll(".fragment[hidden]").length'), 0);
  await evaluate('document.querySelector("#read-all").click()');
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm1-bienvenida');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 2);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35 });
  assert.equal(await evaluate('document.querySelector("#slide-counter").textContent'), `Diapositiva ${slideCount} / ${slideCount}`);
  await evaluate('document.querySelector("#read-all").click()');
  assert.equal(await evaluate('document.querySelectorAll(".slide[aria-hidden=false]").length'), slideCount);
  assert.equal(await evaluate('document.querySelector("#read-all").getAttribute("aria-pressed")'), 'true');
  await evaluate('document.querySelector("#read-all").click()');
  assert.equal(await evaluate('document.querySelectorAll(".slide[aria-hidden=false]").length'), 1);
  await evaluate(`document.querySelector('.module-menu').open = true; document.querySelector('.module-index a[href="#m5-metodos"]').click()`);
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm5-metodos');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 1);
  assert.equal(await evaluate('document.activeElement.tagName'), 'H2');
  assert.equal(await evaluate('document.querySelector(".module-menu").open'), false);
  await evaluate('location.hash = "m5-odd"; new Promise(resolve => window.addEventListener("hashchange", resolve, {once:true}))');
  assert.equal(await evaluate('document.querySelector(".slide.is-active").id'), 'm5-odd');
  assert.equal(await evaluate('document.querySelectorAll(".slide.is-active > .fragment:not([hidden])").length'), 2);
  const phases = await evaluate('Array.from(document.querySelectorAll("#m5-odd .seven span"), node => node.textContent)');
  assert.deepEqual(phases, ['Autorizar', 'Explorar', 'Resolver incertidumbre', 'Clasificar', 'Registrar trabajo sustancial', 'Implementar y verificar', 'Cerrar']);
  assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".slide.is-active")).animationName'), 'none');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".slide.is-active")).animationName'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".slide.is-active .fragment")).animationName'), 'none');
  await command('Emulation.setEmulatedMedia', { media: 'print', features: [] });
  assert.equal(await evaluate('Array.from(document.querySelectorAll(".fragment[hidden]"), node => getComputedStyle(node).display).every(display => display !== "none")'), true);
  await command('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
  for (const width of [320, 390, 768, 1440]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    const layout = await evaluate(`new Promise(resolve => requestAnimationFrame(() => { const slide = document.querySelector('.slide.is-active').getBoundingClientRect(); const controls = document.querySelector('.controls').getBoundingClientRect(); resolve({width:innerWidth, scrollWidth:document.documentElement.scrollWidth, bottom:slide.bottom, controlsTop:controls.top, height:slide.height}); }))`);
    assert.ok(layout.scrollWidth <= layout.width, JSON.stringify(layout));
    assert.ok(layout.bottom <= layout.controlsTop + 1, JSON.stringify(layout));
    assert.ok(layout.height > 200, JSON.stringify(layout));
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${slideCount} slides; one semantic history timeline; loaded regular/bold Fira Code Nerd Font; progressive arrows/buttons; real fragment visibility; read-all retention/accessibility; module/hash focus; animations/reduced motion/print; exact ODD phases; no overlap/overflow at 320,390,768,1440; no runtime exceptions.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearTimeout(timeout); browser.kill(); });
