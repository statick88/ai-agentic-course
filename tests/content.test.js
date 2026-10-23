const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const readme = fs.readFileSync('README.md', 'utf8');
const sources = fs.readFileSync('SOURCES.md', 'utf8');

function positionOf(id) {
  return html.indexOf(`id="${id}"`);
}

test('la presentación conserva contenido semántico y accesible sin JavaScript', () => {
  assert.match(html, /<article class="slide"/);
  assert.equal((html.match(/<article class="[^"]*\bslide\b[^"]*"/g) || []).length, 29);
  assert.match(html, /<h1>/);
  assert.match(html, /<details>/);
  assert.match(html, /Objetivo: practicar listas en Python/);
  assert.match(html, /<aside class="source-access"/);
});

test('el encuadre visible describe una presentación y conserva rutas públicas', () => {
  assert.match(html, /<meta name="description" content="Presentación independiente/);
  assert.match(html, /<title>De token a agente \| Presentación de IA<\/title>/);
  assert.match(html, /PRESENTACIÓN INDEPENDIENTE/);
  assert.match(html, /aria-label="Secciones de la presentación"/);
  assert.match(html, /aria-label="Diapositivas de la presentación"/);
  assert.match(html, /id="course"/);
  assert.doesNotMatch(html, /<title>[\s\S]*Curso de IA/);
  assert.match(readme, /^Presentación web estática/m);
  assert.match(sources, /^Esta presentación está escrita/m);
});

test('la presentación no impone objetivos por módulo', () => {
  for (const id of ['m2-fundamentos', 'm3-llm', 'm4-agentes', 'm5-metodos', 'm6-ecosistema']) {
    const module = html.match(new RegExp(`<article class="slide" id="${id}">([\\s\\S]*?)<\\/article>`))?.[1];
    assert.ok(module, `${id} existe`);
    assert.doesNotMatch(module, /Objetivos:/i);
  }
  const history = html.match(/<article class="slide timeline-slide" id="m1-bienvenida">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(history, 'la cronología existe');
  assert.doesNotMatch(history, /Objetivo ampliado/i);
});

test('la historia es una única línea del tiempo antes de fundamentos', () => {
  const order = ['m1-bienvenida', 'm2-fundamentos', 'm3-llm', 'm4-agentes', 'm5-metodos', 'm6-ecosistema'];
  for (let index = 1; index < order.length; index += 1) {
    assert.ok(positionOf(order[index - 1]) < positionOf(order[index]), `${order[index - 1]} precede a ${order[index]}`);
  }

  const history = html.match(/<article class="slide timeline-slide" id="m1-bienvenida">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(history, 'la historia permanece anclada en m1-bienvenida');
  assert.equal((html.match(/<article class="[^"]*\bslide\b[^"]*" id="m1-/g) || []).length, 1);
  for (const milestone of ['1943', 'McCulloch', 'Pitts', '1950', 'Turing', '1955', '1956', 'Dartmouth', '1958', 'perceptrón', 'simbólicos', 'sistemas expertos', 'inviernos', '1986', 'retropropagación', '1997', 'Deep Blue', '2012', 'AlexNet', '2017', 'Transformer', '2018–2022', 'LLM', '2022', 'ReAct', 'agéntica']) {
    assert.match(history, new RegExp(milestone, 'i'));
  }
  for (const source of ['10.1007/BF02478259', 'academic.oup.com/mind', 'dartmouth', '1706.03762', '2210.03629']) {
    assert.match(history, new RegExp(source, 'i'));
  }
  assert.match(history, /no fue el origen exclusivo/i);
  assert.match(history, /no la invención reciente/i);
  assert.doesNotMatch(html, /id="m1-(1943|1950|dartmouth|perceptron|simbolica|inviernos|backprop|deepblue|alexnet|transformers|react|agentica)"/);
});

test('enseña las siete fases ODD oficiales y separa SDD, ODD y RDD', () => {
  const phases = ['Autorizar', 'Explorar', 'Resolver incertidumbre', 'Clasificar', 'Registrar trabajo sustancial', 'Implementar y verificar', 'Cerrar'];
  for (const phase of phases) assert.match(html, new RegExp(`>${phase}<`));
  assert.match(html, /SDD significa Spec-Driven Development/);
  assert.match(html, /ODD significa Organic Driven Development/);
  assert.match(html, /RDD significa Receipt-Driven Development/);
  assert.doesNotMatch(html, /entender<\/span><span>definir/i);
});

test('el contenido cubre hitos, aprendizaje profundo y límites operativos', () => {
  for (const term of ['McCulloch', 'Turing', 'Dartmouth', '1958', '1986', 'Transformer', 'ReAct', 'MCP', 'Engram', 'deep learning']) {
    assert.match(html, new RegExp(term, 'i'));
  }
  assert.match(html, /no concede permisos/i);
  assert.match(html, /no sustituye pruebas ni autoriza entrega/i);
  assert.match(html, /El capítulo no se atribuye ODD ni RDD/i);
});

test('las fuentes separan historia, convenciones y la referencia de lectura del libro', () => {
  assert.match(sources, /Hechos históricos/);
  assert.match(sources, /Convenciones del ecosistema/);
  assert.match(sources, /lectura pública/i);
  assert.match(sources, /pendiente/i);
});
