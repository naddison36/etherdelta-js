import {Wallet, Contract,
    provider as Provider} from 'ethers';
import * as BN from 'bn.js';
import * as logger from 'config-logger';
import * as VError from 'verror';

import BaseContract, {SendOptions} from './BaseContract';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from "./index";

declare type HolderBalances = {
    [holderAddress: string] : number
};

export default class Token extends BaseContract
{
    contract: object;

    transactions: { [transactionHash: string] : number; } = {};

    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                readonly jsonInterface: object[], readonly contractBinary: string, contractAddress?: string,
                readonly defaultSendOptions?: SendOptions)
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultSendOptions);

        this.contract = new Contract(contractAddress, jsonInterface, this.transactionsProvider);
    }

    deployContract(contractOwner: string, sendOptions?: SendOptions, symbol: string = "TOK", tokenName: string = "Token name"): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, sendOptions, symbol, tokenName);
    }

    // transfer an amount of tokens from one address to another
    transfer(fromAddress: string, toAddress: string, amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("transfer", fromAddress, sendOptions, toAddress, amount);
    }

    approve(txSignerAddress: string, spenderAddress: string, value: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("approve", txSignerAddress, sendOptions, spenderAddress, value);
    }

    increaseApproval(txSignerAddress: string, spenderAddress: string, value: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("increaseApproval", txSignerAddress, sendOptions, spenderAddress, value);
    }

    decreaseApproval(txSignerAddress: string, spenderAddress: string, value: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("decreaseApproval", txSignerAddress, sendOptions, spenderAddress, value);
    }

    transferFrom(txSignerAddress: string, fromAddress: string, toAddress: string, amount: number, sendOptions?: SendOptions): Promise<TransactionReceipt>
    {
        return super.send("transferFrom", txSignerAddress, sendOptions, fromAddress, toAddress, amount);
    }

    getSymbol(): Promise<string>
    {
        return super.call("symbol");
    }

    getName(): Promise<string>
    {
        return super.call("name");
    }

    getDecimals(): Promise<BN>
    {
        return super.call("decimals");
    }

    getTotalSupply(): Promise<BN>
    {
        return super.call("totalSupply");
    }

    getAllowance(ownerAddress: string, spenderAddress: string): Promise<BN>
    {
        return super.call("allowance", ownerAddress, spenderAddress);
    }

    getBalanceOf(address: string): Promise<BN>
    {
        return super.call("balanceOf", address);
    }

    async getHolderBalances(): Promise<HolderBalances>
    {
        const description = `all token holder balances from contract address ${this.contract.address}`;

        try {
            const transferEvents = await this.getEvents("Transfer");

            const holderBalances: HolderBalances = {};

            transferEvents.forEach(event => {
                const fromAddress: string = event.fromAddress,
                    toAddress: string = event.toAddress,
                    amount: number = Number(event.amount);

                // if deposit
                if(fromAddress == '0x0000000000000000000000000000000000000000')
                {
                    holderBalances[toAddress] = (holderBalances[toAddress]) ?
                        holderBalances[toAddress] += amount :
                        holderBalances[toAddress] = amount;
                }
                // if withdrawal
                else if(toAddress == '0x0000000000000000000000000000000000000000')
                {
                    holderBalances[fromAddress] = (holderBalances[fromAddress]) ?
                        holderBalances[fromAddress] -= amount :
                        holderBalances[fromAddress] = -amount;
                }
                // if transfer
                else
                {
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
        catch(err) {
            const error = new VError(err, `Could not get ${description}`);
            console.log(error.stack);
            throw error;
        }
    }
}
