import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

const PauseMinting = ({nft, provider, setIsLoading, mintingPaused, setMintingPaused}) => {
  const [isWaiting, setIsWaiting] = useState(false);
//  const [mintingPaused, setMintingPaused] = useState(null);

  // Fetch pause state on mount
  useEffect(() => {
    const fetchPauseState = async () => {
      try {
        const paused = await nft.mintingPaused();
        setMintingPaused(paused);
      } catch (err) {
        console.error("Failed to fetch mintingPaused:", err);
      }
    };

    fetchPauseState();
  }, [nft]);

  const toggleMinting = async () => {
    setIsWaiting(true)

    try {
      const signer = provider.getSigner();
      let tx;

      console.log("Minting is paused:", mintingPaused)

      if (mintingPaused) {
      	console.log("Calling resumeMinting...")
        tx = await nft.connect(signer).resumeMinting();
      } else {
      	console.log("Calling pauseMinting...")
        tx = await nft.connect(signer).pauseMinting();
      }

      const receipt = await tx.wait();
      console.log("transaction confirmed:", receipt)

      // Refresh local state after tx
      const paused = await nft.mintingPaused();
      console.log("Updated mintingPaused:", paused)
      setMintingPaused(paused);

      setIsLoading(true); // to reload state

    } catch (error) {
      console.log("Error toggling minting:", error)

      if (error.code === 4001) {
        // EIP-1193 user rejected request error
        window.alert('Transaction rejected by the user.');
      } else if (error.message?.includes("minting already paused")) {
        window.alert("Minting is already paused.");
      } else if (error.message?.includes("only owner")) {
        window.alert("Only the contract owner can toggle minting.");
      } else {
        window.alert('Transaction failed: ' + (error.reason || error.message || 'Unknown error'));
      }
    }

    setIsWaiting(false)
//    setIsLoading(true)
  }  

  return (
    <div className="text-center my-3">
      <Button 
        onClick={toggleMinting} 
        disabled={isWaiting || mintingPaused === null}
        variant={mintingPaused ? "success" : "danger"}
      >
        {isWaiting ? "Waiting..." : mintingPaused ? "Resume Minting" : "Pause Minting"}
      </Button>
    </div>
  )

}

export default PauseMinting;
