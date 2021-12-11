Admin = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasVoted: false,
  
    
    init: function() {
      console.log("called init");
      return Admin.initWeb3();
    },
  
    initWeb3: function() {
      // TODO: refactor conditional
      console.log("called initWeb3");
      if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        Admin.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        Admin.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        web3 = new Web3(Admin.web3Provider);
      }
      return Admin.initContract();
    },
  
    initContract: function() {
      console.log("Called initContract");
      $.getJSON("Election.json", function(election) {
        // Instantiate a new truffle contract from the artifact
        Admin.contracts.Election = TruffleContract(election);
        // Connect provider to interact with contract
        Admin.contracts.Election.setProvider(Admin.web3Provider);
  
        Admin.listenForEvents();
        return Admin.render();
      });
    },
  
    // Listen for events emitted from the contract
    listenForEvents: function() {
      console.log("called listenForEvents");
      Admin.contracts.Election.deployed().then(function(instance) {
        console.log("Elections has been deployed");
        // Restart Chrome if you are unable to receive this event
        // This is a known issue with Metamask
        // https://github.com/MetaMask/metamask-extension/issues/2393
        instance.votedEvent({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered", error, event)
          // Reload when a new vote is recorded
          Admin.render();
          console.log("called render here");
        });
      });
    },
  
    render: function() {
      console.log("here 22323423");
      var electionInstance;
      var newUserList = $("#newUserList");
      var candidateSelect = $("#candidateSelect");
  
      if(web3.currentProvider.enable){
        //For metamask
        web3.currentProvider.enable().then(function(acc){
            Admin.account = acc[0];
            $("#accountAddress").html("Your Account: " + Admin.account);
        });
      } else{
        Admin.account = web3.eth.accounts[0];
        $("#accountAddress").html("Your Account: " + Admin.account);
      }
  
      console.log("Your acc" + Admin.account)
      //input = prompt("Waiting"); 
      // Load contract data
      Admin.contracts.Election.deployed().then(function(instance) {
  
        Admin.checkUser(instance).then(function(validUser) {
            console.log(validUser);
          if (validUser) {
            return instance.userCount().then(function(userCount) {
              Admin.contracts.Election.deployed().then(function(instance) {
                electionInstance = instance;
                let userCount = electionInstance.userCount();
                return userCount;
              }).then(function(userCount) {
                var userList = $("#userList");
                var candidateList = $('#candidateList')
                
                userList.empty();
                candidateList.empty();
                for (var i = 1; i <= userCount.toNumber(); i++) {
                  var userListTemp = null;
                  var candidateListTemp = null;
                  electionInstance.users(i).then(function(user) {
                    console.log(user);
                    console.log("1. " + user[2]);
                    console.log("2. " + user[3]);
                    console.log("3. " + user[4]);
                    console.log("4. " + user[5]);
                    if (!user[3]) {
                      //var id = candidate[0];
                      var name = user[1];
                      var addr = user[2];
              
                      // Render candidate Result
                      userListTemp = "<tr><td><input type='checkbox'/></td><th>" + (i+1) + "</th><td>" + name + "</td><td>" + addr + "</td></tr>"
                      if (userListTemp != null) {
                        userList.append(userListTemp);
                      }
                    }
                    if (user[3] && !user[4] && !user[5]) {
                      var name = user[1];
                      var addr = user[2];
              
                      // Render candidate Result
                      candidateListTemp = "<tr><td><input type='checkbox'/></td><th>" + (i+1) + "</th><td>" + name + "</td><td>" + addr + "</td></tr>"
                      
                      if(candidateListTemp != null) {
                        candidateList.append(candidateListTemp);
                      }
                    }
                  });
                }
                return electionInstance.voters(Admin.account);
              }).catch(function(error) {
                  console.warn(error);
              });
            }); 
          }
          else {
            alert("ACCESS DENIED!! You are not the admin")
            console.log("Not added")
            newUserList.hide();      
            candidateSelect.hide();     
          }
            
        });
        })
      console.log("All Done");
    },
  
    checkUser : function(instance) {
      console.log("checkUser");
      return instance.admin().then(function(adminId) {
          if (Admin.account == adminId) return true;
          return false;
      })
    },
  

    test: function() {
      console.log("testing");
    },

    approveUsers: function() {
      
      $("#userList input[type=checkbox]:checked").each(function() { 
        
        var row = $(this).closest("tr")[0];
        addr =  row.cells[3].innerHTML;
        Admin.contracts.Election.deployed().then(function(instance) {
          electionInstance = instance;
          
          return electionInstance.userCount() 
        }).then(function(userCount) {
          console.log("here3");
          console.log(userCount.toNumber());
          for (var i = 1; i <= userCount.toNumber(); i++) {
            electionInstance.users(i).then(function(user) {
              console.log(user[2] + " " + addr);
              if (user[2] == addr) {
                console.log("granting access");
                electionInstance.grantAccess(user[0]);
              }
            })
          }

        })
      });
      alert("Users have been appproved");
    },

    addCandidates: function() {
      $("#candidateList input[type=checkbox]:checked").each(function() { 
        var row = $(this).closest("tr")[0];
        addr =  row.cells[3].innerHTML;
        Admin.contracts.Election.deployed().then(function(instance) {
          electionInstance = instance;
          return electionInstance.userCount() 
        }).then(function(userCount) {
          for (var i = 1; i <= userCount.toNumber(); i++) {
            electionInstance.users(i).then(function(user) {
              if (user[2] == addr) {
                electionInstance.addCandidate(user[0], user[1]);
              }
            })
          }
        })
      });
      alert("Candidats have been added");
    }
  };
  
  
  
  $(function() {
    $(window).load(function() {
      console.log("hello there")
      Admin.init();
    });
  });
  