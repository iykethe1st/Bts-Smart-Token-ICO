// SPDX-License-Identifier : MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBts.sol";


contract BtsToken is ERC20, Ownable {
    // price of one token
    uint256 public constant tokenPrice = 0.001 ether;
    // Each NFT gives the user 10 tokens
    uint256 public constant tokensPerNFT = 10 * 10 ** 18;
    // maximum total supply
    uint256 public constant maxTotalSupply = 10000 * 10 ** 18;
    // BtsNft contract instance
    IBts BtsNFT;
    // mapping to keep tract of tokens claimed
    mapping (uint256 => bool) public tokenIdsClaimed;

    constructor (address _btsContract) ERC20("Bts Token", "nBts") {
        BtsNFT = IBts(_btsContract);
    }

    // mint function
    function mint(uint256 amount) public payable {
        // required amount of ether (amount * token price)
        uint256 _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "Ether sent is incorrect!");
        // make sure you have enough tokens to send, otherwise revert the transaction
        uint256 totalRequested = amount * 10 ** 18; 
        require(totalSupply() + totalRequested <= maxTotalSupply, "Exceeds maximum number of total supply!");
        _mint(msg.sender, totalRequested);
    }

    function claim() public {
        address sender = msg.sender;
        // get the number of NFTs held by a given sender
        uint256 balance = BtsNFT.balanceOf(sender);
        // if the balance is 0 revert the transaction
        require(balance > 0, "You don't own any Bts NFTs!");
        // keep track of number of unclaimed tokens
        uint256 amount = 0;
        //loop over the balance and get the token ID owned by `sender` at a given `index` of its token list.
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = BtsNFT.tokenOfOwnerByIndex(sender, i);
            // if the token hasn't been claimed, increase the amount
            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }
        // if all the tokens have been claimed, revert the transaction
        require(amount > 0, "All the tokens have been claimed!");
        // mint 10 tokens for each NFT
        _mint(sender, amount * tokensPerNFT);
    }

    // function to receive ether
    receive() external payable {}
    // fallback function when msg.data is not empty
    fallback() external payable {}

}