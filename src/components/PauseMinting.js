import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';

const PauseMinting = ({nft, provider, setIsLoading}) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [mintingPaused, setMintingPaused] = useState(null);

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

      if (mintingPaused) {
        tx = await nft.connect(signer).resumeMinting();
      } else {
        tx = await nft.connect(signer).pauseMinting();
      }

      await tx.wait();

      // Refresh local state after tx
      const paused = await nft.mintingPaused();
      setMintingPaused(paused);

      setIsLoading(true); // to reload state

    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsWaiting(false)
//    setIsLoading(true)
  }  

  return (
    <button onClick={toggleMinting} disabled={isWaiting || mintingPaused === null}>
      {isWaiting ? "Waiting..." : mintingPaused ? "Resume Minting" : "Pause Minting"}
    </button>
  )

}

export default PauseMinting;
