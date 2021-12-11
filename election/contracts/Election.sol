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
        string addr;
        bool isApproved;
        bool isCandidate;
        bool isAdmin;
    }
    mapping(uint => Candidate) public candidates;

    mapping(uint => User) public users;
    mapping(address => bool) public voters;
    // Store Candidates Count
    uint public candidatesCount;
    uint public userCount;
    string public admin;
    event votedEvent (
        uint indexed _candidateId
    );

    event registrationEvent (
        uint indexed _candidateId
    );
    constructor() public {
        addUsers("Admin", "0x8a62c58eb4d845c6c1a49d56bf466b35e0733438", true, true);
        admin = '0x8a62c58eb4d845c6c1a49d56bf466b35e0733438';
    }

    function addCandidate (uint _userId, string memory _name) public {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        users[_userId].isCandidate = true;
    }

    function addUsers(string memory _name, string memory _addr, bool isAdmin, bool isApproved) public {
        userCount++;
        users[userCount] = User(userCount, _name, _addr, isApproved, false, isAdmin);
        emit registrationEvent(userCount);
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

    function grantAccess(uint _userId) public {
        require(_userId > 0 && _userId <= userCount);
        users[_userId].isApproved = true; 
    }

}
