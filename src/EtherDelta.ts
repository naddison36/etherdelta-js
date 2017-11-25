import {provider as Provider,
    Wallet, Contract, utils, SigningKey} from 'ethers';
import {ecsign, toBuffer, bufferToHex} from "ethereumjs-util";
import * as VError from 'verror';
import * as logger from 'config-logger';
import * as BN from 'bn.js';

import BaseContract from './BaseContract';
import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

const ether2WeiMultiplier = new BN('1000000000000000000');

export interface ISignature {
    v: number,
    r: Uint8Array,
    s: Uint8Array
}

export interface IEtherTrade {
    blockNumber: number,
    etherAmount: BN,
    tokenAddress: string,
    tokenAmount: BN
}
export default class EtherDelta extends BaseContract
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                readonly jsonInterface: object[], readonly contractBinary?: string,
                contractAddress?: string,
                readonly defaultGasPrice = 1000000000, readonly defaultGasLimit = 120000)
    {
        // TODO is this contructor even need to be declared here?

        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultGasPrice, defaultGasLimit);
    }

    deployContract(contractOwner: string, gasLimit: number, gasPrice: number,
                   feeAccount: string, feeMake: number, feeTake: number): Promise<TransactionReceipt> {
        return super.deployContract(contractOwner, gasLimit, gasPrice, feeAccount, feeMake, feeTake);
    }

    // deposit ether into the EtherDelta contract
    depositEther(txSignerAddress: string, etherAmount: BN,
             gasLimit: number = 25000,
             gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        if (!(etherAmount instanceof BN))
        {
            const error = new VError(`etherAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }

        const description = `deposit ${etherAmount.toString()} ether with tx signer address ${txSignerAddress}, by calling the deposit function on the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                const weiAmount = etherAmount.mul(ether2WeiMultiplier);

                // send the transaction
                const broadcastTransaction = await contract.deposit({
                    gasPrice: gasPrice,
                    gasLimit: gasLimit,
                    value: '0x' + weiAmount.toString(16)
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

    // deposit ether into the EtherDelta contract
    depositToken(txSignerAddress: string, tokenAddress: string, tokenAmount: BN,
                 gasLimit: number = 100000,
                 gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        if (!(tokenAmount instanceof BN))
        {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }

        const description = `deposit ${tokenAmount.toString()} tokens at address ${tokenAddress} with tx signer address ${txSignerAddress} into the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                const hexTokenAmount = '0x' + tokenAmount.toString(16);

                // send the transaction
                const broadcastTransaction = await contract.depositToken(tokenAddress, hexTokenAmount, {
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

    withdrawToken(txSignerAddress: string, tokenAddress: string, tokenAmount: BN,
                 gasLimit: number = 100000,
                 gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        if (!(tokenAmount instanceof BN))
        {
            const error = new VError(`tokenAmount was not an instanceof BN (BigNumber).`);
            logger.error(error.stack);
            throw error;
        }

        const description = `withdraw ${tokenAmount.toString()} tokens at address ${tokenAddress} with tx signer address ${txSignerAddress} from the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                const hexTokenAmount = '0x' + tokenAmount.toString(16);

                // send the transaction
                const broadcastTransaction = await contract.withdrawToken(tokenAddress, hexTokenAmount, {
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

    placeOrder(txSignerAddress:string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
                  expires: number, nonce: number,
                  gasLimit: number = 35000,
                  gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `place order for ${getTokenAmount.toString()} taker tokens with address ${getTokenAddress}, ${giveTokenAmount.toString()} taker tokens with address ${giveTokenAddress}, tx signer address ${txSignerAddress}, expires ${expires.toString()}, nonce ${nonce} from the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

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

                const signature = ecsign(
                    toBuffer(orderHash),
                    toBuffer(privateKey));

                const r = bufferToHex(signature.r);
                const s = bufferToHex(signature.s);
                const v = bufferToHex(signature.v);

                logger.debug(`Order hash ${orderHash} has r ${signature.r}, s ${signature.s} and v ${v} values for ${description}`);

                // send the transaction
                //address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s) {
                const broadcastTransaction = await contract.order(
                    ...orderParams, v, r, s,
                    {
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

    cancelOrder(txSignerAddress:string, getTokenAddress: string, getTokenAmount: BN, giveTokenAddress: string, giveTokenAmount: BN,
               expires: number, nonce: number,
               gasLimit: number = 2000000,
               gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `cancel order for ${getTokenAmount.toString()} taker tokens with address ${getTokenAddress}, ${giveTokenAmount.toString()} taker tokens with address ${giveTokenAddress}, tx signer address ${txSignerAddress}, expires ${expires.toString()}, nonce ${nonce} from the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

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

                const orderSignature = wallet.signMessage(orderHash);

                // send the transaction
                //cancelOrder(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s) {
                const broadcastTransaction = await contract.cancelOrder(
                    ...orderParams,
                    '0x' + orderSignature.slice(130, 132),
                    orderSignature.slice(0, 66),
                    '0x' + orderSignature.slice(66, 130),
                    {
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

    async getFeeAccount(): Promise<string>
    {
        const description = `address of fee account for EtherDelta contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.feeAccount();
            const feeAccount = result[0];

            logger.info(`Got ${feeAccount} ${description}`);
            return feeAccount;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getMakerFee(): Promise<BN>
    {
        const description = `maker fee as a percentage of 1 Ether for the EtherDelta contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.feeMake();
            const feeMake = result[0]._bn;

            logger.info(`Got ${feeMake} ${description}`);
            return feeMake;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getTakerFee(): Promise<BN>
    {
        const description = `maker fee as a percentage of 1 Ether for the EtherDelta contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.feeTake();
            const feeTake = result[0]._bn;

            logger.info(`Got ${feeTake} ${description}`);
            return feeTake;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
    }

    async getBalanceOf(token: string, user: string): Promise<BN>
    {
        const description = `balance of tokens with address ${token} for user ${user} for the EtherDelta contract at address ${this.contract.address}`;

        try
        {
            const result = await this.contract.balanceOf(token, user);
            const feeTake = result[0]._bn;

            logger.info(`Got ${feeTake} ${description}`);
            return feeTake;
        }
        catch (err)
        {
            const error = new VError(err, `Could not get ${description}`);
            logger.error(error.stack);
            throw error;
        }
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

    ecrecover(txSignerAddress:string, hash: string, v: number, r: string, s: string,
                gasLimit: number = 3000000,
                gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `ecrecover from the EtherDelta contract ${self.contract.address}, gas limit ${gasLimit} and gas price ${gasPrice}`;

        return new Promise<TransactionReceipt>(async (resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(txSignerAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);
                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                // send the transaction
                //ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) public returns (address)
                const broadcastTransaction = await contract.ecrecover(hash, v, r, s, {
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