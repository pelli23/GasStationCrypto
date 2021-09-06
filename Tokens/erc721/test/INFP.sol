//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface INFP is IERC721 {
    function getNFPsOfOwner(address _owner)
        external
        view
        returns (uint256[] memory);

    function setBaseURI(string memory _baseUri) external;

    function setAmountTotal(uint8 _rank, uint16 _amountTotal) external;
}