import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import {ethers} from 'ethers';

const Mint = ({ provider, nft, cost, setIsLoading }) => {

  const mintHandler = async (e) => {
  	e.preventDefault()
  	console.log('minting...')

  	try {
      const signer = await provider.getSigner()
      const transaction = await nft.connect(signer).mint(1, { value: cost })
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }
  }

  return(
  	<Form style={{ maxWidth: '450px', margin: '50px auto'}}>
  	  <Form.Group>
  	    <Button onSubmit={mintHandler} variant="primary" type="submit" style={{ width: '100%' }}>
  	      Mint
  	    </Button>
  	  </Form.Group>
  	</Form>
  )
}

export default Mint;
