type ExchangeRates = {
    [key: string]: number;
};

interface FX {
    baseCurrency: string;
    exchangeRates: ExchangeRates | null;
    (query?: string | number, fromCurrency?: string | null, toCurrency?: string | null): any;
}

/**
 * Effortlessly converts currency values between different denominations, utilizing the latest pricing data available from the frankfurter.app API.
 *
 * @param {string | number} [query=undefined] - The amount to convert. If only this parameter is provided, it is considered as the base currency.
 * @param {string | null} [fromCurrency=null] - The currency code for the base currency. Defaults to null for automatic detection.
 * @param {string | null} [toCurrency=null] - The currency code for the target currency. Defaults to null for automatic detection.
 * @returns {number | Object | Promise<Object[]>} - If the query is undefined, returns exchange rates for the default base currency (USD).
 */
function fx(
    this: FX | void,
    query: string | number | undefined = undefined,
    fromCurrency: string | null = null,
    toCurrency: string | null = null
): any {
    if (!(this instanceof fx)) {
        return new (fx as any)(query, fromCurrency, toCurrency);
    }

    this.baseCurrency = 'usd';
    this.exchangeRates = null;

    const getRates = async (currency: string): Promise<void> => {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${currency.toUpperCase()}`);
        const { base, rates, message } = (await response.json()) as { base: string; rates?: object; message?: string };

        if (message) {
            throw new Error(message);
        }

        if (base && rates) {
            this.baseCurrency = currency;
            this.exchangeRates = { [base]: 1, ...rates };
        }
    };

    const convert = async (value: string | number, fromCurrency: string, toCurrency: string): Promise<number> => {
        if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) {
            throw new Error('Amount must be a number');
        }
        const amount = parseFloat(value as string);
        if (!Number.isFinite(amount)) {
            throw new Error('Amount must be a finite number');
        }
        if (Math.abs(amount) > Number.MAX_SAFE_INTEGER) {
            throw new Error('Amount exceeds safe limit');
        }

        checkCurrency('Base', fromCurrency);
        checkCurrency('Target', toCurrency);

        await getRates(fromCurrency);

        const fromRate = this.exchangeRates![fromCurrency.toUpperCase()];
        const toRate = this.exchangeRates![toCurrency.toUpperCase()];

        if (!fromRate) {
            throw new Error(`Base currency ${fromCurrency} not found`);
        }
        if (!toRate) {
            throw new Error(`Target currency ${toCurrency} not found`);
        }

        return Math.round((amount / fromRate) * toRate * 100) / 100;
    };

    const getExchangeRates = async (base?: string): Promise<ExchangeRates | null> => {
        if (base) {
            await getRates(base);
        }
        return this.exchangeRates;
    };

    const checkCurrency = (type: string, currency: string | null): void => {
        if (typeof currency !== 'string') {
            throw new Error(`${type} currency must be specified as a string`);
        }
    };

    if (query === undefined) {
        return getExchangeRates(this.baseCurrency);
    } else if (typeof query === 'string' && isNaN(Number(query)) && !fromCurrency && !toCurrency) {
        return getExchangeRates(query);
    } else if (fromCurrency && !toCurrency) {
        return (async (fromCurrency: string) => {
            checkCurrency('Base', fromCurrency);
            if (fromCurrency) {
                await getRates(fromCurrency);
            }
            return Promise.all(
                Object.keys(this.exchangeRates!).map(async (key) => ({
                    [key]: await convert(query, fromCurrency, key)
                }))
            );
        })(fromCurrency);
    } else if (fromCurrency && toCurrency) {
        return (async (fromCurrency: string, toCurrency: string) => {
            checkCurrency('Base', fromCurrency);
            checkCurrency('Target', toCurrency);
            if (fromCurrency) {
                await getRates(fromCurrency);
            }
            return await convert(query, fromCurrency, toCurrency);
        })(fromCurrency, toCurrency);
    } else {
        return {
            from: (fromCurrency: string) => {
                checkCurrency('Base', fromCurrency);
                this.baseCurrency = fromCurrency;
                return {
                    to: async (toCurrency: string) => {
                        checkCurrency('Target', toCurrency);
                        return await convert(query as number, fromCurrency, toCurrency);
                    }
                };
            }
        };
    }
}

export default fx as FX;
