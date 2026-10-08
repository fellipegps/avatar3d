import test from 'node:test';
import assert from 'node:assert/strict';
import { ConversationStore } from '../.tmp/domain-tests/src/app/ConversationStore.js';

const reply = (id = 'answer-1', text = 'Resposta completa.') => ({ id, text });

test('Store independente de DOM, snapshot inicial e inscrição imediata', () => {
  assert.equal(typeof document, 'undefined');
  const store = new ConversationStore(), states = [];
  const unsubscribe = store.subscribe(state => states.push(state));
  assert.deepEqual(store.getSnapshot(), { messages: [], phase: 'idle', activeRequestId: null });
  assert.equal(states.length, 1); unsubscribe(); unsubscribe(); store.reset(); assert.equal(states.length, 1);
});

test('Fluxo waiting → revealing → idle, texto original e resposta completa em uma mudança', () => {
  const store = new ConversationStore(), states = [];
  store.subscribe(state => states.push(state));
  const id = store.begin('  OLÁ!\nTexto original  ');
  assert.equal(store.getSnapshot().messages[0].text, '  OLÁ!\nTexto original  ');
  assert.equal(store.receive(id, reply()), true);
  assert.equal(store.getSnapshot().messages[1].text, 'Resposta completa.');
  assert.equal(store.complete(id), true);
  assert.deepEqual(states.map(state => state.phase), ['idle', 'waiting', 'revealing', 'idle']);
  assert.equal(store.getSnapshot().activeRequestId, null);
});

test('Branco/excesso não mudam estado nem notificam; limite de 2000 é aceito', () => {
  const store = new ConversationStore(); let changes = 0;
  store.subscribe(() => changes++);
  for (const text of ['', ' \n\t ', 'x'.repeat(2001)]) assert.equal(store.begin(text), null);
  assert.equal(changes, 1); assert.notEqual(store.begin('x'.repeat(2000)), null);
});

test('Uma resposta ativa em waiting e revealing; chamadas inválidas não notificam', () => {
  const store = new ConversationStore(); let changes = 0;
  store.subscribe(() => changes++);
  const id = store.begin('oi'); assert.equal(store.begin('segunda'), null);
  assert.equal(store.complete(id), false); assert.equal(store.receive(id + 1, reply()), false);
  assert.equal(changes, 2);
  store.receive(id, reply()); assert.equal(store.begin('terceira'), null);
  assert.equal(store.receive(id, reply('duplicada')), false); assert.equal(changes, 3);
});

test('Erro libera solicitação, mantém histórico e permite recuperação sem erro antigo', () => {
  const store = new ConversationStore(), id = store.begin('oi');
  assert.equal(store.fail(id, 'Falha local'), true);
  assert.equal(store.getSnapshot().phase, 'error'); assert.equal(store.getSnapshot().error, 'Falha local');
  assert.equal(store.getSnapshot().messages.length, 1);
  const next = store.begin('ajuda'); assert.ok(next > id);
  assert.equal(store.getSnapshot().error, undefined);
  store.receive(next, reply()); store.complete(next); assert.equal(store.getSnapshot().phase, 'idle');
});

for (const stage of ['waiting', 'revealing']) {
  test(`Cancelar em ${stage} é normal, conserva histórico e invalida ID`, () => {
    const store = new ConversationStore(), id = store.begin('oi');
    if (stage === 'revealing') store.receive(id, reply());
    const count = store.getSnapshot().messages.length;
    assert.equal(store.cancel(id), true); assert.equal(store.cancel(id), false);
    assert.equal(store.getSnapshot().phase, 'idle'); assert.equal(store.getSnapshot().error, undefined);
    assert.equal(store.getSnapshot().messages.length, count);
    assert.equal(store.receive(id, reply('tardia')), false); assert.equal(store.complete(id), false);
  });
  test(`Reinício em ${stage} limpa histórico e rejeita resposta/falha/finalização antigas`, () => {
    const store = new ConversationStore(), id = store.begin('oi');
    if (stage === 'revealing') store.receive(id, reply());
    store.reset(); const next = store.begin('nova'); const snapshot = store.getSnapshot();
    assert.ok(next > id);
    assert.equal(store.receive(id, reply('tardia')), false); assert.equal(store.fail(id, 'antiga'), false);
    assert.equal(store.complete(id), false); assert.equal(store.cancel(id), false);
    assert.equal(store.getSnapshot(), snapshot); assert.equal(snapshot.messages.length, 1);
  });
}

