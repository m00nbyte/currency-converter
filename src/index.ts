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
    // If not called with `new`, create a new instance
    if (!(this instanceof fx)) {
        return new (fx as any)(query, fromCurrency, toCurrency);
    }

    // Define variables
    this.baseCurrency = 'usd';
    this.exchangeRates = null;

    /**
     * Fetches the latest exchange rates for the specified currency from the frankfurter.app API.
     *
     * @param {string} currency - The currency code for which to fetch exchange rates.
     * @returns {Promise<void>} - A promise that resolves when the exchange rates are successfully fetched and stored.
     * @throws {Error} - Throws an error if the API returns an error message or if the response does not contain the expected data.
     */
    const getRates = async (currency: string): Promise<void> => {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${currency.toUpperCase()}`);
        const { base, rates, message } = (await response.json()) as { base: string; rates?: object; message?: string };

        // Handle errors
        if (message) {
            throw new Error(message);
        }

        // Update variables
        if (base && rates) {
            this.baseCurrency = currency;
            this.exchangeRates = { [base]: 1, ...rates };
        }
    };

    /**
     * Converts an amount from one currency to another using the latest exchange rates.
     *
     * @param {string | number} value - The amount to convert. It can be a string or a number.
     * @param {string} fromCurrency - The currency code of the base currency.
     * @param {string} toCurrency - The currency code of the target currency.
     * @returns {Promise<number>} - A promise that resolves to the converted amount rounded to two decimal places.
     * @throws {Error} - Throws an error if the amount is not a valid number, exceeds safe limits, or if the currency codes are invalid or not found.
     */
    const convert = async (value: string | number, fromCurrency: string, toCurrency: string): Promise<number> => {
        // Ensure the value is a number
        if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) {
            throw new Error('Amount must be a number');
        }

        // Parse the value as a float
        const amount = parseFloat(value as string);

        // Check if the amount is finite
        if (!Number.isFinite(amount)) {
            throw new Error('Amount must be a finite number');
        }

        // Ensure the amount is within safe limits
        if (Math.abs(amount) > Number.MAX_SAFE_INTEGER) {
            throw new Error('Amount exceeds safe limit');
        }

        // Validate base and target currencies
        checkCurrency('Base', fromCurrency);
        checkCurrency('Target', toCurrency);

        // Fetch exchange rates for the base currency
        await getRates(fromCurrency);

        // Extract the rates
        const fromRate = this.exchangeRates![fromCurrency.toUpperCase()];
        const toRate = this.exchangeRates![toCurrency.toUpperCase()];

        // Handle errors
        if (!fromRate) {
            throw new Error(`Base currency ${fromCurrency} not found`);
        }
        if (!toRate) {
            throw new Error(`Target currency ${toCurrency} not found`);
        }

        // Convert the amount and round to two decimal places
        return Math.round((amount / fromRate) * toRate * 100) / 100;
    };

    /**
     * Retrieves the exchange rates for the specified base currency or the default base currency.
     *
     * @param {string} [base] - The currency code for the base currency. If not provided, the default base currency is used.
     * @returns {Promise<ExchangeRates | null>} - A promise that resolves to the exchange rates object or null if not available.
     * @throws {Error} - Throws an error if there is an issue fetching the exchange rates.
     */
    const getExchangeRates = async (base?: string): Promise<ExchangeRates | null> => {
        // Fetch rates if a base currency is provided
        if (base) {
            await getRates(base);
        }

        // Return the exchange rates
        return this.exchangeRates;
    };

    /**
     * Validates that the provided currency is a string.
     *
     * @param {string} type - The type of currency ('Base' or 'Target') for error messaging purposes.
     * @param {string | null} currency - The currency code to validate.
     * @throws {Error} - Throws an error if the currency is not specified as a string.
     */
    const checkCurrency = (type: string, currency: string | null): void => {
        // Ensure the currency is a string
        if (typeof currency !== 'string') {
            throw new Error(`${type} currency must be specified as a string`);
        }
    };

    // Return exchange rates if no query is provided
    if (query === undefined) {
        return getExchangeRates(this.baseCurrency);
    }

    // Return exchange rates if the query is a currency string
    if (typeof query === 'string' && isNaN(Number(query)) && !fromCurrency && !toCurrency) {
        return getExchangeRates(query);
    }

    // Convert amount to all available currencies if no target currency is provided
    if (fromCurrency && !toCurrency) {
        return (async (fromCurrency: string) => {
            // Validate the base currency
            checkCurrency('Base', fromCurrency);

            // Fetch rates for the base currency
            if (fromCurrency) {
                await getRates(fromCurrency);
            }

            // Convert the amount to all available currencies
            return Promise.all(
                Object.keys(this.exchangeRates!).map(async (key) => ({
                    [key]: await convert(query, fromCurrency, key)
                }))
            );
        })(fromCurrency);
    }

    // Convert amount from base to target currency
    if (fromCurrency && toCurrency) {
        return (async (fromCurrency: string, toCurrency: string) => {
            // Validate base and target currencies
            checkCurrency('Base', fromCurrency);
            checkCurrency('Target', toCurrency);

            // Fetch rates for the base currency
            if (fromCurrency) {
                await getRates(fromCurrency);
            }

            // Convert the amount to the target currency
            return await convert(query, fromCurrency, toCurrency);
        })(fromCurrency, toCurrency);
    }

    // Handle method chaining
    return {
        from: (fromCurrency: string) => {
            // Validate the base currency
            checkCurrency('Base', fromCurrency);

            // Set the base currency
            this.baseCurrency = fromCurrency;

            return {
                to: async (toCurrency: string) => {
                    // Validate the target currency
                    checkCurrency('Target', toCurrency);

                    // Convert the amount to the target currency
                    return await convert(query as number, fromCurrency, toCurrency);
                }
            };
        }
    };
}

export default fx as FX;
