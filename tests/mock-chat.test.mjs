import test from 'node:test';
import assert from 'node:assert/strict';
import { MockChatProvider } from '../.tmp/domain-tests/src/chat/MockChatProvider.js';
import { RESPONSES, selectIntent } from '../.tmp/domain-tests/src/chat/responses.js';
import { createFailingChatProvider } from '../.tmp/domain-tests/src/dev/MockChatFailure.js';
import { FakeClock, trackAbortListeners } from './helpers/fake-clock.mjs';

for (const [intent, inputs] of Object.entries({
  greeting: ['Olá!', 'OLÁ', '  ola  ', 'bom DIA'],
  introduction: ['Quem é você?', 'QUEM E VOCE', 'se apresente', 'APRESENTAÇÃO'],
  scene: ['cenário', 'CENARIO', 'Escritório', 'fale da SALA'],
  help: ['ajuda', 'AJÚDA!', 'o que você pode fazer?'],
  fallback: ['astronomia quântica', 'boi', 'escolar', '', '🚀'],
})) {
  test(`Catálogo ${intent}: caixa, acentos e limites de palavras`, async () => {
    const clock = new FakeClock(), provider = new MockChatProvider({ latencyMs: 0, schedule: clock.schedule });
    for (const input of inputs) {
      assert.equal(selectIntent(input), intent);
      const pending = provider.reply(input, new AbortController().signal);
      clock.advance(0);
      assert.equal((await pending).text, RESPONSES[intent]);
    }
    assert.equal(clock.tasks.size, 0);
  });
}

test('Provider roda em Node sem DOM, renderer ou rede; latência padrão é 800 ms', async () => {
  assert.equal(typeof document, 'undefined');
  const clock = new FakeClock(), provider = new MockChatProvider({ schedule: clock.schedule });
  const controller = new AbortController(), listeners = trackAbortListeners(controller.signal);
  let settled = false;
  const pending = provider.reply('olá', controller.signal).then(reply => { settled = true; return reply; });
  clock.advance(799); await Promise.resolve(); assert.equal(settled, false);
  assert.equal(listeners.size, 1); assert.equal(clock.tasks.size, 1);
  clock.advance(1); assert.equal((await pending).text, RESPONSES.greeting);
  assert.equal(clock.tasks.size, 0); assert.equal(listeners.size, 0);
});

test('Latência configurável zero continua assíncrona', async () => {
  const clock = new FakeClock(), provider = new MockChatProvider({ latencyMs: 0, schedule: clock.schedule });
  let settled = false;
  const pending = provider.reply('ajuda', new AbortController().signal).then(reply => { settled = true; return reply; });
  await Promise.resolve(); assert.equal(settled, false);
  clock.advance(0); assert.equal((await pending).text, RESPONSES.help);
});

test('Sinal já abortado rejeita AbortError sem agendar ou reter listener', async () => {
  const clock = new FakeClock(), provider = new MockChatProvider({ schedule: clock.schedule });
  const controller = new AbortController(); controller.abort('reinício');
  const listeners = trackAbortListeners(controller.signal);
  await assert.rejects(provider.reply('olá', controller.signal), { name: 'AbortError' });
  assert.equal(clock.tasks.size, 0); assert.equal(listeners.size, 0);
});

test('Abortar durante latência libera timer/listener e impede resolução tardia', async () => {
  const clock = new FakeClock(), provider = new MockChatProvider({ schedule: clock.schedule });
  const controller = new AbortController(), listeners = trackAbortListeners(controller.signal);
  let replies = 0;
  const pending = provider.reply('olá', controller.signal).then(reply => { replies++; return reply; });
  const rejection = assert.rejects(pending, { name: 'AbortError' });
  clock.advance(799); controller.abort(); controller.abort(); clock.advance(5000);
  await rejection;
  assert.equal(replies, 0); assert.equal(clock.tasks.size, 0); assert.equal(listeners.size, 0);
});

test('Abortar após resolver não muda resposta nem retém listener', async () => {
  const clock = new FakeClock(), provider = new MockChatProvider({ schedule: clock.schedule });
  const controller = new AbortController(), listeners = trackAbortListeners(controller.signal);
  const pending = provider.reply('oi', controller.signal); clock.advance(800);
  const reply = await pending; controller.abort(); clock.advance(5000);
  assert.equal(await pending, reply); assert.equal(listeners.size, 0);
});

test('Cancelamento é isolado por sinal; IDs não colidem entre chamadas e instâncias', async () => {
  const clock = new FakeClock(), options = { schedule: clock.schedule };
  const first = new MockChatProvider(options), second = new MockChatProvider(options);
  const cancelled = new AbortController();
  const rejected = assert.rejects(first.reply('oi', cancelled.signal), { name: 'AbortError' });
  const requests = [first.reply('oi', new AbortController().signal), first.reply('oi', new AbortController().signal), second.reply('oi', new AbortController().signal)];
  cancelled.abort(); clock.advance(800); await rejected;
  const replies = await Promise.all(requests);
  assert.equal(new Set(replies.map(reply => reply.id)).size, 3); assert.equal(clock.tasks.size, 0);
});

test('Latências negativas, infinitas e NaN são rejeitadas', () => {
  for (const latencyMs of [-1, Infinity, NaN]) assert.throws(() => new MockChatProvider({ latencyMs }), RangeError);
});

test('Erro do agendador não deixa listener e permite rejeição observável', async () => {
  const controller = new AbortController(), listeners = trackAbortListeners(controller.signal);
  const provider = new MockChatProvider({ schedule: () => { throw new Error('agendador indisponível'); } });
  await assert.rejects(provider.reply('oi', controller.signal), /agendador indisponível/);
  assert.equal(listeners.size, 0);
});

test('Provider DEV falha explicitamente após latência; catálogo normal não tem gatilho de erro', async () => {
  const clock = new FakeClock(), provider = createFailingChatProvider({ schedule: clock.schedule });
  const rejection = assert.rejects(provider.reply('olá', new AbortController().signal), /Falha simulada/);
  clock.advance(800); await rejection; assert.equal(clock.tasks.size, 0);
  const normal = new MockChatProvider({ schedule: clock.schedule });
  const pending = normal.reply('__erro__', new AbortController().signal); clock.advance(800);
  assert.equal((await pending).text, RESPONSES.fallback);
});

test('Provider DEV respeita cancelamento como AbortError, sem falha simulada tardia', async () => {
  const clock = new FakeClock(), provider = createFailingChatProvider({ schedule: clock.schedule });
  const controller = new AbortController();
  const rejection = assert.rejects(provider.reply('olá', controller.signal), { name: 'AbortError' });
  controller.abort(); clock.advance(5000); await rejection; assert.equal(clock.tasks.size, 0);
});
