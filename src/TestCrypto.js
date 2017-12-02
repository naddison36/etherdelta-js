"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BN = require("bn.js");
const BaseContract_1 = require("./BaseContract");
const ether2WeiMultiplier = new BN('1000000000000000000');
class TestCrypto extends BaseContract_1.default {
    deployContract(contractOwner, sendOptions = { gasLimit: 1000000 }) {
        return super.deployContract(contractOwner, sendOptions);
    }
    async signOrder(getTokenAddress, getTokenAmount, giveTokenAddress, giveTokenAmount, expires, nonce) {
        return super.call("signOrder", getTokenAddress, '0x' + getTokenAmount.toString(16), giveTokenAddress, '0x' + giveTokenAmount.toString(16), expires, nonce);
    }
    async testOrderHash(expected, getTokenAddress, getTokenAmount, giveTokenAddress, giveTokenAmount, expires, nonce) {
        return super.call("testOrderHash", expected, getTokenAddress, '0x' + getTokenAmount.toString(16), giveTokenAddress, '0x' + giveTokenAmount.toString(16), expires, nonce);
    }
    async ecrecover(hash, v, r, s) {
        return super.call("ecrecover", ...arguments);
    }
}
exports.default = TestCrypto;
//# sourceMappingURL=TestCrypto.js.map