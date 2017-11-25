"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const ethereumjs_util_1 = require("ethereumjs-util");
const EtherDelta_1 = require("../EtherDelta");
const BaseContract_1 = require("../BaseContract");
const IssuableToken_1 = require("../IssuableToken");
const keyStore_hardcoded_1 = require("../keyStore/keyStore-hardcoded");
const etherDeltaContractOwner = '0x2e988A386a799F506693793c6A5AF6B54dfAaBfB', feeAccount = '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A', trader1 = '0x1563915e194D8CfBA1943570603F7606A3115508', trader2 = '0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB', etherToken = '0x0000000000000000000000000000000000000000', token1Owner = '0x7564105E977516C53bE337314c7E53838967bDaC', token2Owner = '0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9';
const defaultGasPrice = 2000000000, defaultGasLimit = 1900000, chainId = 0;
describe("EtherDelta", () => {
    const rpcProvider = process.env.RPCPROVIDER || "http://localhost:8646";
    const transactionsProvider = new ethers_1.providers.JsonRpcProvider(rpcProvider, true, chainId);
    const eventsProvider = new ethers_1.providers.JsonRpcProvider(rpcProvider, true, chainId);
    const keyStore = new keyStore_hardcoded_1.default();
    const etherDeltaJsonInterface = BaseContract_1.default.loadJsonInterfaceFromFile('./bin/contracts/EtherDelta.abi');
    const etherDeltaContractBinary = BaseContract_1.default.loadBinaryFromFile('./bin/contracts/EtherDelta.bin');
    const etherDelta = new EtherDelta_1.default(transactionsProvider, eventsProvider, keyStore, etherDeltaJsonInterface, etherDeltaContractBinary, null // contract address
    );
    const issuableTokenJsonInterface = BaseContract_1.default.loadJsonInterfaceFromFile('./bin/contracts/IssuableToken.abi');
    const issuableTokenContractBinary = BaseContract_1.default.loadBinaryFromFile('./bin/contracts/IssuableToken.bin');
    const issuableToken1 = new IssuableToken_1.default(transactionsProvider, eventsProvider, keyStore, issuableTokenJsonInterface, issuableTokenContractBinary, null // contract address
    );
    const issuableToken2 = new IssuableToken_1.default(transactionsProvider, eventsProvider, keyStore, issuableTokenJsonInterface, issuableTokenContractBinary, null // contract address
    );
    describe("crypto", () => {
        beforeAll(async () => {
            await etherDelta.deployContract(etherDeltaContractOwner, defaultGasLimit, defaultGasPrice, feeAccount, 0, 3000000000000000);
        });
        test("solidity sha256 of order params", () => {
            // bytes32 hash = sha256(tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
            // "0x7564105E977516C53bE337314c7E53838967bDaC", 10, "0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9", 20, 1000, 0
            // "0": "bytes32: 0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2"
            const shaHash = ethers_1.utils.soliditySha256(['address', 'uint256', 'address', 'uint256', 'uint256', 'uint256'], ['0x7564105E977516C53bE337314c7E53838967bDaC', 10, "0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9", 20, 1000, 0]);
            expect(shaHash).toEqual('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2');
        });
        test("Ethereumjs-tx signing and recovering using secp256k1", async () => {
            expect.assertions(4);
            const messageBuffer = ethereumjs_util_1.toBuffer('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2');
            const signature = ethereumjs_util_1.ecsign(messageBuffer, // message
            ethereumjs_util_1.toBuffer('0x1111111111111111111111111111111111111111111111111111111111111111')); // privateKey
            const r = ethereumjs_util_1.bufferToHex(signature.r);
            const s = ethereumjs_util_1.bufferToHex(signature.s);
            const v = ethereumjs_util_1.bufferToInt(signature.v);
            expect(r).toEqual('0x9bffbe28cec8656bf6cbdff5f4159d220c0a2a1b1740646430cccea2f7c80491');
            expect(s).toEqual('0x534f7a8cb7574806f7f428340c2fc1bd5baa919492ca06b2a28967a1d4db5a5a');
            expect(v).toEqual(27);
            const recoveredAddressBuffer = ethereumjs_util_1.ecrecover(messageBuffer, signature.v, signature.r, signature.s);
            const recoveredAddress = ethereumjs_util_1.bufferToHex(recoveredAddressBuffer);
            //expect(recoveredAddress).toEqual('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');
            const txReceipt = await etherDelta.deployContract(etherDeltaContractOwner, defaultGasLimit, defaultGasPrice, feeAccount, 0, 3000000000000000);
            // "0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2", "0x1b", "0x9bffbe28cec8656bf6cbdff5f4159d220c0a2a1b1740646430cccea2f7c80491", "0x534f7a8cb7574806f7f428340c2fc1bd5baa919492ca06b2a28967a1d4db5a5a"
            const solidityRecoverredAddress = await etherDelta.ecrecover("0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A", "0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2", v, r, s);
            expect(solidityRecoverredAddress).toEqual("0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A");
        }, 30000);
        test("signing message and recovering the signing address", () => {
            const privateKey = '0x1111111111111111111111111111111111111111111111111111111111111111';
            const wallet = new ethers_1.Wallet(privateKey);
            expect(wallet.address).toEqual('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');
            const orderParams = [
                '0x7564105E977516C53bE337314c7E53838967bDaC',
                10,
                '0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9',
                20,
                1000,
                0
            ];
            const orderHash = ethers_1.utils.soliditySha256(['address', 'uint', 'address', 'uint', 'uint', 'uint'], orderParams);
            expect(orderHash).toEqual('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2');
            const signingKey = new ethers_1.SigningKey(privateKey);
            const signature = signingKey.signDigest(orderHash);
            // returned from personal.sign('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2',eth.accounts[0],"EtherDelta");
            //0x6bc59476415408a42010c18434cdc6e227dc307cca4e7f7b1fe354174af9cab833cc7f9fdd756c2557e9cc6b03b5caee3a3eb0e1f5652ccda8ffdaf6584d9c7f1c
            const gethSignature = '0x6bc59476415408a42010c18434cdc6e227dc307cca4e7f7b1fe354174af9cab833cc7f9fdd756c2557e9cc6b03b5caee3a3eb0e1f5652ccda8ffdaf6584d9c7f1c';
            const r = gethSignature.slice(0, 66);
            const s = '0x' + gethSignature.slice(66, 129);
            const v = '0x' + gethSignature.slice(129, 131);
            // Example from live contract
            //0x268bcb93f05ab895d96cdc87a46ac9fcddf0c1fe4824dd6453c30f7ab8ec7e83 // r value
            //0x2323f4c1717cb105a1dbd5eb1e48398af704fbdcc4c3b20d1efa9d3680e45196 // s value
            //01c   // v value
            expect(signature.r).toEqual('0x6bc59476415408a42010c18434cdc6e227dc307cca4e7f7b1fe354174af9cab8');
            expect(signature.s).toEqual('0x33cc7f9fdd756c2557e9cc6b03b5caee3a3eb0e1f5652ccda8ffdaf6584d9c7f');
            expect(signature.recoveryParam).toEqual(0);
            const recoveredAddress = ethers_1.SigningKey.recover(orderHash, signature.r, signature.s, signature.recoveryParam);
            expect(recoveredAddress).toEqual('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');
        });
    });
    // describe("Deploy contract", ()=>
    // {
    //     test('with default arguments', async () =>
    //     {
    //         expect.assertions(4);
    //
    //         const txReceipt = await etherDelta.deployContract(etherDeltaContractOwner, defaultGasLimit, defaultGasPrice,
    //             feeAccount, 0, 3000000000000000);
    //
    //         expect(txReceipt.contractAddress).toHaveLength(42);
    //
    //         expect(await etherDelta.getFeeAccount()).toEqual(feeAccount);
    //         expect(await etherDelta.getMakerFee()).toEqual(new BN(0));
    //         expect(await etherDelta.getTakerFee()).toEqual(new BN(3000000000000000));
    //
    //     }, 30000);
    // });
    // describe("deposit and withdrawls", ()=>
    // {
    //     let etherDeltaContractAddress: string,
    //         test1TokenContractAddress: string,
    //         test2TokenContractAddress: string;
    //
    //     beforeAll(async()=>
    //     {
    //         const etherDeltaTxReceipt = await etherDelta.deployContract(etherDeltaContractOwner, defaultGasLimit, defaultGasPrice,
    //             feeAccount, 2000000000000000, 3000000000000000);
    //         etherDeltaContractAddress = etherDeltaTxReceipt.contractAddress;
    //
    //         const token1TxReceipt = await issuableToken1.deployContract(token1Owner, defaultGasLimit, defaultGasPrice,
    //             "TST1", "Test 1 Token");
    //         test1TokenContractAddress = token1TxReceipt.contractAddress;
    //
    //         await issuableToken1.deposit(token1Owner, trader1, 1000);
    //         await issuableToken1.deposit(token1Owner, trader2, 2000);
    //
    //         const token2TxReceipt = await issuableToken2.deployContract(token2Owner, defaultGasLimit, defaultGasPrice,
    //             "TST2", "Test 2 Token");
    //         test2TokenContractAddress = token2TxReceipt.contractAddress;
    //
    //         await issuableToken2.deposit(token2Owner, trader1, 5000);
    //         await issuableToken2.deposit(token2Owner, trader2, 6000);
    //     }, 60000);
    //
    //     test("checks before any deposits", async ()=>
    //     {
    //         expect.assertions(6);
    //
    //         expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(0));
    //         expect(await etherDelta.getBalanceOf(test2TokenContractAddress, trader2)).toMatchObject(new BN(0));
    //         expect(await etherDelta.getBalanceOf(etherToken, trader1)).toMatchObject(new BN(0));
    //         expect(await etherDelta.getBalanceOf(etherToken, trader2)).toMatchObject(new BN(0));
    //
    //         const depositEvents = await etherDelta.getEvents('Deposit', 1);
    //         expect(depositEvents).toHaveLength(0);
    //
    //         const withdrawEvents = await etherDelta.getEvents('Withdraw', 1);
    //         expect(withdrawEvents).toHaveLength(0);
    //     }, 30000);
    //
    //     test('deposit ether', async() =>
    //     {
    //         expect.assertions(2);
    //
    //         const txReceipt = await etherDelta.depositEther(trader1, new BN(10));
    //
    //         expect(txReceipt.transactionHash).toHaveLength(66);
    //
    //         expect(await etherDelta.getBalanceOf(etherToken, trader1)).toMatchObject(new BN(10000000000000000000));
    //
    //     }, 30000);
    //
    //     test("get event from first ether deposit", async ()=>
    //     {
    //         expect.assertions(5);
    //
    //         const events = await etherDelta.getEvents('Deposit', 2);
    //
    //         expect(events).toHaveLength(1);
    //         expect(events[0].token).toEqual(etherToken);
    //         expect(events[0].user).toEqual(trader1);
    //         expect(events[0].amount).toEqual(new BN(10000000000000000000));
    //         expect(events[0].balance).toEqual(new BN(10000000000000000000));
    //     });
    //
    //     test("trader 1 deposits 100 test1 tokens", async() =>
    //     {
    //         expect.assertions(7);
    //
    //         // trader 1 allows EtherDelta access to their test1 tokens
    //         await issuableToken1.approve(trader1, etherDeltaContractAddress, 200);
    //
    //         const txReceipt = await etherDelta.depositToken(trader1, test1TokenContractAddress, new BN(100));
    //
    //         expect(txReceipt.transactionHash).toHaveLength(66);
    //         expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(100));
    //
    //         const events = await etherDelta.getEvents('Deposit', 2);
    //
    //         expect(events).toHaveLength(1);
    //         expect(events[0].token).toEqual(test1TokenContractAddress);
    //         expect(events[0].user).toEqual(trader1);
    //         expect(events[0].amount).toEqual(new BN(100));
    //         expect(events[0].balance).toEqual(new BN(100));
    //     }, 30000);
    //
    //     test("trader 1 deposits another 50 test1 tokens", async() =>
    //     {
    //         expect.assertions(7);
    //
    //         const txReceipt = await etherDelta.depositToken(trader1, test1TokenContractAddress, new BN(50));
    //
    //         expect(txReceipt.transactionHash).toHaveLength(66);
    //         expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(150));
    //
    //         const events = await etherDelta.getEvents('Deposit', 2);
    //
    //         expect(events).toHaveLength(2);
    //         expect(events[1].token).toEqual(test1TokenContractAddress);
    //         expect(events[1].user).toEqual(trader1);
    //         expect(events[1].amount).toEqual(new BN(50));
    //         expect(events[1].balance).toEqual(new BN(150));
    //     }, 30000);
    //
    //     test("trader 2 deposits 30 test2 tokens", async() =>
    //     {
    //         expect.assertions(7);
    //
    //         // trader 2 allows EtherDelta access to their test2 tokens
    //         await issuableToken2.approve(trader2, etherDeltaContractAddress, 70);
    //
    //         const txReceipt = await etherDelta.depositToken(trader2, test2TokenContractAddress, new BN(30));
    //
    //         expect(txReceipt.transactionHash).toHaveLength(66);
    //         expect(await etherDelta.getBalanceOf(test2TokenContractAddress, trader2)).toMatchObject(new BN(30));
    //
    //         const events = await etherDelta.getEvents('Deposit', 2);
    //
    //         expect(events).toHaveLength(3);
    //         expect(events[2].token).toEqual(test2TokenContractAddress);
    //         expect(events[2].user).toEqual(trader2);
    //         expect(events[2].amount).toEqual(new BN(30));
    //         expect(events[2].balance).toEqual(new BN(30));
    //     }, 30000);
    //
    //     test("trader 1 withdraws 9 test1 tokens", async() =>
    //     {
    //         expect.assertions(7);
    //
    //         const txReceipt = await etherDelta.withdrawToken(trader1, test1TokenContractAddress, new BN(99));
    //
    //         expect(txReceipt.transactionHash).toHaveLength(66);
    //         expect(await etherDelta.getBalanceOf(test1TokenContractAddress, trader1)).toMatchObject(new BN(51));
    //
    //         const events = await etherDelta.getEvents('Withdraw', 2);
    //
    //         expect(events).toHaveLength(1);
    //         expect(events[0].token).toEqual(test1TokenContractAddress);
    //         expect(events[0].user).toEqual(trader1);
    //         expect(events[0].amount).toEqual(new BN(99));
    //         expect(events[0].balance).toEqual(new BN(51));
    //     }, 30000);
    //
    //     describe("orders", ()=>
    //     {
    //         let blockNumber: number;
    //         let orderNonce = 1000000000;
    //
    //         beforeAll(async()=>
    //         {
    //             blockNumber = await transactionsProvider.getBlockNumber();
    //         });
    //
    //         test("trader 1 places an order", async()=>
    //         {
    //             expect.assertions(14);
    //
    //             const txReceipt = await etherDelta.placeOrder(
    //                 trader1,
    //                 test1TokenContractAddress,
    //                 new BN(11),
    //                 test2TokenContractAddress,
    //                 new BN(3),
    //                 blockNumber + 100,
    //                 ++orderNonce
    //             );
    //
    //             expect(txReceipt.transactionHash).toHaveLength(66);
    //
    //             const events = await etherDelta.getEvents('Order', 3);
    //
    //             //event Order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s);
    //             expect(events).toHaveLength(1);
    //             expect(events[0].tokenGet).toEqual(test1TokenContractAddress);
    //             expect(events[0].amountGet).toEqual(new BN(11));
    //             expect(events[0].tokenGive).toEqual(test2TokenContractAddress);
    //             expect(events[0].amountGive).toEqual(new BN(3));
    //             expect(events[0].expires).toEqual(new BN(blockNumber + 100));
    //             expect(events[0].nonce).toEqual(new BN(orderNonce));
    //             expect(events[0].user).toEqual(trader1);
    //
    //             expect(events[0].v == 27 || events[0].v == 28).toBe(true);
    //
    //             expect(events[0].r).toHaveLength(66);
    //             expect(events[0].r.slice(0, 2)).toEqual('0x');
    //
    //             expect(events[0].s).toHaveLength(66);
    //             expect(events[0].s.slice(0, 2)).toEqual('0x');
    //
    //         }, 30000);
    //
    //         test("trader 1 cancels the order", async()=>
    //         {
    //             expect.assertions(14);
    //
    //             const txReceipt = await etherDelta.cancelOrder(
    //                 trader1,
    //                 test1TokenContractAddress,
    //                 new BN(11),
    //                 test2TokenContractAddress,
    //                 new BN(3),
    //                 blockNumber + 100,
    //                 orderNonce
    //             );
    //
    //             expect(txReceipt.transactionHash).toHaveLength(66);
    //
    //             const events = await etherDelta.getEvents('Cancel', 4);
    //
    //             //event Order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s);
    //             expect(events).toHaveLength(1);
    //             expect(events[0].tokenGet).toEqual(test1TokenContractAddress);
    //             expect(events[0].amountGet).toEqual(new BN(11));
    //             expect(events[0].tokenGive).toEqual(test2TokenContractAddress);
    //             expect(events[0].amountGive).toEqual(new BN(3));
    //             expect(events[0].expires).toEqual(new BN(blockNumber + 100));
    //             expect(events[0].nonce).toEqual(new BN(orderNonce));
    //             expect(events[0].user).toEqual(trader1);
    //
    //             expect(events[0].v == 27 || events[0].v == 28).toBe(true);
    //
    //             expect(events[0].r).toHaveLength(66);
    //             expect(events[0].r.slice(0, 2)).toEqual('0x');
    //
    //             expect(events[0].s).toHaveLength(66);
    //             expect(events[0].s.slice(0, 2)).toEqual('0x');
    //
    //         }, 30000);
    //     });
    // });
});
//# sourceMappingURL=etherDelta.test.js.map