test('IDs únicos em mensagens, reinícios e instâncias; resposta não pode duplicar ID', () => {
  const store = new ConversationStore(), second = new ConversationStore();
  const first = store.begin('oi'), original = store.getSnapshot().messages[0].id;
  assert.equal(store.receive(first, reply(original)), false);
  assert.equal(store.receive(first, reply('', 'inválida')), false);
  assert.equal(store.receive(first, reply('vazia', '   ')), false);
  store.receive(first, reply()); store.complete(first);
  const next = store.begin('ajuda'); assert.equal(store.receive(next, reply()), false);
  store.reset(); store.begin('nova'); second.begin('oi');
  assert.equal(new Set([original, store.getSnapshot().messages[0].id, second.getSnapshot().messages[0].id]).size, 3);
});

test('Snapshots e mensagens não podem ser alterados por consumidores; snapshots antigos estáveis', () => {
  const store = new ConversationStore(), empty = store.getSnapshot();
  const id = store.begin('oi'), waiting = store.getSnapshot();
  assert.throws(() => { waiting.phase = 'error'; }, TypeError);
  assert.throws(() => waiting.messages.push({}), TypeError);
  assert.throws(() => { waiting.messages[0].text = 'alterado'; }, TypeError);
  store.receive(id, reply());
  assert.equal(empty.messages.length, 0); assert.equal(waiting.messages.length, 1); assert.equal(waiting.phase, 'waiting');
});

test('Notificações reentrantes mantêm ordem e remoção de assinante é respeitada', () => {
  const store = new ConversationStore(), phases = []; let remove = () => {};
  store.subscribe(state => { if (state.phase === 'waiting') { remove(); store.reset(); } });
  let removedCalls = 0; remove = store.subscribe(() => removedCalls++);
  store.subscribe(state => phases.push(state.phase));
  store.begin('oi'); assert.deepEqual(phases, ['idle', 'waiting', 'idle']); assert.equal(removedCalls, 1);
});

test('Corrida: Promise antiga resolvida após reset não altera solicitação nova', async () => {
  const store = new ConversationStore(); let resolveOld;
  const oldId = store.begin('antiga');
  const oldPromise = new Promise(resolve => { resolveOld = resolve; }).then(answer => store.receive(oldId, answer));
  store.reset(); const newId = store.begin('nova'); const state = store.getSnapshot();
  resolveOld(reply('old')); assert.equal(await oldPromise, false); assert.equal(store.getSnapshot(), state);
  assert.equal(store.receive(newId, reply('new')), true); store.complete(newId);
  assert.deepEqual(store.getSnapshot().messages.map(message => message.text), ['nova', 'Resposta completa.']);
});

test('Dispose idempotente libera inscrições/histórico e ignora trabalho tardio', () => {
  const store = new ConversationStore(); let changes = 0;
  const unsubscribe = store.subscribe(() => changes++), id = store.begin('oi');
  store.dispose(); store.dispose(); unsubscribe(); store.reset(); store.subscribe(() => changes++);
  assert.equal(store.begin('tardia'), null); assert.equal(store.receive(id, reply()), false);
  assert.equal(store.fail(id), false); assert.equal(store.cancel(id), false); assert.equal(store.complete(id), false);
  assert.equal(changes, 2); assert.equal(store.getSnapshot().messages.length, 0);
});
