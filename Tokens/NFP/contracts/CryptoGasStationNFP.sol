// NON FUNGIBLE PATRONS - NFPs
// THE GAS STATION - https://www.gasstationcrypto.com

// 550 MAX MINT
// 500 COMMON
// 38 RARE
// 12 LEGENDARY
// STAKE TO EARN USDC

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract CryptoGasStationNFP is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using SafeMath for uint16;

    using Strings for uint256;

    using SafeERC20 for ERC20;

    uint8 public COMMON = 1;
    uint8 public RARE = 2;
    uint8 public LEGENDARY = 3;

    /**
     * @dev Stores amount of tokens minted in specific rarity.
     * param rarity ID
     * returns amount of NFPs sold
     */
    mapping(uint8 => uint16) public amountMinted; // amount of NFPs sold (rarity: amount)

    /**
     * @dev Stores amount of tokens that can be sold in specific rarity.
     * param rarity ID
     * returns amount of NFPz can available for sale
     */
    mapping(uint8 => uint16) public amountTotal; // amount of NFPs can be sold (rarity: amount_total)

    /**
     * @dev Get NFP rarity by token ID
     * param token ID
     * returns rarity ID
     */
    mapping(uint256 => uint8) public patronRarity; // NFP token rarity (tokenId: rarityId)

    /**
     * @dev Get NFP token ID in specific rarity
     * param token ID (in contract)
     * returns token ID (in rarity)
     */
    mapping(uint256 => uint16) public patronTokenIdInRarity; // NFP token id in rarity category (tokenId: tokenId_in_NFP_rarity)

    /**
     * @dev Domain/path where tokens' metadata is stored
     */
    string public baseURI; // Base URI

    /**
     * @dev Last token ID
     */
    uint256 public tokenId = 0;

    /**
     * @dev Get patron rarity price
     * param rarity ID
     * returns price in wei
     */
    mapping(uint8 => uint256) public patronRarityPrice;

    ERC20 public usdc;

    address public payTo;

    event BuyPatron(address _owner, uint256 _tokenId, uint8 _rarity);

    modifier rarityExists(uint8 _rarity) {
        require(
            0 < _rarity && _rarity <= 3,
            "CryptoGasStationNFP: rarity doesn't exist"
        );
        _;
    }

    constructor(
        string memory _initialBaseURI,
        ERC20 _usdc,
        address _payTo
    ) ERC721('Gas Station NFPs', 'NFP') {
        baseURI = _initialBaseURI;
        usdc = _usdc;
        payTo = _payTo;

        _setAmountTotal(COMMON, 500);
        _setAmountTotal(RARE, 38);
        _setAmountTotal(LEGENDARY, 12);
    }

    /**
     * @dev Sets domain/path where tokens' metadata is stored.
     * @param _newBaseURI domain/path
     */
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Returns token URI.
     * @param _tokenId token ID
     * @return token metadata URI
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        string memory _baseUri = _baseURI();
        if (_exists(_tokenId)) {
            return
                bytes(_baseUri).length > 0
                    ? string(
                        abi.encodePacked(
                            _baseUri,
                            Strings.toString(patronRarity[_tokenId]),
                            '/',
                            Strings.toString(patronTokenIdInRarity[_tokenId]),
                            '/index.json'
                        )
                    )
                    : '';
        } else {
            return
                bytes(_baseUri).length > 0
                    ? string(abi.encodePacked(_baseUri, 'NFPs-NFP.json'))
                    : '';
        }
    }

    /**
     * @dev Get array of tokenNumbers for the _owner
     * @param _owner address to get tokens by
     * @return list of token IDs
     */
    function getNFPsOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    /**
     * @dev Set amount of tokens which can be minted in specific rarity
     * @param _rarity rarity ID
     * @param _amountTotal amount (has to be larger than amount of minted tokens)
     */
    function setAmountTotal(uint8 _rarity, uint16 _amountTotal)
        external
        onlyOwner
    {
        _setAmountTotal(_rarity, _amountTotal);
    }

    function _setAmountTotal(uint8 _rarity, uint16 _amountTotal)
        internal
        rarityExists(_rarity)
    {
        require(
            _amountTotal >= amountMinted[_rarity],
            'CryptoGasStationNFP: minted NFPs amount is larger than this total limit'
        );
        amountTotal[_rarity] = _amountTotal;
    }

    /**
     * @dev Update payTo address
     * @param _payTo new address to send payments to
     */
    function updatePayTo(address _payTo) external onlyOwner {
        payTo = _payTo;
    }

    function getPatronRarityPrice(uint8 _rarity)
        public
        view
        rarityExists(_rarity)
        returns (uint256)
    {
        uint256 currentSupply = amountMinted[_rarity];
        uint8 usdcDecimals = usdc.decimals();

        if (_rarity == LEGENDARY) {
            return
                uint256(750).mul(10**usdcDecimals).add(
                    uint256(375).mul(10**usdcDecimals).mul(currentSupply)
                );
        }

        if (_rarity == RARE) {
            return
                uint256(250).mul(10**usdcDecimals).add(
                    uint256(39).mul(10**usdcDecimals).mul(currentSupply)
                );
        }

        return
            uint256(25).mul(10**usdcDecimals).add(
                uint256(25).mul(10**usdcDecimals).mul(currentSupply / 125)
            );
    }

    /**
     * @dev Buy patron
     * @param _rarity rarity ID
     * @return token ID
     */
    function buyPatron(uint8 _rarity)
        external
        payable
        rarityExists(_rarity)
        returns (uint256)
    {
        address msgSender = msg.sender;
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            _amountMinted < _amountTotal,
            'CryptoGasStationNFP: all patrons in this rarity are sold'
        );

        usdc.safeTransferFrom(msg.sender, payTo, getPatronRarityPrice(_rarity));

        tokenId = tokenId.add(1);
        _amountMinted = _amountMinted + 1;
        amountMinted[_rarity] = _amountMinted;
        patronRarity[tokenId] = _rarity;
        patronTokenIdInRarity[tokenId] = _amountMinted;

        _mint(msgSender, tokenId);
        emit BuyPatron(msgSender, tokenId, _rarity);

        return tokenId;
    }

    /**
     * @dev Mint patron
     * @param _rarity rarity ID
     * @param _to reciever
     * @return token ID
     */
    function mintPatron(uint8 _rarity, address _to)
        external
        onlyOwner
        rarityExists(_rarity)
        returns (uint256)
    {
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            _amountMinted < _amountTotal,
            'CryptoGasStationNFP: all patrons in this rarity are sold'
        );
        tokenId = tokenId.add(1);
        _amountMinted = _amountMinted + 1;
        amountMinted[_rarity] = _amountMinted;
        patronRarity[tokenId] = _rarity;
        patronTokenIdInRarity[tokenId] = _amountMinted;

        _mint(_to, tokenId);

        return tokenId;
    }
}
