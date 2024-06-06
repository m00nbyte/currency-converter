# currency-converter

[![npm version](https://img.shields.io/npm/v/@m00nbyte/currency-converter.svg)](https://www.npmjs.org/package/@m00nbyte/currency-converter) [![npm downloads](https://img.shields.io/npm/dm/@m00nbyte/currency-converter)](https://www.npmjs.org/package/@m00nbyte/currency-converter)

---

## Description

Effortlessly converts currency values between different denominations, utilizing the latest pricing data available from the frankfurter.app API.

## Installation

```bash
npm install -D @m00nbyte/currency-converter
yarn add -D @m00nbyte/currency-converter
```

## Using parameters

### Parameters

### `query`

Type: `string | number`
Default: `undefined`

Specifies the amount to convert. If only this parameter is provided, it is considered as the base currency.

### `fromCurrency`

Type: `string | null`
Default: `null`

Specifies the currency code for the base currency. Defaults to null for automatic detection.

### `toCurrency`

Type: `string | null`
Default: `null`

Specifies the currency code for the target currency. Defaults to null for automatic detection.

### Examples

#### **Get currency list with default base currency (USD)**

```js
import fx from '@m00nbyte/currency-converter';

const usdRates = await fx();
console.log(usdRates);
```

#### **Get currency list with custom base currency**

```js
import fx from '@m00nbyte/currency-converter';

const eurRates = await fx('eur');
console.log(eurRates);
```

#### **Convert amount to all available currencies using custom base currency**

```js
import fx from '@m00nbyte/currency-converter';

const conversionResult = await fx(100, 'eur');
console.log('Converted 100 EUR to all available currencies:', conversionResult);
```

#### **Convert amount from base currency to target currency**

```js
import fx from '@m00nbyte/currency-converter';

const conversionResult = await fx(100, 'eur', 'usd');
console.log(`Converted 100 EUR to USD: ${conversionResult}`);
```

## Using Method Chaining

### Methods

### `fx(amount: Number): fx`

#### `amount`

Type: `Number`
Default: `undefined`

Specifies the amount for the conversion.

### `from(currency: String): fx`

#### `currency`

Type: `String`
Default: `undefined`

Sets the base currency for the conversion.

### `to(currency: String): Promise<Number>`

#### `currency`

Type: `String`
Default: `undefined`

Sets the target currency for the conversion and returns the converted amount.

### Examples

#### **Convert amount from base currency to target currency**

```js
import fx from '@m00nbyte/currency-converter';

const conversionResult = await fx(100).from('eur').to('usd');
console.log(`Converted 100 EUR to USD: ${conversionResult}`);
```

## Contribution

Feel free to submit issues or pull requests.

## Like my work?

This project needs a :star: from you.
Don't forget to leave a star.

<a href="https://www.buymeacoffee.com/m00nbyte" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="217" height="60">
</a>

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
