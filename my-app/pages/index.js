import { BigNumber, Contract, providers, utils } from "ethers";
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useEffect, useRef, useState } from 'react';
import Web3Modal from "web3modal";
import {BTS_NFT_CONTRACT_ADDRESS, BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, BTS_NFT_ABI} from "../constants";



export default function Home() {

  // create a bignumber 
  const zero = BigNumber.from(0);
  // keeps track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  const [loading, setLoading] = useState(false);

  // keeps track of the tokens that can be claimed based on the NFT(s) held by the user
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // keeps track of tokens owned by an address
  const [balanceOfBtsTokens, setBalanceOfBtsTokens] = useState(zero);
  // amount of tokens the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // total no. of tokens minted so far out of max. (max = 10000)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  // function to check the balance of token to be claimed by the user
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Create an instance of NFT Contract
      const nftContract = new Contract(BTS_NFT_CONTRACT_ADDRESS, BTS_NFT_ABI, provider);
      // Create an instance of token Contract
      const tokenContract = new Contract(BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, provider);
      // get the signer to extract address of currently connected account
      const signer = await getProviderOrSigner(true);
      // get the address of currently connected metamask account
      const address = await signer.getAddress();
      // call the balanceOf function from the NFT contract to get the number of NFT's held by the user
      const balance = await nftContract.balanceOf(address);
      // balance is a BigNumber hence compare to big number zero
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount keeps track of the number of unclaimed tokens
        let amount = 0;
        // iterate through all nfts to check if the tokens have been claimed, increase "amount" only if the 
        // tokens haven't been claimed 
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId); 
          if(!claimed){
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }

    } catch(err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };


  // checks the balance of tokens held by an address
  const getBalanceOfTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      // create an instance of Token contract
      const tokenContract = new Contract(BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, provider);
      // get signer to extract address of connected account
      const signer = await getProviderOrSigner(true);
      // get address from the connected account
      const address = await signer.getAddress();
      // call the balance from the tokenContract to get number of tokens owned by address
      const balance = await tokenContract.balanceOf(address);
      // balance is already a big number so we don't need to convert it before setting it
      setBalanceOfBtsTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfBtsTokens(zero);
    }
  };

  // mint amount of tokens to a given address
  const mintBtsToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, signer);
      const value = 0.001 * amount;
      const txn = await tokenContract.mint(amount, { value: utils.parseEther(value.toString()),});
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("Successfully mined %s nBts", value);
      await getBalanceOfTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch(err) {
      console.error(err);
    }
  };

  // function to claim bts tokens
  const claimBtsToken = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, signer);
      const txn = await tokenContract.claim();
      setLoading(true);
      await txn.wait();
      setLoading(false);
      window.alert("Successfully claimed Bts Token(s)");
      await getBalanceOfTokens();
      await getTotalTokensMinted()
      await getTokensToBeClaimed();
    } catch(err) {
      console.error(err);
    }
  };

  // get total tokens minted so far (remember maximum is 10000)
  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(BTS_TOKEN_CONTRACT_ADDRESS, BTS_TOKEN_ABI, provider);
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);

    } catch(err) {
      console.error(err);
    }
  };


  // get provider or signer to read or write transactions
  const getProviderOrSigner = async ( needSigner = false ) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    // make sure the network is rinkeby
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change to rinkeby")
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // connect wallet
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal ({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfTokens()
      getTokensToBeClaimed();
    }
  }, [walletConnected]);

  // render button
/*
  renderButton: Returns a button based on the state of the dapp
*/
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimBtsToken}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintBtsToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Bts Smart Token</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Bts Smart Token ICO!</h1>
          <div className={styles.description}>
            My special spiritual sample site where you can claim or mint Bts tokens.
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfBtsTokens)} Bts Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
                <p>Keep calm and stay blessed...</p>
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
      <img alt="Twitter Logo" className={styles.twitter} src="/twitter-logo.svg" />
        <a href="https://twitter.com/iykethe1st" target="_blank">Made with &#10084; by  @iykethe1st</a>      </footer>
    </div>
  );


  


















} 
