//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./ERC721Enumerable.sol";
import "./SafeMath.sol";
import "./Strings.sol";
import "./Ownable.sol";
import "./INFP.sol";

contract NFP is INFP, ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Strings for uint256;

    uint8 public COMMON = 1;
    uint8 public RARE = 2;
    uint8 public LEGENDARY = 3;
   

    /**
     * @dev Stores amount of tokens minted in specific rarity.
     * param rarity ID
     * returns amount of NFPz sold
     */
    mapping(uint8 => uint16) public amountMinted; // amount of NFPz sold (rarity: amount)

    /**
     * @dev Stores amount of tokens that can be sold in specific rarity.
     * param rarity ID
     * returns amount of NFPz can available for sale
     */
    mapping(uint8 => uint16) public amountTotal; // amount of NFPz can be sold (rarity: amount_total)

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

    modifier rarityExists(uint8 _rarity) {
        require(0 < _rarity && _rarity <= 3, "rarity doesn't exist");
        _;
    }

    constructor(string memory _baseURI) ERC721("Non Fungible Patrons", "NFP") {
        _setBaseURI(_baseURI);
        _setAmountTotal(1, 500);
        _setAmountTotal(2, 38);
        _setAmountTotal(3, 12);
      
    }

    /**
     * @dev Sets domain/path where tokens' metadata is stored.
     * @param _baseUri domain/path
     */
    function setBaseURI(string memory _baseUri) external override onlyOwner {
        _setBaseURI(_baseUri);
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
                            "/",
                            Strings.toString(patronTokenIdInRarity[_tokenId]),
                            "/index.json"
                        )
                    )
                    : "";
        } else {
            return
                bytes(_baseUri).length > 0
                    ? string(
                        abi.encodePacked(
                            _baseUri,
                            "NFPs-NFP.json"
                        )
                    )
                    : "";
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
        override
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
        override
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
            "NFPs: minted NFPs amount is larger than this total limit"
        );
        amountTotal[_rarity] = _amountTotal;
    }

    function _setBaseURI(string memory _baseUri) internal {
        baseURI = _baseUri;
    }

    function _BaseURI() internal view returns (string memory) {
        return baseURI;
    }

    function _minted(uint256 _tokenId) internal view returns (bool) {
        address _tokenOwner = ownerOf(_tokenId);
        if (_tokenOwner != address(0) && _tokenOwner != address(this)) {
            return true;
        }
        return false;
    }
}