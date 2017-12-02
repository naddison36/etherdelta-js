
pragma solidity ^0.4.19;

contract TestCrypto
{
    event Hash(bytes32 hash);

    function ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) pure public returns (address)
    {
        return ecrecover(hash,v,r,s);
    }

    function signOrder(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce) pure public
        returns (bytes32) {
        bytes32 hash = sha256(tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        //Hash(hash);
        return hash;
    }

    function testOrderHash(bytes32 expected, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce) pure public
        returns (bool) {
        bytes32 actual = sha256(tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        return actual == expected;
    }
}