"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const VError = require("verror");
const BaseContract_1 = require("./BaseContract");
class Token extends BaseContract_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultSendOptions);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.jsonInterface = jsonInterface;
        this.contractBinary = contractBinary;
        this.defaultSendOptions = defaultSendOptions;
        this.transactions = {};
        this.contract = new ethers_1.Contract(contractAddress, jsonInterface, this.transactionsProvider);
    }
    deployContract(contractOwner, sendOptions, symbol = "TOK", tokenName = "Token name") {
        return super.deployContract(contractOwner, sendOptions, symbol, tokenName);
    }
    // transfer an amount of tokens from one address to another
    transfer(fromAddress, toAddress, amount, sendOptions) {
        return super.send("transfer", fromAddress, sendOptions, toAddress, amount);
    }
    approve(txSignerAddress, spenderAddress, value, sendOptions) {
        return super.send("approve", txSignerAddress, sendOptions, spenderAddress, value);
    }
    increaseApproval(txSignerAddress, spenderAddress, value, sendOptions) {
        return super.send("increaseApproval", txSignerAddress, sendOptions, spenderAddress, value);
    }
    decreaseApproval(txSignerAddress, spenderAddress, value, sendOptions) {
        return super.send("decreaseApproval", txSignerAddress, sendOptions, spenderAddress, value);
    }
    transferFrom(txSignerAddress, fromAddress, toAddress, amount, sendOptions) {
        return super.send("transferFrom", txSignerAddress, sendOptions, fromAddress, toAddress, amount);
    }
    getSymbol() {
        return super.call("symbol");
    }
    getName() {
        return super.call("name");
    }
    getDecimals() {
        return super.call("decimals");
    }
    getTotalSupply() {
        return super.call("totalSupply");
    }
    getAllowance(ownerAddress, spenderAddress) {
        return super.call("allowance", ownerAddress, spenderAddress);
    }
    getBalanceOf(address) {
        return super.call("balanceOf", address);
    }
    async getHolderBalances() {
        const description = `all token holder balances from contract address ${this.contract.address}`;
        try {
            const transferEvents = await this.getEvents("Transfer");
            const holderBalances = {};
            transferEvents.forEach(event => {
                const fromAddress = event.fromAddress, toAddress = event.toAddress, amount = Number(event.amount);
                // if deposit
                if (fromAddress == '0x0000000000000000000000000000000000000000') {
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
                else if (toAddress == '0x0000000000000000000000000000000000000000') {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                }
                else {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
            });
            return holderBalances;
        }
        catch (err) {
            const error = new VError(err, `Could not get ${description}`);
            console.log(error.stack);
            throw error;
        }
    }
}
exports.default = Token;
//# sourceMappingURL=Token.js.map