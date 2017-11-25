import {providers as Providers, Wallet} from 'ethers';

import EtherDelta from '../EtherDelta';
import BaseContract from '../BaseContract';
import KeyStore from '../keyStore/keyStore-hardcoded';

import {TransactionReceipt} from "./index";

const etherDeltaContractAddress = "0x8d12a197cb00d4747a1fe03395095ce2a5cc6819",
        etherDeltaContractBlockNumber = 3154196,
    recentBlockNumber = 4615000,
    etherToken = '0x0000000000000000000000000000000000000000';

describe("EtherDelta", ()=>
{

    const provider = new Providers.InfuraProvider('mainnet');

    const keyStore = new KeyStore();

    const etherDeltaJsonInterface = BaseContract.loadJsonInterfaceFromFile('./bin/contracts/EtherDelta.abi');
    const etherDeltaContractBinary = BaseContract.loadBinaryFromFile('./bin/contracts/EtherDelta.bin');

    const etherDelta = new EtherDelta(provider, provider,
        keyStore,
        etherDeltaJsonInterface,
        etherDeltaContractBinary,
        etherDeltaContractAddress
    );

    // test("get Ether trades", async()=>
    // {
    //     expect.assertions(1);
    //
    //     const etherTrades = await etherDelta.getEtherTrades(recentBlockNumber);
    //
    //     for (const etherTrade of etherTrades)
    //     {
    //         console.log(`${etherTrade.blockNumber},${etherTrade.etherAmount.toString()},${etherTrade.tokenAddress},${etherTrade.tokenAmount.toString()}`);
    //     }
    //
    //     expect(events.length).toBeGreaterThan(100);
    // }, 60000);

    test("get Orders", async()=>
    {
        expect.assertions(1);

        const orderEvents = await etherDelta.getEvents("Cancel", recentBlockNumber);

        expect(orderEvents.length).toBeGreaterThan(100);
    }, 100000);
});