import {provider as Provider, Contract, utils} from 'ethers';
import {ecsign, toBuffer, bufferToHex} from "ethereumjs-util";
import * as VError from 'verror';
import * as logger from 'config-logger';
import * as BN from 'bn.js';

import BaseContract, {SendOptions} from './BaseContract';
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
export default class EtherDelta extends BaseContract
{
    deployContract(contractOwner: string, sendOptions: SendOptions = {gasLimit: 2000000},
                   feeAccount: string, feeMake: number, feeTake: number): Promise<TransactionReceipt> {
        return super.deployContract(contractOwner, sendOptions, feeAccount, feeMake, feeTake);
    }

    // deposit ether into the EtherDelta contract
    depositEther(txSignerAddress: string, etherAmount: BN, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        const weiAmount = etherAmount.mul(ether2WeiMultiplier);

        const newSendOptions = Object.assign({}, sendOptions, {
            value: '0x' + weiAmount.toString(16)
        });

        return super.send("deposit", txSignerAddress, newSendOptions);
    }

    // deposit tokens into the EtherDelta contract
    depositToken(txSignerAddress: string, tokenAddress: string, tokenAmount: BN, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        if (!(tokenAmount instanceof BN))
        {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }

        return super.send("depositToken", txSignerAddress, sendOptions, tokenAddress, '0x' + tokenAmount.toString(16));
    }

    withdrawEther(txSignerAddress: string, etherAmount: BN, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        const weiAmount = etherAmount.mul(ether2WeiMultiplier);

        return super.send("withdraw", txSignerAddress, sendOptions, '0x' + weiAmount.toString(16));
    }

    withdrawToken(txSignerAddress: string, tokenAddress: string, tokenAmount: BN, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        if (!(tokenAmount instanceof BN))
        {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }

        return super.send("withdrawToken", txSignerAddress, sendOptions, tokenAddress, '0x' + tokenAmount.toString(16));
    }

    async signOrder(txSignerAddress:string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
              expires: number, nonce: number): Promise<[ISignature, (string|number)[]]>
    {
        // params in Solidity: address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s)
        const orderParams = [
            getTokenAddress,
            '0x' + getTokenAmount.toString(16),
            giveTokenAddress,
            '0x' + giveTokenAmount.toString(16),
            expires,
            nonce];

        const orderHash = utils.soliditySha256(
            ['address','uint','address', 'uint','uint','uint'],
            orderParams);

        const privateKey = await this.keyStore.getPrivateKey(txSignerAddress);

        const signature = ecsign(
            toBuffer(orderHash),
            toBuffer(privateKey));

        const convertedSignature = {
            r: bufferToHex(signature.r),
            s: bufferToHex(signature.s),
            v: signature.v
        };

        logger.debug(`Order hash ${orderHash} has r ${convertedSignature.r}, s ${convertedSignature.s} and v ${convertedSignature.v} values for order`);
        
        return [convertedSignature, orderParams];
    }

    async placeOrder(txSignerAddress:string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
                  expires: number, nonce: number, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        const [sig, orderParams] = await this.signOrder(...arguments);

        return super.send("order", txSignerAddress, sendOptions, ...orderParams,  sig.v, sig.r, sig.s);
    }

    async cancelOrder(txSignerAddress:string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
               expires: number, nonce: number, sendOptions: SendOptions = this.defaultSendOptions): Promise<TransactionReceipt>
    {
        const [sig, orderParams] = await this.signOrder(...arguments);

        return super.send("cancelOrder", txSignerAddress, sendOptions, ...orderParams,  sig.v, sig.r, sig.s);
    }

    async getFeeAccount(): Promise<string>
    {
        return super.call("feeAccount");
    }

    async getMakerFee(): Promise<BN>
    {
        return super.call("feeMake");
    }

    async getTakerFee(): Promise<BN>
    {
        return super.call("feeTake");
    }

    async getBalanceOf(token: string, user: string): Promise<BN>
    {
        return super.call("balanceOf", token, user);
    }

    async getEtherTrades(fromBlock = 3154196): Promise<IEtherTrade[]>
    {
        const events = await this.getEvents("Trade", fromBlock);

        const etherTrades: IEtherTrade[] = [];

        for (const event of events)
        {
            if (event.tokenGet == '0x0000000000000000000000000000000000000000')
            {
                const etherAmount = event.amountGet.div(ether2WeiMultiplier);

                etherTrades.push({
                    blockNumber: event.blockNumber,
                    etherAmount: etherAmount,
                    tokenAddress: event.tokenGive,
                    tokenAmount: event.amountGive
                });
            }
            else if (event.tokenGive = '0x0000000000000000000000000000000000000000')
            {
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