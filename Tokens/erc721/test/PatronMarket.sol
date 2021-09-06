//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFP.sol";
import "./StakeOwnerExtension.sol";
import "./WithdrawExtension.sol";

contract PatronMarket is
    NFP,
    StakeOwnerExtension,
    WithdrawExtension
{
    using SafeMath for uint256;
    using SafeMath for uint16;

    using Strings for uint256;

    /**
     * @dev Get patron rarity price
     * param rarity ID
     * returns price in wei
     */
    mapping(uint8 => uint256) public patronRarityPrice;

    event BuyPatron(address _owner, uint256 _tokenId, uint8 _rarity);

    constructor(string memory _baseURI, address _stakeOwner)
        NFP(_baseURI)
    {
        _setStakeOwnerAddress(_stakeOwner);
        _setStakeOwnerStake(5);

        _setpatronrarityPrice(1, 0);
        _setpatronrarityPrice(2, (16 * 10**18) / 100); // 0.16 BNB
        _setpatronrarityPrice(3, (32 * 10**18) / 100); // 0.32 BNB
        
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
        uint256 msgValue = msg.value;
        address msgSender = msg.sender;
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            msgValue >= patronRarityPrice[_rarity],
            "PatronMarket: patron costs more"
        );
        require(
            _amountMinted < _amountTotal,
            "PatronMarket: all patrons in this rarity are sold"
        );
        tokenId = tokenId.add(1);
        _amountMinted = _amountMinted + 1;
        amountMinted[_rarity] = _amountMinted;
        patronRarity[tokenId] = _rarity;
        patronTokenIdInRarity[tokenId] = _amountMinted;

        payable(stakeOwner).transfer(msgValue.mul(stakeOwnerStake).div(100));

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
    function mintpatron(uint8 _rarity, address _to)
        external
        onlyOwner
        rarityExists(_rarity)
        returns (uint256)
    {
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            _amountMinted < _amountTotal,
            "PatronMarket: all patrons in this rarity are sold"
        );
        tokenId = tokenId.add(1);
        _amountMinted = _amountMinted + 1;
        amountMinted[_rarity] = _amountMinted;
        patronRarity[tokenId] = _rarity;
        patronTokenIdInRarity[tokenId] = _amountMinted;

        _mint(_to, tokenId);

        return tokenId;
    }

    /**
     * @dev Mint many patrons
     * @param _rarity rarity ID
     * @param _to reciever
     * @param _amount amount of patrons to buy
     */
    function mintpatrons(
        uint8 _rarity,
        uint16 _amount,
        address _to
    ) external onlyOwner rarityExists(_rarity) {
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            _amount <= _amountTotal.sub(_amountMinted),
            "PatronMarket: looks like it is not so many patrons are left"
        );
        for (uint256 index = 0; index < _amount; index++) {
            tokenId = tokenId.add(1);
            _amountMinted = _amountMinted + 1;
            amountMinted[_rarity] = _amountMinted;
            patronRarity[tokenId] = _rarity;
            patronTokenIdInRarity[tokenId] = _amountMinted;

            _mint(_to, tokenId);
        }
    }

    /**
     * @dev Buy many patrons
     * @param _rarity rarity ID
     * @param _amount amount of patrons to buy
     */
    function buyPatron(uint8 _rarity, uint16 _amount)
        external
        payable
        rarityExists(_rarity)
    {
        uint256 msgValue = msg.value;
        address msgSender = msg.sender;
        uint16 _amountMinted = amountMinted[_rarity];
        uint16 _amountTotal = amountTotal[_rarity];
        require(
            _amount <= _amountTotal.sub(_amountMinted),
            "PatronMarket: looks like it is not so many patrons are left"
        );
        require(
            msgValue >= patronRarityPrice[_rarity] * _amount,
            "PatronMarket: patrons cost more"
        );

        for (uint256 index = 0; index < _amount; index++) {
            tokenId = tokenId.add(1);
            _amountMinted = _amountMinted + 1;
            amountMinted[_rarity] = _amountMinted;
            patronRarity[tokenId] = _rarity;
            patronTokenIdInRarity[tokenId] = _amountMinted;

            _mint(msgSender, tokenId);
            emit BuyPatron(msgSender, tokenId, _rarity);
        }

        payable(stakeOwner).transfer(msgValue.mul(stakeOwnerStake).div(100));
    }

    /**
     * @dev Set patron rarity price
     * @param _rarity rarity ID
     * @param _price price in wei
     */
    function setpatronrarityPrice(uint8 _rarity, uint256 _price) external onlyOwner {
        _setpatronrarityPrice(_rarity, _price);
    }

    /**
     * @dev Check if token is sold
     * @param _tokenId token ID
     * @return token is sold (true if sold/false if not)
     */
    function tokenSold(uint256 _tokenId) external view returns (bool) {
        return _exists(_tokenId);
    }

    function _setpatronrarityPrice(uint8 _rarity, uint256 _price)
        internal
        rarityExists(_rarity)
    {
        patronRarityPrice[_rarity] = _price;
    }
}