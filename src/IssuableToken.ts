import {provider as Provider} from 'ethers';
import * as VError from 'verror';
import * as logger from 'config-logger';
import {Wallet, Contract} from 'ethers';

import Token from './Token';

import {KeyStore} from './keyStore/index.d';
import {TransactionReceipt} from './index';

export default class IssuableToken extends Token
{
    constructor(readonly transactionsProvider: Provider, readonly eventsProvider: Provider,
                readonly keyStore: KeyStore,
                jsonInterface: object[], contractBinary?: string, contractAddress?: string,
                readonly defaultGasPrice = 1000000000, readonly defaultGasLimit = 120000)
    {
        super(transactionsProvider, eventsProvider, keyStore, jsonInterface,
            contractBinary, contractAddress, defaultGasPrice, defaultGasLimit);
    }

    // deploy a new web3Contract
    deployContract(contractOwner: string, gasLimit: number, gasPrice: number, symbol: string, tokenName: string): Promise<TransactionReceipt>
    {
        return super.deployContract(contractOwner, gasLimit, gasPrice, symbol, tokenName);
    }

    // deposit an amount of tokens to an address
    deposit(contractOwner: string, toAddress: string, amount: number,
            gasLimit: number = this.defaultGasLimit,
            gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `deposit ${amount} tokens to address ${toAddress}, from sender address ${contractOwner}, contract ${this.contract.address}, gas limit ${gasLimit} (0x${gasLimit.toString(16)}) and gas price ${gasPrice} (0x${gasPrice.toString(16)})`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                // send the transaction
                const broadcastTransaction = await self.contract.deposit(toAddress, amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }

    // token hold withdraws an amount of tokens
    withdraw(tokenHolderAddress: string, amount: number,
              gasLimit: number = this.defaultGasLimit,
              gasPrice: number = this.defaultGasPrice): Promise<TransactionReceipt>
    {
        const self = this;

        const description = `request withdraw of ${amount} tokens from contract ${this.contract.address} and token holder ${tokenHolderAddress}`;

        return new Promise<TransactionReceipt>(async(resolve, reject) =>
        {
            try
            {
                const privateKey = await self.keyStore.getPrivateKey(tokenHolderAddress);
                const wallet = new Wallet(privateKey, self.transactionsProvider);

                const contract = new Contract(self.contract.address, self.jsonInterface, wallet);

                // send the transaction
                const broadcastTransaction = await contract.withdraw(amount, {
                    gasPrice: gasPrice,
                    gasLimit: gasLimit
                });

                logger.debug(`${broadcastTransaction.hash} is transaction hash and nonce ${broadcastTransaction.nonce} for ${description}`);

                const transactionReceipt = await self.processTransaction(broadcastTransaction.hash, description, gasLimit);

                resolve(transactionReceipt);
            }
            catch (err)
            {
                const error = new VError(err, `Failed to ${description}.`);
                logger.error(error.stack);
                reject(error);
            }
        });
    }
}
