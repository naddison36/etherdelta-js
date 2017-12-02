import * as BN from 'bn.js';
import {providers as Providers, Wallet, utils, SigningKey} from 'ethers';
import {ecsign, ecrecover, toBuffer, bufferToHex, bufferToInt, publicToAddress} from "ethereumjs-util";

import TestCrypto, {ISignature} from '../TestCrypto';
import BaseContract from '../BaseContract';
import KeyStore from '../keyStore/keyStore-hardcoded';

import {TransactionReceipt} from "./index";

const testCryptoContractOwner = '0x2e988A386a799F506693793c6A5AF6B54dfAaBfB';

// bytes32 hash = sha256(tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
// "0x7564105E977516C53bE337314c7E53838967bDaC", 10, "0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9", 20, 1000, 0
// "0": "bytes32: 0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2"

const orderParams = ['0x7564105E977516C53bE337314c7E53838967bDaC', 10, "0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9", 20, 1000, 0];
const expectOrderHash = '0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2';

const chainId = 0;

describe("TestCrypto", ()=>
{

    const rpcProvider = process.env.RPCPROVIDER || "http://localhost:8646";
    const transactionsProvider = new Providers.JsonRpcProvider(rpcProvider, true, chainId);
    const eventsProvider = new Providers.JsonRpcProvider(rpcProvider, true, chainId);

    const keyStore = new KeyStore();

    const jsonInterface = BaseContract.loadJsonInterfaceFromFile('./bin/contracts/TestCrypto');
    const contractBinary = BaseContract.loadBinaryFromFile('./bin/contracts/TestCrypto');

    const cryptoTest = new TestCrypto(transactionsProvider, eventsProvider,
        keyStore,
        jsonInterface,
        contractBinary,
        null   // contract address
    );

    beforeAll(async ()=>
    {
        await cryptoTest.deployContract(testCryptoContractOwner);
    });

    test("solidity sha256 of order params", async()=>
    {
        expect.assertions(2);

        const ethersShaHash = utils.soliditySha256(
            ['address','uint256','address','uint256','uint256','uint256'],
            orderParams);

        expect(ethersShaHash).toEqual(expectOrderHash);

        const solidityShaHash = await cryptoTest.signOrder(...orderParams);

        expect(ethersShaHash).toEqual(solidityShaHash);
    });

    test("testOrderHash", async()=>
    {
        expect.assertions(1);

        expect(await cryptoTest.testOrderHash('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2', ...orderParams)).toBeTruthy();
    });

    test("Ethereumjs-tx signing and recovering using secp256k1", async()=>
    {
        expect.assertions(4);

        const messageBuffer = toBuffer(expectOrderHash);

        const signature = ecsign(
            messageBuffer,     // message
            toBuffer('0x1111111111111111111111111111111111111111111111111111111111111111'));    // privateKey

        const r = bufferToHex(signature.r);
        const s = bufferToHex(signature.s);
        const v = signature.v;

        expect(r).toEqual('0x9bffbe28cec8656bf6cbdff5f4159d220c0a2a1b1740646430cccea2f7c80491');
        expect(s).toEqual('0x534f7a8cb7574806f7f428340c2fc1bd5baa919492ca06b2a28967a1d4db5a5a');
        expect(v).toEqual(27);

        const recoveredPublicKeyBuffer = ecrecover(messageBuffer, signature.v, signature.r, signature.s);
        const recoveredPublicKey = bufferToHex(recoveredPublicKeyBuffer);

        const recoveredAddressBuffer = publicToAddress(recoveredPublicKey);
        const recoveredAddress = bufferToHex(recoveredAddressBuffer);

        expect(recoveredAddress).toEqual('0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a');

        const solidityRecoverredAddress = await cryptoTest.ecrecover(
            expectOrderHash,
            v, r, s);

        // returned value is 0x9bffbe28cec8656bf6cbdff5f4159d220c0a2a1b1740646430cccea2f7c80491
        expect(solidityRecoverredAddress).toEqual("0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A");
    }, 30000);

    test("signing message and recovering the signing address", ()=>
    {
        const privateKey = '0x1111111111111111111111111111111111111111111111111111111111111111';
        const wallet = new Wallet(privateKey);

        expect(wallet.address).toEqual('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');

        const orderParams = [
            '0x7564105E977516C53bE337314c7E53838967bDaC',
            10,
            '0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9',
            20,
            1000,
            0];

        const orderHash = utils.soliditySha256(
            ['address','uint','address', 'uint','uint','uint'],
            orderParams);

        expect(orderHash).toEqual('0x5965b604c8a3aeea98bac96fde194ce36307b45c97048484c9662ef3320baed2');

        const signingKey = new SigningKey(privateKey);

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

        const recoveredAddress = SigningKey.recover(orderHash, signature.r, signature.s, signature.recoveryParam);

        expect(recoveredAddress).toEqual('0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A');
    });
});