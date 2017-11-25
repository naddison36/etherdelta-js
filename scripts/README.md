# Testing
This project comes with pre configured Geth and Parity nodes for testing purposes.

## Geth
This project comes with scripts to run a development instance of geth to test deploying a token contract and issuing tokens to it.

### Initial Setup
In the [scripts](./scripts) folder, run the following commands on a Mac OSX or Linux platform
```
cd scripts
chmod a+x initGeth.sh
./initGeth.sh
```

This is start a new development blockchain using the [genesis.json](./scripts/genesis.json) file. The chain data will be under [testchain](./testchain) in the geth folder.

### Starting Geth
If the above initial setup has already been done, the development geth node can be started with
```
cd scripts
chmod a+x startGeth.sh
./startGeth.sh
```

## Parity

## Starting Parity
In the [scripts](./scripts) folder, run the following commands on a Mac OSX or Linux platform
```
cd scripts
chmod a+x startParity.sh
./startParity.sh
```

This is start a new development blockchain using the [meetupChainSpec.json](./scripts/meetupChainSpec.json) specification file and [parityDevConfig.toml](./scripts/parityDevConfig.toml) config file. The chain data will be under [testchain](./testchain) in the parity folder.

## Test Accounts
The pre-configured testing accounts.

| Test Actor | Account Number | Public Key | Private Key | Key File |
| --- | --- | --- |  --- | --- |
| Coinbase | 0 | 0x2e988A386a799F506693793c6A5AF6B54dfAaBfB | 1234567890123456789012345678901234567890123456789012345678901234 | [file](./testchain/keystore/) |


The password to the above testing accounts is `EtherDelta`. This is also stored in the [testpassword](./scripts/testpassword) file under the [scripts](./scripts) folder.
