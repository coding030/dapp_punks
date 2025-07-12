import { useState } from 'react';
import { BigNumber } from 'ethers';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

const Mint = ({ 
  provider, 
  nft, 
  cost, 
  setIsLoading, 
  isWhitelisted, 
  mintingPaused,
  maxSupply,
  totalSupply,
  userMinted,
  maxPerWallet
  }) => {
  const [isWaiting, setIsWaiting] = useState(false)
  const [amount, setAmount] = useState("")

  const mintHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()

      const mintAmount = parseInt(amount)
      const totalCost = cost.mul(mintAmount)
      console.log("Minting", mintAmount, "NFTs for", totalCost.toString(), "wei");

      if (isNaN(mintAmount) || mintAmount <= 0) {
        window.alert("Please enter a valid mint amount.");
        setIsWaiting(false);
        return;
      }

      // Don't allow more than max per wallet
      if (userMinted + mintAmount > maxPerWallet) {
        window.alert(`You can mint up to ${maxPerWallet} NFTs in total. You've already minted ${userMinted}.`);
        setIsWaiting(false);
        return;
      }      

      // Don't allow more than max supply
      if (totalSupply + mintAmount > maxSupply) {
        window.alert("Not enough NFTs remaining to mint that amount.");
        setIsWaiting(false);
        return;
      }

      const transaction = await nft.connect(signer).mint(mintAmount, { value: totalCost })
      await transaction.wait()
    } catch (error) {
      if (error.code === 4001) {
        window.alert('Transaction rejected by the user.');
      } else {
        window.alert('Transaction failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    }

    setIsLoading(true)
  }

  let mintButton;
  if (mintingPaused) {
    mintButton = (
      <Button variant="primary" type="submit" style={{ width: '100%' }} disabled>
        Mint
      </Button>
    );
  } else if (!isWhitelisted) {
    mintButton = (
      <Button variant="primary" type="submit" style={{ width: '100%' }} disabled>
        Address not whitelisted. Minting disabled.
      </Button>
    );
  } else {
    mintButton = (
      <Button variant="primary" type="submit" style={{ width: '100%' }}>
        Mint
      </Button>
    );
  }

  return(
    <Form onSubmit={mintHandler} style={{ maxWidth: '450px', margin: '50px auto' }}>
      {isWaiting ? (
        <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
      ) : (
        <Form.Group>
          <Form.Control
            type='text'
            placeholder='Enter amount to mint'
            className='my-2'
            onChange={(e) => setAmount(e.target.value)}
          />
          {mintButton}
        </Form.Group>
      )}

    </Form>
  )
}

export default Mint;
