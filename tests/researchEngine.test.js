import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResponse, getRelevantSources } from '../src/researchEngine.js';

test('retrieves supporting evidence for a peptide question', () => {
  const result = getRelevantSources('What does current research say about BPC-157?', ['bpc-157']);
  assert.ok(result.length >= 2);
  assert.ok(result.some((source) => source.peptide.toLowerCase().includes('bpc')));
});

test('declines personalized medical guidance without evidence', async () => {
  const response = await buildResponse('What dose should I personally take for BPC-157?', ['bpc-157']);
  assert.match(response.answer.toLowerCase(), /cannot provide individualized|personalized.*dose|not provide/i);
  assert.ok(response.citations.length >= 0);
});

test('handles weak evidence by saying insufficient evidence', async () => {
  const response = await buildResponse('What does research say about peptide X with no evidence?', ['peptide x']);
  assert.match(response.answer.toLowerCase(), /insufficient evidence|research library does not include/i);
});

test('stays in peptide research scope for random questions', async () => {
  const response = await buildResponse('Tell me a joke about the weather', ['general']);
  assert.match(response.answer.toLowerCase(), /peptide research|research questions|specialized in peptide|domain/i);
  assert.equal(response.hasSufficientEvidence, false);
});

test('welcomes the user politely without acting like a generic chatbot', async () => {
  const response = await buildResponse('Hi', ['general']);
  assert.match(response.answer.toLowerCase(), /hi|hello|peptide research|research assistant|explore/i);
  assert.equal(response.hasSufficientEvidence, false);
});
