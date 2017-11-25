"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VError = require("verror");
const logger = require("config-logger");
const ethers_1 = require("ethers");
const Token_1 = require("./Token");
class IssuableToken extends Token_1.default {
    constructor(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultGasPrice = 1000000000, defaultGasLimit = 120000) {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface, contractBinary, contractAddress, defaultGasPrice, defaultGasLimit);
        this.transactionsProvider = transactionsProvider;
        this.eventsProvider = eventsProvider;
        this.keyStore = keyStore;
        this.defaultGasPrice = defaultGasPrice;
        this.defaultGasLimit = defaultGasLimit;
    }
    // deploy a new web3Contract
    deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName) {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }
    // deposit an amount of tokens to an address
    deposit(contractOwner, toAddress, amount, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${contractOwner}, contract ${this.contract.address}, gas limit ${gasLimit} (0x${gasLimit.toString(16)}) and gas price ${gasPrice} (0x${gasPrice.toString(16)})`;
        return new Promise(async (resolve, reject) => {
            try {
                // send the transaction
                const broadcastTransaction = await self.contract.deposit(toAddress, amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
    // token hold withdraws an amount of tokens
    withdraw(tokenHolderAddress, amount, gasLimit = this.defaultGasLimit, gasPrice = this.defaultGasPrice) {
        const self = this;
        const description = `request withdraw of ${amount} tokens from contract ${this.contract.address} and token holder ${tokenHolderAddress}`;
        return new Promise(async (resolve, reject) => {
            try {
                const privateKey = await self.keyStore.getPrivateKey(tokenHolderAddress);
                const wallet = new ethers_1.Wallet(privateKey, self.transactionsProvider);
                const contract = new ethers_1.Contract(self.contract.address, self.jsonInterface, wallet);
                // send the transaction
                const broadcastTransaction = await contract.withdraw(amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });
                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);
                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);
                resolve(transactionReceipt);
            }
            catch (err) {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
}
exports.default = IssuableToken;
//# sourceMappingURL=IssuableToken.js.map