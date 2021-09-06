//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

contract StakeOwnerExtension {
    address stakeOwner;
    uint256 stakeOwnerStake = 0;

    modifier onlyStakeOwner {
        require(
            msg.sender == stakeOwner,
            "Only stake owner can call this function."
        );
        _;
    }

    function changeStakeOwnerAddress(address _stakeOwner)
        external
        onlyStakeOwner
    {
        _setStakeOwnerAddress(_stakeOwner);
    }

    function _setStakeOwnerAddress(address _stakeOwner) internal {
        stakeOwner = _stakeOwner;
    }

    function _setStakeOwnerStake(uint256 _stakeOwnerStake) internal {
        stakeOwnerStake = _stakeOwnerStake;
    }
}