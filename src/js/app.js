App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  
  init: function() {
    console.log("called init");
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    console.log("called initWeb3");
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
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

      return App.listenForEvents();
      
      console.log("called initContractfdsdhere");
      //App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    console.log("called listenForEvents");
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
        App.render();
        console.log("called render here");
      });
    });
  },

  render: function() {
    console.log("here 22323423");
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

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
      console.log("has been deployed");
      electionInstance = instance;
      return electionInstance.candidatesCount();
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
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
    console.log("All Done");
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
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
