#!/bin/sh

# Used for testing
geth --datadir ../testchain --unlock 0x2e988A386a799F506693793c6A5AF6B54dfAaBfB,0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A,0x1563915e194D8CfBA1943570603F7606A3115508,0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB --password ./testpassword --rpc --rpcapi "eth,net,web3,debug" --rpccorsdomain '*' --rpcport 8646 --ws --wsport 8647 --wsaddr "localhost" --wsorigins="*" --port 32323 --mine --minerthreads 1 --maxpeers 0 --cache 1024 --targetgaslimit 994712388 --verbosity 2 console

# used for production
#geth --unlock 6 --ws --wsport 8647 --wsaddr "localhost" --wsorigins="*" --verbosity 2 console

