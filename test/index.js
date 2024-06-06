const assert = require('assert');

const fx = require('../dist/cjs/index.min.js');

const amount = '100';
const base = 'EUR';
const target = 'USD';

describe('get currency list', () => {
    it('get currency list, default base currency (USD)', async () => {
        const result = await fx();
        assert.strictEqual(typeof result === 'object', true);
        assert.strictEqual(result.USD === 1, true);
    });
    it('get currency list, custom base currency', async () => {
        const result = await fx(base);
        assert.strictEqual(typeof result === 'object', true);
        assert.strictEqual(result?.[base] === 1, true);
    });
});

describe('convert using parameters', () => {
    it('convert to all available currencies', async () => {
        const result = await fx(amount, base);
        assert.strictEqual(typeof result === 'object', true);
    });
    it('convert to specific currency', async () => {
        const result = await fx(amount, base, target);
        assert.strictEqual(typeof result === 'number', true);
    });
});

describe('convert using method chaining', () => {
    it('convert to specific currency', async () => {
        const result = await fx(amount).from(base).to(target);
        assert.strictEqual(typeof result === 'number', true);
    });
});
