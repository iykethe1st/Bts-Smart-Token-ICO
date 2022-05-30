const { getContractFactory } = require("@nomiclabs/hardhat-ethers/types");
const {ethers} = require("hardhat");
const {BTS_NFT_CONTRACT_ADDRESS} = require("../constants");
require("dotenv").config({path: ".env"});

const main = async () => {
    const btsNftContract = BTS_NFT_CONTRACT_ADDRESS;
    const btsTokenContractFactory = await ethers.getContractFactory("BtsToken");
    const btsTokenContract = await btsTokenContractFactory.deploy(btsNftContract);
    await btsTokenContract.deployed();
    console.log("Token contract deployed to: ", btsTokenContract.address);

};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    }   catch(err){
        console.error(err);
        process.exit(1);
    }
};

runMain();