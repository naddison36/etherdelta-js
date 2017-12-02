import * as BN from 'bn.js';
import {providers as Providers, Wallet, utils, SigningKey} from 'ethers';
import {ecsign, ecrecover, toBuffer, bufferToHex, bufferToInt, publicToAddress} from "ethereumjs-util";

import EtherDelta, {ISignature} from '../EtherDelta';
import BaseContract from '../BaseContract';
import IssuableToken from '../IssuableToken';
import KeyStore from '../keyStore/keyStore-hardcoded';

import {TransactionReceipt} from "./index";

const etherDeltaContractOwner = '0x2e988A386a799F506693793c6A5AF6B54dfAaBfB',
    feeAccount = '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A',
    trader1 = '0x1563915e194D8CfBA1943570603F7606A3115508',
    trader2 = '0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB',
    etherToken = '0x0000000000000000000000000000000000000000',
    token1Owner = '0x7564105E977516C53bE337314c7E53838967bDaC',
    token2Owner = '0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9';

const defaultGasPrice = 2000000000,
    defaultGasLimit = 1900000,
    chainId = 0;

describe("EtherDelta", ()=>
{
    const rpcProvider = process.env.RPCPROVIDER || "http://localhost:8646";
    const transactionsProvider = new Providers.JsonRpcProvider(rpcProvider, true, chainId);
    const eventsProvider = new Providers.JsonRpcProvider(rpcProvider, true, chainId);

    const keyStore = new KeyStore();

    const etherDeltaJsonInterface = BaseContract.loadJsonInterfaceFromFile('./bin/contracts/EtherDelta');
    const etherDeltaContractBinary = BaseContract.loadBinaryFromFile('./bin/contracts/EtherDelta');

    const etherDelta = new EtherDelta(transactionsProvider, eventsProvider,
        keyStore,
        etherDeltaJsonInterface,
        etherDeltaContractBinary,
        null   // contract address
    );

    const issuableTokenJsonInterface = BaseContract.loadJsonInterfaceFromFile('./bin/contracts/IssuableToken');
    const issuableTokenContractBinary = BaseContract.loadBinaryFromFile('./bin/contracts/IssuableToken');

    const issuableToken1 = new IssuableToken(transactionsProvider, eventsProvider,
        keyStore,
        issuableTokenJsonInterface,
        issuableTokenContractBinary,
        null   // contract address
    );

    const issuableToken2 = new IssuableToken(transactionsProvider, eventsProvider,
        keyStore,
        issuableTokenJsonInterface,
        issuableTokenContractBinary,
        null   // contract address
    );

    describe("Deploy contract", ()=>
    {
        test('with default arguments', async () =>
        {
            expect.assertions(4);

            const txReceipt = await etherDelta.deployContract(etherDeltaContractOwner, undefined,
                feeAccount, 0, 3000000000000000);

            expect(txReceipt.contractAddress).toHaveLength(42);

            expect(await etherDelta.getFeeAccount()).toEqual(feeAccount);
            expect(await etherDelta.getMakerFee()).toEqual(new BN(0));
            expect(await etherDelta.getTakerFee()).toEqual(new BN(3000000000000000));

        }, 30000);
    });

    describe("deposit and withdrawls", ()=>
    {
        let etherDeltaContractAddress: string,
            test1TokenContractAddress: string,
            test2TokenContractAddress: string;

        beforeAll(async()=>
        {
            const etherDeltaTxReceipt = await etherDelta.deployContract(etherDeltaContractOwner, undefined,
                feeAccount, 2000000000000000, 3000000000000000);
            etherDeltaContractAddress = etherDeltaTxReceipt.contractAddress;

            const token1TxReceipt = await issuableToken1.deployContract(token1Owner, undefined,
                "TST1", "Test 1 Token");
            test1TokenContractAddress = token1TxReceipt.contractAddress;

            await issuableToken1.deposit(token1Owner, trader1, 1000);
            await issuableToken1.deposit(token1Owner, trader2, 2000);

            const token2TxReceipt = await issuableToken2.deployContract(token2Owner, undefined,
                "TST2", "Test 2 Token");
            test2TokenContractAddress = token2TxReceipt.contractAddress;

            await issuableToken2.deposit(token2Owner, trader1, 5000);
            await issuableToken2.deposit(token2Owner, trader2, 6000);
        }, 60000);

        test("checks before any deposits", async ()=>
        {
            expect.assertions(6);

            expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(0));
            expect(await etherDelta.getBalanceOf(test2TokenContractAddress, trader2)).toMatchObject(new BN(0));
            expect(await etherDelta.getBalanceOf(etherToken, trader1)).toMatchObject(new BN(0));
            expect(await etherDelta.getBalanceOf(etherToken, trader2)).toMatchObject(new BN(0));

            const depositEvents = await etherDelta.getEvents('Deposit', 1);
            expect(depositEvents).toHaveLength(0);

            const withdrawEvents = await etherDelta.getEvents('Withdraw', 1);
            expect(withdrawEvents).toHaveLength(0);
        }, 30000);

        test('deposit ether', async() =>
        {
            expect.assertions(3);

            const txReceipt = await etherDelta.depositEther(trader1, new BN(10));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(txReceipt.status).toEqual(1);

            const balance = await etherDelta.getBalanceOf(etherToken, trader1);
            expect(balance.toString()).toEqual("10000000000000000000");
        }, 30000);

        test("get event from first ether deposit", async ()=>
        {
            expect.assertions(5);

            const events = await etherDelta.getEvents('Deposit', 2);

            expect(events).toHaveLength(1);
            expect(events[0].token).toEqual(etherToken);
            expect(events[0].user).toEqual(trader1);
            expect(events[0].amount.toString()).toEqual("10000000000000000000");
            expect(events[0].balance.toString()).toEqual("10000000000000000000");
        });

        test("trader 1 deposits 100 test1 tokens", async() =>
        {
            expect.assertions(8);

            // trader 1 allows EtherDelta access to their test1 tokens
            await issuableToken1.approve(trader1, etherDeltaContractAddress, 200);

            const txReceipt = await etherDelta.depositToken(trader1, test1TokenContractAddress, new BN(100));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(txReceipt.status).toEqual(1);

            expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(100));

            const events = await etherDelta.getEvents('Deposit', 2);

            expect(events).toHaveLength(2);
            expect(events[1].token).toEqual(test1TokenContractAddress);
            expect(events[1].user).toEqual(trader1);
            expect(events[1].amount).toEqual(new BN(100));
            expect(events[1].balance).toEqual(new BN(100));
        }, 30000);

        test("trader 1 deposits another 50 test1 tokens", async() =>
        {
            expect.assertions(8);

            const txReceipt = await etherDelta.depositToken(trader1, test1TokenContractAddress, new BN(50));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(txReceipt.status).toEqual(1);

            expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(150));

            const events = await etherDelta.getEvents('Deposit', 2);

            expect(events).toHaveLength(3);
            expect(events[2].token).toEqual(test1TokenContractAddress);
            expect(events[2].user).toEqual(trader1);
            expect(events[2].amount).toMatchObject(new BN(50));
            expect(events[2].balance).toMatchObject(new BN(150));
        }, 30000);

        test("trader 2 deposits 30 test2 tokens", async() =>
        {
            expect.assertions(8);

            // trader 2 allows EtherDelta access to their test2 tokens
            await issuableToken2.approve(trader2, etherDeltaContractAddress, 70);

            const txReceipt = await etherDelta.depositToken(trader2, test2TokenContractAddress, new BN(30));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(txReceipt.status).toEqual(1);

            expect(await etherDelta.getBalanceOf(test2TokenContractAddress, trader2)).toMatchObject(new BN(30));

            const events = await etherDelta.getEvents('Deposit', 2);

            expect(events).toHaveLength(4);
            expect(events[3].token).toEqual(test2TokenContractAddress);
            expect(events[3].user).toEqual(trader2);
            expect(events[3].amount).toMatchObject(new BN(30));
            expect(events[3].balance).toMatchObject(new BN(30));
        }, 30000);

        test("trader 1 withdraws 9 test1 tokens", async() =>
        {
            expect.assertions(8);

            const txReceipt = await etherDelta.withdrawToken(trader1, test1TokenContractAddress, new BN(99));

            expect(txReceipt.transactionHash).toHaveLength(66);
            expect(txReceipt.status).toEqual(1);

            expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(51));

            const events = await etherDelta.getEvents('Withdraw', 2);

            expect(events).toHaveLength(1);
            expect(events[0].token).toEqual(test1TokenContractAddress);
            expect(events[0].user).toEqual(trader1);
            expect(events[0].amount).toMatchObject(new BN(99));
            expect(events[0].balance).toMatchObject(new BN(51));
        }, 30000);

        describe("orders", ()=>
        {
            let blockNumber: number;
            let orderNonce = 1000000000;

            beforeAll(async()=>
            {
                blockNumber = await transactionsProvider.getBlockNumber();
            });

            test("trader 1 places an order", async()=>
            {
                expect.assertions(15);

                const txReceipt = await etherDelta.placeOrder(
                    trader1,
                    test1TokenContractAddress,
                    new BN(11),
                    test2TokenContractAddress,
                    new BN(3),
                    blockNumber + 100,
                    ++orderNonce
                );

                expect(txReceipt.transactionHash).toHaveLength(66);
                expect(txReceipt.status).toEqual(1);

                const events = await etherDelta.getEvents('Order', 3);

                //event Order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s);
                expect(events).toHaveLength(1);
                expect(events[0].tokenGet).toEqual(test1TokenContractAddress);
                expect(events[0].amountGet).toEqual(new BN(11));
                expect(events[0].tokenGive).toEqual(test2TokenContractAddress);
                expect(events[0].amountGive).toEqual(new BN(3));
                expect(events[0].expires).toEqual(new BN(blockNumber + 100));
                expect(events[0].nonce).toEqual(new BN(orderNonce));
                expect(events[0].user).toEqual(trader1);

                expect(events[0].v == 27 || events[0].v == 28).toBe(true);

                expect(events[0].r).toHaveLength(66);
                expect(events[0].r.slice(0, 2)).toEqual('0x');

                expect(events[0].s).toHaveLength(66);
                expect(events[0].s.slice(0, 2)).toEqual('0x');

            }, 30000);

            test("trader 1 cancels the order", async()=>
            {
                expect.assertions(15);

                const txReceipt = await etherDelta.cancelOrder(
                    trader1,
                    test1TokenContractAddress,
                    new BN(11),
                    test2TokenContractAddress,
                    new BN(3),
                    blockNumber + 100,
                    orderNonce
                );

                expect(txReceipt.transactionHash).toHaveLength(66);
                expect(txReceipt.status).toEqual(1);

                const events = await etherDelta.getEvents('Cancel', 4);

                //event Order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s);
                expect(events).toHaveLength(1);
                expect(events[0].tokenGet).toEqual(test1TokenContractAddress);
                expect(events[0].amountGet).toEqual(new BN(11));
                expect(events[0].tokenGive).toEqual(test2TokenContractAddress);
                expect(events[0].amountGive).toEqual(new BN(3));
                expect(events[0].expires).toEqual(new BN(blockNumber + 100));
                expect(events[0].nonce).toEqual(new BN(orderNonce));
                expect(events[0].user).toEqual(trader1);

                expect(events[0].v == 27 || events[0].v == 28).toBe(true);

                expect(events[0].r).toHaveLength(66);
                expect(events[0].r.slice(0, 2)).toEqual('0x');

                expect(events[0].s).toHaveLength(66);
                expect(events[0].s.slice(0, 2)).toEqual('0x');

            }, 30000);
        });
    });
});
