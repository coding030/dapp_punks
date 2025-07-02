const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('NFT', () => {
  const NAME = 'Dapp Punks'
  const SYMBOL = 'DP'
  const COST = ether(10)
  const MAX_SUPPLY = 25
  const BASE_URI = 'ipfs://bafybeidpuzq54zqnmgq5lsbegxwrwkgrt72545l3pyj6c4y3qsprfamu6u/'

  let nft,
      deployer,
      minter

  beforeEach(async () => {
    let accounts = await ethers.getSigners()
    deployer = accounts[0]
    minter = accounts[1]
  })

  describe('Deployment', () => {
//    const ALLOW_MINTING_ON = '1893499200'
    const ALLOW_MINTING_ON = (Date.now() + 120000).toString().slice(0, 10) // 2 minutes from now

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT')
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
      await nft.connect(deployer).addToWhitelist(minter.address)
    })

//      console.log(nft.whitelist[minter.address])

    it('has correct name', async () => {
      expect(await nft.name()).to.equal(NAME)
    })

    it('has correct symbol', async () => {
      expect(await nft.symbol()).to.equal(SYMBOL)
    })

    it('returns cost to mint', async () => {
      expect(await nft.cost()).to.equal(COST)
    })

    it('returns the maximum total supply', async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY)
    })

    it('returns the allowed minting time', async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON)
    })

    it('returns the baseURI', async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI)
    })

    it('returns the owner', async () => {
      expect(await nft.owner()).to.equal(deployer.address)
    })
  })

  describe('Minting', () => {
    let transaction, result

    describe('Success', async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        transaction = await nft.connect(minter).mint(1, { value: COST})
        result = await transaction.wait()
      })

      it('returns the address of the minter', async () => {
        expect(await nft.ownerOf(1)).to.equal(minter.address)
      })

      it('returns total number of tokens the minter owns', async () => {
        expect(await nft.balanceOf(minter.address)).to.equal(1)
      })

      it('returns IPFS url', async () => {
        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`)
      })

      it('updates the total supply', async () => {
        expect(await nft.totalSupply()).to.equal(1)
      })

      it('updates the contract Ether balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(COST)
      })

      it('emits emit event', async () => {
        await expect(transaction).to.emit(nft, 'Mint')
          .withArgs(1, minter.address)
      })

      it('checks if minting is paused', async () => {
        expect(await nft.mintingPaused()).to.equal(false)
      })

    })

    describe('Failure', async () => {

      it('rejects insufficient payment', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        await expect(nft.connect(minter).mint(2, { value: COST})).to.be.reverted
      })

      it('requires at least 1 nft to be minted', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        await expect(nft.connect(minter).mint(0, { value: COST})).to.be.reverted
      })

      it('rejects minting before allowed time', async () => {
        const ALLOW_MINTING_ON = new Date('May 26 2030 18:00:00').getTime().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)
        
        await expect(nft.connect(minter).mint(1, { value: COST})).to.be.reverted
      })

      it('does not allow more NFTs to be minted than max supply', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)
        
        await expect(nft.connect(minter).mint(100, { value: ether(1000)})).to.be.reverted
      })

      it('does not allow more NFTs to be minted than max allowed amount in total', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        await nft.connect(minter).mint(1, { value: COST})
        await nft.connect(minter).mint(1, { value: COST})
        await nft.connect(minter).mint(1, { value: COST})        
        await expect(nft.connect(minter).mint(1, { value: COST})).to.be.reverted
      })

      it('does not allow more NFTs to be minted than max allowed amount at once', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)
        await expect(nft.connect(minter).mint(4, { value: ether(40)})).to.be.reverted
      })

      it('does not return URIs for invalid tokens', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)
        nft.connect(minter).mint(1, { value: COST })

        await expect(nft.tokenURI(2)).to.be.reverted
      })

      it('reverts minting when paused', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)
        let pause = await nft.connect(deployer).pauseMinting() 
        await expect(nft.connect(minter).mint(1, { value: COST})).to.be.reverted
      })

    })

  })

  describe('Displaying NFTs', () => {
    let transaction, result

    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory('NFT')
      nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
      await nft.connect(deployer).addToWhitelist(minter.address)
      transaction = await nft.connect(minter).mint(3, { value: ether(30)})
      result = await transaction.wait()
    })    

    it('returns all the NFTs for a given owner', async () => {
      let tokenIds = await nft.walletOfOwner(minter.address)
//      console.log('owner wallet:', wallet)
      expect(tokenIds.length).to.equal(3)
      expect(tokenIds[0].toString()).to.equal('1')
      expect(tokenIds[1].toString()).to.equal('2')
      expect(tokenIds[2].toString()).to.equal('3')
    })
  })

  describe('', () => {

    describe('Success', async () => {

      let transaction, result, balanceBefore

      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        transaction = await nft.connect(minter).mint(1, { value: COST})
        result = await transaction.wait()

        balanceBefore = await ethers.provider.getBalance(deployer.address)

        transaction = await nft.connect(deployer).withdraw()
        result = await transaction.wait()

      })

      it('deducts contract balance', async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(0)
      })    

      it('sends funds to the owner', async () => {
        expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore)
      })    

      it('emits withdraw event', async () => {
        await expect(transaction).to.emit(nft, 'Withdraw')
          .withArgs(COST, deployer.address)
      })
    })

    describe('Failure', () => {

      it('prevents non-owner from withdrawing', async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10)
        const NFT = await ethers.getContractFactory('NFT')
        nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI) 
        await nft.connect(deployer).addToWhitelist(minter.address)

        nft.connect(minter).mint(1, { value: COST})

        await expect(nft.connect(minter).withdraw()).to.be.reverted
      })
    })

  })

})
