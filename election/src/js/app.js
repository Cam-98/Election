App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  rendered:  false,
  
  initMetaMask: function() {

        const accounts = ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        App.account = account;
    //enableUser();
},

  init: function() {
    console.log("called init");
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    console.log("called initWeb3");
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      console.log("in here")
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }

    if (window.ethereum !== 'undefined') {
      
    }
    return App.initContract();
  },

  initContract: function() {
    console.log("Called initContract");
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      return  App.listenForEvents();
      
      console.log("called initContractfdsdhere");
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    console.log("called listenForEvents ");
    App.contracts.Election.deployed().then(function(instance) {
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
        if (!App.rendered) {
          App.render();
          App.rendered = true;
        }
        console.log("called render here");
      });
    });
  },

  render: function() {
    console.log("here 22323423");
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var registrationForm = $("#register");

    loader.show();
    content.hide();

    //input = prompt("Waiting"); 
    // Load account data
    // web3.eth.getCoinbase(function(err, account) {

    //   if (err === null) {
    //     App.account = account;
    //     console.log(account);
    //     $("#accountAddress").html("Your Account: " + account);
    //   }
    // });

    if(web3.currentProvider.enable){
      //For metamask
      web3.currentProvider.enable().then(function(acc){
          App.account = acc[0];
          $("#accountAddress").html("Your Account: " + App.account);
      });
    } else{
      App.account = web3.eth.accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);
    }

    console.log("Your acc" + App.account)
    //input = prompt("Waiting"); 
    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {

      App.checkUser(instance).then(function(validUser) {
          console.log(validUser);
        if (validUser) {
          return instance.candidatesCount().then(function(candidateCount) {
            App.contracts.Election.deployed().then(function(instance) {
              electionInstance = instance;
              candidatesCount = electionInstance.candidatesCount();
              return candidatesCount;
            }).then(function(candidatesCount) {
              var candidatesResults = $("#candidatesResults");
              candidatesResults.empty();
          
              var candidatesSelect = $('#candidatesSelect');
              candidatesSelect.empty();
              console.log("Number of candidates: " + candidatesCount);
              for (var i = 1; i <= candidatesCount.toNumber(); i++) {
                electionInstance.candidates(i).then(function(candidate) {
                  var id = candidate[0];
                  var name = candidate[1];
                  var voteCount = candidate[2];
          
                  // Render candidate Result
                  var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                  candidatesResults.append(candidateTemplate);
          
                  // Render candidate ballot option
                  var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
                  candidatesSelect.append(candidateOption);
                });
              }
              return electionInstance.voters(App.account);
            }).then(function(hasVoted) {
              if(hasVoted) {
                $('form').hide();
              }
              loader.hide();
              content.show();
              registrationForm.hide();
            }).catch(function(error) {
                console.warn(error);
            });
          });}
          else {
            console.log("Not added")
            loader.hide();
            content.hide();
            registrationForm.show()
          }
          
      });
      })
    console.log("All Done");
  },

  checkUser : function(instance) {
    console.log("checkUser");
    return instance.userCount().then(function(userCount) {
      var temp = false;
      for(var i=1; i<= userCount.toNumber(); i++){
        console.log("here");
        temp = instance.users(i).then(function(user){
          console.log(App.account + " " + user[2]); 
          if(user[2] == App.account && user[3]){ temp=true;console.log("returning true" + temp); return temp}
        });
      }
      console.log("here" + temp);
      return temp;
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  createUser: function() {
    console.log("Creating user");
    var name = $('#name').val();
    App.contracts.Election.deployed().then(function(instance) {
       electionInstance = instance;
       return electionInstance.userCount().then(function(userCount) {
         console.log("user count: " + userCount)
        var temp = true;
        for (var i=1; i<=userCount.toNumber(); i++) {
          temp = electionInstance.users(i).then(function(user) {
          if(user[2] == App.account) {temp=false;console.log("here returning false");return false;}
           return true;
          });
          console.log(temp)
          if (temp == false) {
            console.log("breaking");
            break;
          }
         }
         if (temp == true) {
           console.log("Created User")
            electionInstance.addUsers(name, App.account, false, false).then(function(ins) {console.log(ins)});
         }
      })
    });
  }
}

const ethereumButton = document.querySelector('.enableEthereumButton');

// ethereumButton.addEventListener('click', () => {
//   //Will Start the metamask extension
//   window.ethereum.request({ method: 'eth_requestAccounts' });
// });

$(function() {
  $(window).load(function() {
    App.initMetaMask()
    App.init();
  });
});
