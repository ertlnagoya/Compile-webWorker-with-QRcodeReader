pragma solidity >=0.7.0 <0.9.0;

contract Storage {
    uint256 data;

        function set(uint256 d) public{
                data = d;
        }

        function get() public view returns (uint retVal){
                return data;
        }
}