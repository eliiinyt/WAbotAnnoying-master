const axios = require('axios');

class GG {
    constructor(m, b, defaultValue) {
        this.m = m;
        this.b = b;
        this.default = defaultValue;
    }

    static async fromHitomi() {
        try {
            const response = await axios.get(`https://ltn.example.com/gg.js`);
            if (response.status >= 200 && response.status < 300) {
                return GG.fromJs(response.data);
            } else {
                throw console.error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            throw console.error(`Failed to fetch gg.js: ${error.message}`);
        }
    }

    static fromJs(s) {
        const parsedGG = parseGg(s);
        if (parsedGG) {
            return parsedGG;
        } else {
            throw new ParseError();
        }
    }

    m(key) {
        return this.m.get(key) || this.default;
    }

    b() {
        return this.b;
    }
}

function parseGg(s) {
    const defaultRegex = /(var\s|default:)\s*o\s*=\s*(?<default>\d+)/si;
    const defaultMatch = defaultRegex.exec(s);
    if (!defaultMatch) return null;

    const defaultValue = parseInt(defaultMatch.groups.default, 10);

    const caseRegex = /case\s+(?<key>\d+):\s+o?\s*=?\s*(?<value>\d+)?/gi;
    const m = new Map();
    let keys = [];

    let match;
    while ((match = caseRegex.exec(s)) !== null) {
        const key = parseInt(match.groups.key, 10);
        keys.push(key);

        if (match.groups.value !== undefined) {
            const value = parseInt(match.groups.value, 10);
            while (keys.length > 0) {
                m.set(keys.shift(), value);
            }
        }
    }

    const condRegex = /if\s*\(\s*g\s*===\s*(?<key>\d+)\s*\)\s*\{?\s*o\s*=\s*(?<value>\d+);?\s*\)?/gi;
    while ((match = condRegex.exec(s)) !== null) {
        const key = parseInt(match.groups.key, 10);
        const value = parseInt(match.groups.value, 10);
        m.set(key, value);
    }

    const bRegex = /b:\s*["'](?<b>.+?)["']/si;
    const bMatch = bRegex.exec(s);
    if (!bMatch) return null;

    let b = bMatch.groups.b;
    if (b.endsWith('/')) {
        b = b.slice(0, -1);
    }

    return new GG(m, b, defaultValue);


    
}




module.exports = { GG };
