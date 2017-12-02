import {provider as Provider, Contract} from 'ethers';
import {ecsign, toBuffer, bufferToHex} from "ethereumjs-util";
import * as VError from 'verror';
import * as logger from 'config-logger';
import * as BN from 'bn.js';

import BaseContract, {SendOptions} from './BaseContract';
import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

const ether2WeiMultiplier = new BN('1000000000000000000');

interface ISignature {
    v: number,
    r: String,
    s: String
}

export interface IEtherTrade {
    blockNumber: number,
    etherAmount: BN,
    tokenAddress: string,
    tokenAmount: BN
}
export default class TestCrypto extends BaseContract
{
    deployContract(contractOwner: string, sendOptions: SendOptions = {gasLimit: 1000000}): Promise<TransactionReceipt> {
        return super.deployContract(contractOwner, sendOptions);
    }

    async signOrder(getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
                 expires: number, nonce: number): Promise<string>
    {
        return super.call("signOrder",
            getTokenAddress,
            '0x' + getTokenAmount.toString(16),
            giveTokenAddress,
            '0x' + giveTokenAmount.toString(16),
            expires,
            nonce);
    }

    async testOrderHash(expected: string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
                 expires: number, nonce: number): Promise<boolean>
    {
        return super.call("testOrderHash",
            expected,
            getTokenAddress,
            '0x' + getTokenAmount.toString(16),
            giveTokenAddress,
            '0x' + giveTokenAmount.toString(16),
            expires,
            nonce);
    }

    async ecrecover(hash: string, v: number, r: string, s: string): Promise<string>
    {
        return super.call("ecrecover", ...arguments);
    }
}