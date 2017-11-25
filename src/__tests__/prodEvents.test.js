"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const EtherDelta_1 = require("../EtherDelta");
const BaseContract_1 = require("../BaseContract");
const keyStore_hardcoded_1 = require("../keyStore/keyStore-hardcoded");
const etherDeltaContractAddress = "0x8d12a197cb00d4747a1fe03395095ce2a5cc6819", etherDeltaContractBlockNumber = 3154196, recentBlockNumber = 4615000, etherToken = '0x0000000000000000000000000000000000000000';
describe("EtherDelta", () => {
    const provider = new ethers_1.providers.InfuraProvider('mainnet');
    const keyStore = new keyStore_hardcoded_1.default();
    const etherDeltaJsonInterface = BaseContract_1.default.loadJsonInterfaceFromFile('./bin/contracts/EtherDelta.abi');
    const etherDeltaContractBinary = BaseContract_1.default.loadBinaryFromFile('./bin/contracts/EtherDelta.bin');
    const etherDelta = new EtherDelta_1.default(provider, provider, keyStore, etherDeltaJsonInterface, etherDeltaContractBinary, etherDeltaContractAddress);
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
    test("get Orders", async () => {
        expect.assertions(1);
        const orderEvents = await etherDelta.getEvents("Cancel", recentBlockNumber);
        expect(orderEvents.length).toBeGreaterThan(100);
    }, 100000);
});
//# sourceMappingURL=prodEvents.test.js.map