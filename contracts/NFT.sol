// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";
//import "@openzeppelin/contracts/security/Pausable.sol";

contract NFT is ERC721Enumerable, Ownable {
	using Strings for uint256;

	uint256 public cost;
	uint256 public maxSupply;
	uint256 public allowMintingOn;
	uint256 public maxAmount = 3;
	string public baseURI;
	string public baseExtension = ".json";
	bool public mintingPaused = false;
	bool public onlyWhitelisted = true;

	mapping(address => uint256) public amountNFTs;
	mapping(address => bool) public whitelist;

	event Mint(uint256 amount, address minter);
	event Withdraw(uint256 amount, address owner);

	constructor(
		string memory _name, 
		string memory _symbol,
		uint256 _cost,
		uint256 _maxSupply,
		uint256 _allowMintingOn,
		string memory _baseURI
	) ERC721(_name, _symbol) {
		cost = _cost;
		maxSupply = _maxSupply;
		allowMintingOn = _allowMintingOn;
		baseURI = _baseURI;
	}

    modifier whenMintingNotPaused() {
        require(!mintingPaused, "Minting is paused");
        _;
    }

	function mint(uint256 _mintAmount) public payable whenMintingNotPaused {
		// Only allow minting after specified time
		require(block.timestamp >= allowMintingOn);
		// Must mint at least 1 token
		require(_mintAmount > 0);
		// Require enough payment
		require(msg.value >= cost * _mintAmount);
		// Cannot mint more than max amount of tokens at once
		require(_mintAmount <= maxAmount);
		// Require having max amount of tokens in total
//		require(
//			amountNFTs[msg.sender] <= maxAmount, 
//			string(abi.encodePacked("Cannot exceed ", Strings.toString(maxAmount)))
//		);
//		require(balanceOf(address(msg.sender)) <=  maxAmount);
		require(
			amountNFTs[msg.sender] + _mintAmount <= maxAmount,
			"Exceeds max allowed per address"
		);

		if (onlyWhitelisted) {
			require(whitelist[msg.sender], "Address not whitelisted");
		}

		uint256 supply = totalSupply();

		// Do not let them mint more tokens than available
		require(supply + _mintAmount <= maxSupply);

		// create tokens
		for(uint256 i = 1; i <= _mintAmount; i++) {
		  _safeMint(msg.sender, supply + i);			
		}

		amountNFTs[msg.sender] += _mintAmount;

		emit Mint(_mintAmount, msg.sender);

	}

	// Return metadata IPFS url
	// EG: 'ipfs://bafybeidpuzq54zqnmgq5lsbegxwrwkgrt72545l3pyj6c4y3qsprfamu6u/1.json'
	function tokenURI(uint256 _tokenId) 
		public 
		view 
		virtual 
		override 
		returns(string memory) 
	{
		require(_exists(_tokenId), "token does not exist");
		return(string(abi.encodePacked(baseURI, _tokenId.toString(), baseExtension)));
	} 

	function walletOfOwner(address _owner) public view returns(uint256[] memory) {
		uint256 ownerTokenCount = balanceOf(_owner);
		uint256[] memory tokenIds = new uint256[](ownerTokenCount);
		for(uint256 i; i < ownerTokenCount; i++) {
			tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
		}
		return tokenIds;
	}

	function withdraw() public onlyOwner {
		uint256 balance = address(this).balance;

		(bool success, ) = payable(msg.sender).call{value: balance}("");
		require(success);

		emit Withdraw(balance, msg.sender);
	}

	function setCost(uint256 _newCost) public onlyOwner {
		cost = _newCost;
	}

    function pauseMinting() public onlyOwner {
        mintingPaused = true;
    }    

    function resumeMinting() public onlyOwner {
        mintingPaused = false;
    }

    function addToWhitelist(address _white) public onlyOwner {
    	whitelist[_white] = true;
    }

    function checkWhitelist(address _white) public view returns(bool) {
    	return whitelist[_white];
    }

    function setOnlyWhitelisted(bool _state) public onlyOwner {
    	onlyWhitelisted = _state;
    }
}
