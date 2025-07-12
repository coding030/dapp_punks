import { useEffect, useState } from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import Countdown from 'react-countdown'
import { ethers } from 'ethers'

import preview from '../preview.png'

// Components
import Navigation from './Navigation';
import Data from './Data';
import Mint from './Mint';
import Whitelist from './Whitelist';
import PauseMinting from './PauseMinting';
import Loading from './Loading';

// ABIs: Import your contract ABIs here
 import NFT_ABI from '../abis/NFT.json'

// Config: Import your network config here
 import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [nft, setNFT] = useState(null)

  const [account, setAccount] = useState(null)
  const [owner, setOwner] = useState(null)
  const [mintingPaused, setMintingPaused] = useState(null)
  const [isWhitelisted, setIsWhitelisted] = useState(null)

  const [revealTime, setRevealTime] = useState(0)
  const [maxSupply, setMaxSupply] = useState(0)
  const [maxPerWallet, setMaxPerWallet] = useState(0)
  const [totalSupply, setTotalSupply] = useState(0)
  const [cost, setCost] = useState(0)
  const [balance, setBalance] = useState(0)
  const [latestTokenId, setLatestTokenId] = useState(null)
  const [baseURI, setBaseURI] = useState(null)
  const [gatewayBaseURI, setGatewayBaseURI] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [ownedTokenIds, setOwnedTokenIds] = useState([])

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // Initiate contract
    const nft = new ethers.Contract(config[31337].nft.address, NFT_ABI, provider)
    setNFT(nft)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    const ownerAddress = await nft.owner()
    setOwner(ownerAddress.toLowerCase())

    const isWhitelisted = await nft.checkWhitelist(account);
    setIsWhitelisted(isWhitelisted)

    // Fetch minting paused state
    const paused = await nft.mintingPaused();
    setMintingPaused(paused);
//    setMintingPaused(await nft.mintingPaused())

    // Fetch countdown
    const allowMintingOn = await nft.allowMintingOn()
    setRevealTime(allowMintingOn.toString() + '000')

    // Fetch maxSupply
    setMaxSupply(await nft.maxSupply())

    // Fetch totalSupply
    setTotalSupply(await nft.totalSupply())

    // Fetch cost
    setCost(await nft.cost())

    // Fetch balanceOf
    setBalance(await nft.balanceOf(account))

    // Get token IDs owned by user
    const tokenIds = await nft.walletOfOwner(account) 

    // Array of all token IDs as strings
    setOwnedTokenIds(tokenIds.map(id => id.toString()));

    const fetchedBaseURI = await nft.baseURI()
    const gatewayURI = fetchedBaseURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")

    // If they own at least one NFT, set the latest token ID
    if (tokenIds.length > 0) {
      const latestId = tokenIds[tokenIds.length - 1].toString()
      const finalImageURL = gatewayURI + latestId + ".png"

      setLatestTokenId(latestId)
      setBaseURI(fetchedBaseURI)
      setGatewayBaseURI(gatewayURI)
      setImageURL(finalImageURL)      
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // MetaMask locked or disconnected
          window.location.reload();
        } else {
          // Account changed - reload page or reload data
          window.location.reload();
        }
      };  

      window.ethereum.on('accountsChanged', handleAccountsChanged);  

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>Dapp Punks</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Row>
            <Col>
              {balance > 0 ? (
                <div className='text-center'>
                  <img 
                    src={imageURL}
                    alt="Latest Minted NFT"
                    width="400px"
                    height="400px"
                  />
                  <div className="mt-4">
                    <h5>Your NFT Collection:</h5>
                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-2">
                      {ownedTokenIds.map((id) => (
                        <img
                          key={id}
                          src={`${gatewayBaseURI}${id}.png`}
                          alt={`NFT #${id}`}
                          width="150"
                          height="150"
                          style={{ borderRadius: "10px", border: "1px solid #ccc" }}
                        />
                      ))}
                    </div>
                  </div>
                </div> 
              ) : (
                <img src={preview} alt=""/>
              )}
            </Col>
            <Col>
              <div className='my-4 text-center'>
                <Countdown 
                  date={parseInt(revealTime)}
                  renderer={({ days, hours, minutes, seconds, completed }) => {
                    if (completed) {
                      if (mintingPaused){
                        return <span className="h2">Minting is paused</span>                        
                      }
                      return <span className="h2">Minting is now live!</span>
                    } else {
                      return (
                        <span>
                          Minting starts in: {days}d {hours}h {minutes}m {seconds}s
                        </span>
                      )
                    }
                  }}
                  className='h2'
                />
              </div>
              <Data 
                maxSupply={maxSupply} 
                totalSupply={totalSupply} 
                cost={cost}
                balance={balance}
              />
              <Mint
                provider={provider}
                nft={nft}
                cost={cost}
                setIsLoading={setIsLoading}
                isWhitelisted={isWhitelisted}
                mintingPaused={mintingPaused}
                maxSupply={maxSupply}
                totalSupply={totalSupply}
                balance={balance}
                maxPerWallet={maxPerWallet}
              />
              {account && owner && account.toLowerCase() === owner ? (
                <>
                  <Whitelist
                    nft={nft}
                    provider={provider}
                    setIsLoading={setIsLoading}
                  />
                  <PauseMinting
                    nft={nft}
                    provider={provider}
                    setIsLoading={setIsLoading}
                    mintingPaused={mintingPaused}
                    setMintingPaused={setMintingPaused}
                  />
                </>
              ) : (
                null
              )}
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default App;
