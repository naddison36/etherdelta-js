"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Token_1 = require("./Token");
class IssuableToken extends Token_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions = {
            gasPrice: 2000000000,
            gasLimit: 1200000
        }) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.defaultSendOptions = defaultSendOptions;
    }
    deployContract(contractOwner, sendOptions = { gasLimit: 2000000 }, symbol, tokenName) {
        return super.deployContract(contractOwner, sendOptions, symbol, tokenName);
    }
    deposit(txSignerAddress, toAddress, amount, sendOptions) {
        return super.send("deposit", txSignerAddress, sendOptions, toAddress, amount);
    }
    withdraw(txSignerAddress, amount, sendOptions) {
        return super.send("withdraw", txSignerAddress, sendOptions, amount);
    }
}
exports.default = IssuableToken;
//# sourceMappingURL=IssuableToken.js.map