import {provider as Provider} from 'ethers';
import {Wallet, Contract} from 'ethers';

import Token from './Token';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';
import {SendOptions} from "./BaseContract";

export default class IssuableToken extends Token
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                jsonInterface: object[], contractBinary?: string, contractAddress?: string,
                readonly defaultSendOptions: SendOptions = {
                    gasPrice: 2000000000,
                    gasLimit: 1200000})
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultSendOptions);
    }

    deployContract(contractOwner: string, sendOptions: SendOptions = {gasLimit: 2000000}, symbol: string, tokenName: string): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, sendOptions, symbol, tokenName);
    }

    deposit(txSignerAddress: string, toAddress: string, amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("deposit", txSignerAddress, sendOptions, toAddress, amount);
    }

    withdraw(txSignerAddress: string, amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("withdraw", txSignerAddress, sendOptions, amount);
    }
}
