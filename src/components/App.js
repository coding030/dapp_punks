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
import Loading from './Loading';

// ABIs: Import your contract ABIs here
 import NFT_ABI from '../abis/NFT.json'

// Config: Import your network config here
 import config from '../config.json';

function App() {
  const[provider, setProvider] = useState(null)
  const[nft, setNFT] = useState(null)

  const [account, setAccount] = useState(null)

  const [revealTime, setRevealTime] = useState(0)
  const [maxSupply, setMaxSupply] = useState(0)
  const [totalSupply, setTotalSupply] = useState(0)
  const [cost, setCost] = useState(0)
  const [balance, setBalance] = useState(0)
  const [latestTokenId, setLatestTokenId] = useState(null)
  const [baseURI, setBaseURI] = useState(null)
  const [gatewayBaseURI, setGatewayBaseURI] = useState(null)
  const [imageURL, setImageURL] = useState(null)

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
                    alt="Open Punk"
                    width="400px"
                    height="400px"
                  />
                </div> 
              ) : (
                <img src={preview} alt=""/>
              )}
            </Col>
            <Col>
              <div className='my-4 text-center'>
                <Countdown date={parseInt(revealTime)} className='h2'/>
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
              />
              <Whitelist
              />
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default App;
