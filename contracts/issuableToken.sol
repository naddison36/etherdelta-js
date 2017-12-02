/*
An ERC20 compliant token that is linked to a bank account via a bank API.
This token has the following constraints:
1. No token holder can hold more than 1000 tokens
2. There can not be more than 10 million tokens on issue
3. There is only one token issuer
4. Tokens can only be transferred to other depositors

This software is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See MIT Licence for further details.
<https://opensource.org/licenses/MIT>.
*/

pragma solidity ^0.4.19;

import {ERC20Token} from './erc20Token.sol';
import {SafeMath} from './lib/safeMaths.sol';

contract IssuableToken is ERC20Token
{
    using SafeMath for uint256;

    address public owner = msg.sender;
    address public newOwner;

    // constructor
    function IssuableToken(string tokenSymbol, string tokenName)
        ERC20Token(tokenSymbol, tokenName)          // call constructor of base contract this contract is inheriting from
    {}

    event Deposit(
        address indexed toAddress,
        uint256 amount);

    event Withdraw(
        address indexed withdrawer,
        uint256 amount);

    // Checks that the caller is the owner of the contract
    modifier onlyOwner () {
        require(owner == msg.sender);
        _;
    }

    modifier onlyNewOwner () {
        require(newOwner == msg.sender);
        _;
    }

    // Issue tokens
    function deposit(address toAddress, uint256 amount) public
        onlyOwner()
        returns (bool)
    {
        totSupply = totSupply.add(amount);
        balances[toAddress] = balances[toAddress].add(amount);

        Deposit(toAddress, amount);
        Transfer(0x0, toAddress, amount);

        return true;
    }

    // Withdraw tokens
    function withdraw(uint256 amount) public
        returns (bool)
    {
        totSupply = totSupply.sub(amount);
        balances[msg.sender] = balances[msg.sender].sub(amount);

        Withdraw(msg.sender, amount);
        Transfer(msg.sender, 0x0, amount);

        return true;
    }

    function changeOwner(address _owner) public
        onlyOwner()
        returns (bool)
    {
        newOwner = _owner;
        return true;
    }

    function acceptOwnership() public
        onlyNewOwner()
        returns (bool)
    {
        owner = msg.sender;
        return true;
    }
}