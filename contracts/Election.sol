pragma solidity >=0.4.22 <0.8.0;

contract Election {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct User {
        uint id;
        string name;
        address addr;
    }
    mapping(uint => Candidate) public candidates;

    mapping(uint => User) public Users;
    mapping(address => bool) public voters;
    // Store Candidates Count
    uint public candidatesCount;
    uint public userCount;
    event votedEvent (
        uint indexed _candidateId
    );

    constructor() public {
        addCandidate("Candidate1");
        addCandidate("Candidate2");
    }

    function addCandidate (string memory _name) private {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);

    }

    function addUsers(string memory _name, address _addr) private {
        userCount++;
        Users[userCount] = User(userCount, _name, _addr);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before 
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }

}
