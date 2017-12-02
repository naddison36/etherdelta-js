"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const ethereumjs_util_1 = require("ethereumjs-util");
const VError = require("verror");
const logger = require("config-logger");
const BN = require("bn.js");
const BaseContract_1 = require("./BaseContract");
const ether2WeiMultiplier = new BN('1000000000000000000');
class EtherDelta extends BaseContract_1.default {
    deployContract(contractOwner, sendOptions = { gasLimit: 2000000 }, feeAccount, feeMake, feeTake) {
        return super.deployContract(contractOwner, sendOptions, feeAccount, feeMake, feeTake);
    }
    // deposit ether into the EtherDelta contract
    depositEther(txSignerAddress, etherAmount, sendOptions = this.defaultSendOptions) {
        const weiAmount = etherAmount.mul(ether2WeiMultiplier);
        const newSendOptions = Object.assign({}, sendOptions, {
            value: '0x' + weiAmount.toString(16)
        });
        return super.send("deposit", txSignerAddress, newSendOptions);
    }
    // deposit tokens into the EtherDelta contract
    depositToken(txSignerAddress, tokenAddress, tokenAmount, sendOptions = this.defaultSendOptions) {
        if (!(tokenAmount instanceof BN)) {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }
        return super.send("depositToken", txSignerAddress, sendOptions, tokenAddress, '0x' + tokenAmount.toString(16));
    }
    withdrawEther(txSignerAddress, etherAmount, sendOptions = this.defaultSendOptions) {
        const weiAmount = etherAmount.mul(ether2WeiMultiplier);
        return super.send("withdraw", txSignerAddress, sendOptions, '0x' + weiAmount.toString(16));
    }
    withdrawToken(txSignerAddress, tokenAddress, tokenAmount, sendOptions = this.defaultSendOptions) {
        if (!(tokenAmount instanceof BN)) {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }
        return super.send("withdrawToken", txSignerAddress, sendOptions, tokenAddress, '0x' + tokenAmount.toString(16));
    }
    async signOrder(txSignerAddress, getTokenAddress, getTokenAmount, giveTokenAddress, giveTokenAmount, expires, nonce) {
        // params in Solidity: address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s)
        const orderParams = [
            getTokenAddress,
            '0x' + getTokenAmount.toString(16),
            giveTokenAddress,
            '0x' + giveTokenAmount.toString(16),
            expires,
            nonce
        ];
        const orderHash = ethers_1.utils.soliditySha256(['address', 'uint', 'address', 'uint', 'uint', 'uint'], orderParams);
        const privateKey = await this.keyStore.getPrivateKey(txSignerAddress);
        const signature = ethereumjs_util_1.ecsign(ethereumjs_util_1.toBuffer(orderHash), ethereumjs_util_1.toBuffer(privateKey));
        const convertedSignature = {
            r: ethereumjs_util_1.bufferToHex(signature.r),
            s: ethereumjs_util_1.bufferToHex(signature.s),
            v: signature.v
        };
        logger.debug(`Order hash ${orderHash} has r ${convertedSignature.r}, s ${convertedSignature.s} and v ${convertedSignature.v} values for order`);
        return [convertedSignature, orderParams];
    }
    async placeOrder(txSignerAddress, getTokenAddress, getTokenAmount, giveTokenAddress, giveTokenAmount, expires, nonce, sendOptions = this.defaultSendOptions) {
        const [sig, orderParams] = await this.signOrder(...arguments);
        return super.send("order", txSignerAddress, sendOptions, ...orderParams, sig.v, sig.r, sig.s);
    }
    async cancelOrder(txSignerAddress, getTokenAddress, getTokenAmount, giveTokenAddress, giveTokenAmount, expires, nonce, sendOptions = this.defaultSendOptions) {
        const [sig, orderParams] = await this.signOrder(...arguments);
        return super.send("cancelOrder", txSignerAddress, sendOptions, ...orderParams, sig.v, sig.r, sig.s);
    }
    async getFeeAccount() {
        return super.call("feeAccount");
    }
    async getMakerFee() {
        return super.call("feeMake");
    }
    async getTakerFee() {
        return super.call("feeTake");
    }
    async getBalanceOf(token, user) {
        return super.call("balanceOf", token, user);
    }
    async getEtherTrades(fromBlock = 3154196) {
        const events = await this.getEvents("Trade", fromBlock);
        const etherTrades = [];
        for (const event of events) {
            if (event.tokenGet == '0x0000000000000000000000000000000000000000') {
                const etherAmount = event.amountGet.div(ether2WeiMultiplier);
                etherTrades.push({
                    blockNumber: event.blockNumber,
                    etherAmount: etherAmount,
                    tokenAddress: event.tokenGive,
                    tokenAmount: event.amountGive
                });
            }
            else if (event.tokenGive = '0x0000000000000000000000000000000000000000') {
                const etherAmount = event.amountGive.div(ether2WeiMultiplier);
                etherTrades.push({
                    blockNumber: event.blockNumber,
                    etherAmount: etherAmount,
                    tokenAddress: event.tokenGet,
                    tokenAmount: event.amountGet
                });
            }
        }
        return etherTrades;
    }
}
exports.default = EtherDelta;
//# sourceMappingURL=EtherDelta.js.map