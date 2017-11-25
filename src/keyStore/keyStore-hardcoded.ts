import * as VError from 'verror';

export default class KeyStore
{
    getPrivateKey(fromAddress: string): Promise<string>
    {
        return new Promise<string>(async(resolve, reject) =>
        {
            if(fromAddress == '0x2e988A386a799F506693793c6A5AF6B54dfAaBfB') {
                resolve('0x1234567890123456789012345678901234567890123456789012345678901234');
            }
            else if(fromAddress == '0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A') {
                resolve('0x1111111111111111111111111111111111111111111111111111111111111111');
            }
            else if(fromAddress == '0x1563915e194D8CfBA1943570603F7606A3115508') {
                resolve('0x2222222222222222222222222222222222222222222222222222222222222222');
            }
            else if(fromAddress == '0x5CbDd86a2FA8Dc4bDdd8a8f69dBa48572EeC07FB') {
                resolve('0x3333333333333333333333333333333333333333333333333333333333333333');
            }
            else if(fromAddress == '0x7564105E977516C53bE337314c7E53838967bDaC') {
                resolve('0x4444444444444444444444444444444444444444444444444444444444444444');
            }
            else if(fromAddress == '0xe1fAE9b4fAB2F5726677ECfA912d96b0B683e6a9') {
                resolve('0x5555555555555555555555555555555555555555555555555555555555555555');
            }
            else if(fromAddress == '0xdb2430B4e9AC14be6554d3942822BE74811A1AF9') {
                resolve('0x6666666666666666666666666666666666666666666666666666666666666666');
            }
            else {
                const error = new VError(`could not get private key for address ${fromAddress}`);
                reject(error);
            }
        });
    }
}