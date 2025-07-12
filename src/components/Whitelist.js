import { useState } from 'react';
import { ethers } from 'ethers';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

const Whitelist = ({nft, provider, setIsLoading}) => {
  const [isWaiting, setIsWaiting] = useState(false)
  const [wlAddress, setWlAddress] = useState('')

  const addressHandler = async (e) => {
  	e.preventDefault()
  	setIsWaiting(true)

  	try {
      if (!ethers.utils.isAddress(wlAddress)) {
        alert('Invalid address!');
        return;
      }

      setIsWaiting(true);
      setIsLoading(true);

      const signer = await provider.getSigner()
      const transaction = await nft.connect(signer).addToWhitelist(wlAddress)
      await transaction.wait()
      alert(`Address ${wlAddress} added to whitelist!`);
      console.log(transaction)
	  setWlAddress('');
  	} catch {
  	  window.alert('User rejected or transaction reverted')
  	}

      setIsWaiting(false);
      setIsLoading(false);
  }

  return(
  	<Form onSubmit={addressHandler}>
  	  <Form.Group
  	    style={{ maxWidth: '450px', margin: '10px auto' }}
  	  >
        <Form.Control
          type='text'
          placeholder='Enter address to be whitelisted'
          className='my-2'
          onChange={(e) => setWlAddress(e.target.value)}
        />
        {isWaiting ? (
          <Spinner animation="border" style={{ display: 'block', margin: '0 auto' }} />
        ) : (
          <Button variant='primary' type='submit' style={{ width: '100%' }}>
            Add to whitelist
          </Button>
        )}
  	  </Form.Group>
  	</Form>
  )

}

export default Whitelist;
