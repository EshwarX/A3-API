/**
 *Name: Xavier Huang
 *Date: May 12th 2022
 *Section: CSE 154 AE
 *This is the js. file for HW3, it defines the rules of
 *the Pokedex game, this is the only edited file. It runs a
 *simple game which player 1 play moves against player 2,
 *player one wins when player 2's HP point is 0 and vice versa.
 *Player can collect more Pokemons when defeating another pokemon.
 */

"use strict";
(function() {

  const LOW_HEALTH = 20;
  const PERCENT = 100;
  const SET = 4;
  const POKEDEX_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php";
  const GAME_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
  let guid;
  let pid;
  let hp;

  window.addEventListener("load", init);

  /** the init function to start the game*/
  function init() {
    getPokedex();
    id("start-btn").addEventListener("click", startGame);
  }

  /** Makes an API requestto get all pokemons and process them*/
  function getPokedex() {
    let getAll = POKEDEX_URL + "?pokedex=all";
    fetch(getAll)
      .then(statusCheck)
      .then(resp => resp.text())
      .then(processData)
      .catch(console.error);
  }

  /**
   *Makes an API request to fill the pokedex view, so that the
   *icons of pokemons are shown.
   *@param {object} responseData fetched object
   */
  function processData(responseData) {
    let pokeNames = responseData.split("\n");
    let shortNames = [];
    let names = [];
    for (let i = 0; i < pokeNames.length; i++) {
      let element = pokeNames[i].split(":");
      names.push(element[0]);
      shortNames.push(element[1]);
      let image = document.createElement("img");
      image.setAttribute("src", "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/" +
      element[1] + ".png");
      image.setAttribute("class", "sprite");
      image.setAttribute("alt", element[0]);
      id("pokedex-view").appendChild(image);
    }
    getImagesByAlt("Bulbasaur").classList.add("found");
    getImagesByAlt("Charmander").classList.add("found");
    getImagesByAlt("Squirtle").classList.add("found");
    foundSprite();
  }

  /** It defines which pokemons are found.*/
  function foundSprite() {
    let foundSprites = qs(".found");
    for (let i = 0; i < foundSprites.length; i++) {
      foundSprites[i].addEventListener("click", showSprite);
    }
  }

  /**
   *It shows all the found pokemons and shows the sprites,
   *When a sprite is selected p1 is populated with its info.
   */
  function showSprite() {
    let hidden = document.querySelectorAll(".moves > .hidden");
    for (let i = 0; i < hidden.length; i++) {
      hidden[i].classList.remove("hidden");
    }
    let getThis = POKEDEX_URL + "?pokemon=" + this.alt.toLowerCase();
    fetch(getThis)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(populate)
      .catch(console.error);
    id("start-btn").classList.remove("hidden");
  }

  /**
   *Populates p1
   *@param {object} responseData - an object with info
   */
  function populate(responseData) {
    let element = responseData;
    populateMain(element, 0);
  }

  /**
   *Populates p2
   *@param {object} responseData - an object with info
   */
  function opponent(responseData) {
    let element = responseData.p2;
    populateMain(element, 1);
    guid = responseData.guid;
    pid = responseData.pid;
  }

  /**
   *Populates the target card with info from the passed object,
   *deifine names, moves, and images.
   *@param {object} element - an object with info
   *@param {integer} index indicating the target card.
   */
  function populateMain(element, index) {
    let baseUrl = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
    qs(".name")[index].textContent = element.name;
    qs(".hp")[index].textContent = (element.hp).toString() + "HP";
    hp = qs(".hp")[0].textContent;
    qs(".pokepic")[index].src = baseUrl + element.images.photo;
    qs(".type")[index].src = baseUrl + element.images.typeIcon;
    qs(".info")[index].textContent = element.info.description;
    qs(".weakness")[index].src = baseUrl + element.images.weaknessIcon;
    let directory = "#p" + (index + 1).toString() + " .card-container  .card ";
    let moves = qs(directory + ".moves .move");
    let cards = qs(directory + ".moves > button");
    let moveImages = getImagesByAlt("Pokemon move");
    moveImages = getPartial(moveImages, index);
    let dpValue = qs(directory + ".moves .dp");
    for (let i = 0; i < element.moves.length; i++) {
      moves[i].textContent = element.moves[i].name;
      moveImages[i].src = baseUrl + "icons/" + element.moves[i].type + ".jpg";
      if (element.moves[i].dp !== undefined) {
        dpValue[i].textContent = element.moves[i].dp + " DP";
      } else {
        dpValue[i].textContent = "";
      }
    }
    if (moves.length > element.moves.length) {
      for (let i = 0; i < moves.length - element.moves.length; i++) {
        cards[i + element.moves.length].classList.add("hidden");
      }
    }
  }

  /**
   * helper function that gets only partial query elements
   *@param {query} query - a query of element.
   *@param {integer} index - a number indicating which part is wanted
   *@return {array} partial query.
   */
  function getPartial(query, index) {
    let output = [];
    for (let i = index * SET; i < index * SET + SET; i++) {
      output.push(query[i]);
    }
    return output;
  }

  /**
   *Starts the game by hiding current views, diaplaying opponent,
   *enable flee button and shows the overall battle view.
   */
  function startGame() {
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs(".hp-info")[0].classList.remove("hidden");
    id("start-btn").classList.add("hidden");
    id("flee-btn").classList.remove("hidden");
    id("flee-btn").addEventListener("click", fleeBattle);
    let directory = "#p1 .card-container  .card ";
    let cards = qs(directory + ".moves > button");
    for (let i = 0; i < cards.length; i++) {
      cards[i].disabled = false;
      cards[i].addEventListener("click", playMove);
    }
    document.getElementsByTagName("h1")[0].textContent = "Pokemon Battle!";
    getGame();
  }

  /** Making a POST request to get the JSON object of the game management.*/
  function getGame() {
    let data = new FormData();
    data.append('startgame', true);
    data.append('mypokemon', document.querySelector(".name").textContent.toLowerCase());
    fetch(GAME_URL, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(opponent)
      .catch(console.error);
  }

  /** Make a POST request to get data when a move is made.*/
  function playMove() {
    id("results-container").classList.remove("hidden");
    id("p1-turn-results").classList.add("hidden");
    id("p2-turn-results").classList.add("hidden");
    id("loading").classList.remove("hidden");
    let data = new FormData();
    data.append("guid", guid);
    data.append("pid", pid);
    let move = getMoveName(this.textContent);
    data.append("movename", move);
    requestPost(data);
  }

  /**
   *Makes POST request with given form data.
   *@param {form} data - A form containing data needed for making POST request
   */
  function requestPost(data) {
    fetch(GAME_URL, {method: 'POST', body: data})
      .then(statusCheck)
      .then(res => res.json())
      .then(displayInfo)
      .catch(console.error);
  }

  /**
   *Processes move text to convert it into a format for API request.
   *@param {string} aString - string of textContent
   *@returns {String} a string with move name in the desired format.
   */
  function getMoveName(aString) {
    let output = [];
    let name = aString.split(" ");
    for (let i = 0; i < name.length; i++) {
      if (name[i].match(/[a-z]/i) && name[i] !== "DP\n") {
        output.push(name[i]);
      }
    }
    let outputString = output.join("").toLowerCase();
    return outputString;
  }

  /**
   *Main function of displaying the game info. stops the game once
   *one player has a HP of 0, enable endgame button.
   *@param {object} responseData - responded data from API request
   */
  function displayInfo(responseData) {
    id("results-container").classList.remove("hidden");
    let oneHp = responseData.p1["current-hp"];
    let twoHp = responseData.p2["current-hp"];
    if (oneHp === 0 || twoHp === 0) {
      if (oneHp === 0) {
        document.getElementsByTagName("h1")[0].textContent = "You Lost!";
        showMove(responseData);
      } else {
        document.getElementsByTagName("h1")[0].textContent = "You Won!";
        id("p1-turn-results").textContent = "Player 1 played " +
        responseData.results["p1-move"] + " and " + responseData.results["p1-result"] + "!";
        id("p2-turn-results").textContent = "";
        getImagesByAlt(responseData.p2.name).classList.add("found");
        foundSprite();
      }
      let cards = document.getElementsByTagName("button");
      for (let i = 0; i < responseData.p1.moves.length; i++) {
        cards[i].disabled = true;
      }
      id("flee-btn").classList.add("hidden");
      id("endgame").classList.remove("hidden");
      id("endgame").addEventListener("click", endGame);
    } else {
      showMove(responseData);
    }
    battleOccuring(oneHp, twoHp, responseData);
  }

  /**
   *Displays moves and results for both sides.
   *@param {object} responseData - battle info
   */
  function showMove(responseData) {
    id("p1-turn-results").textContent = "Player 1 played " +
    responseData.results["p1-move"] + " and " + responseData.results["p1-result"] + "!";
    id("p2-turn-results").textContent = "Player 2 played " +
    responseData.results["p2-move"] + " and " + responseData.results["p2-result"] + "!";
  }

  /**
   *Sets the HP value and health bar, turn health bar red when below 20%.
   *@param {integer} oneHp - current HP value of p1.
   *@param {integer} twoHp - current HP value of p2.
   *@param {object} responseData battle info.
   */
  function battleOccuring(oneHp, twoHp, responseData) {
    generateHP(oneHp, 0, responseData.p1.hp);
    generateHP(twoHp, 1, responseData.p2.hp);
    id("loading").classList.add("hidden");
    id("p1-turn-results").classList.remove("hidden");
    if (id("p1-turn-results").textContent !== "Player 1 played flee and lost!") {
      id("p2-turn-results").classList.remove("hidden");
    } else {
      id("p2-turn-results").classList.add("hidden");
    }
  }

  /** Request POST once the move "flee" is played.*/
  function fleeBattle() {
    id("results-container").classList.remove("hidden");
    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.add("hidden");
    id("loading").classList.remove("hidden");
    let data = new FormData();
    data.append("guid", guid);
    data.append("pid", pid);
    data.append("movename", "flee");
    requestPost(data);
  }

  /**
   *Go back to the Pokedex view, hiding the opponent card,
   *battle view and show collection of pokemons. Show start
   *button, reset HP values.
   */
  function endGame() {
    id("results-container").classList.add("hidden");
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
    id("p2").classList.add("hidden");
    qs(".hp-info")[0].classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    id("endgame").classList.add("hidden");
    qs(".hp")[0].textContent = hp;
    let healthBars = qs(".health-bar");
    for (let i = 0; i < healthBars.length; i++) {
      healthBars[i].style.width = "100%";
      healthBars[i].classList.remove("low-health");
    }
    id("pokedex-view").classList.remove("hidden");
    document.getElementsByTagName("h1")[0].textContent = "Your Pokedex";
  }

  /**
   *checks the status and throw and error, return if no error.
   *@param {object} res fetched object
   *@returns {object} same value if no error.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   *A helper function that returns the element with the id.
   *@param {String} id - a string of id name.
   *@return {object} found element.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   *Returns the array of elements that match the given CSS selector.
   *@param {string} name - CSS query selector
   *@returns {object[]} array of DOM objects matching the query.
   *@returns {object} if there is only one element in the array.
   */
  function qs(name) {
    let output = document.querySelectorAll(name);
    if (output.length === 1) {
      return output[0];
    }
    return output;
  }

  /**
   *Returns the image with given alt value.
   *@param {string} alt - the alt value of the image.
   *@returns {object} img object with the alt value.
   */
  function getImagesByAlt(alt) {
    let allImages = document.getElementsByTagName("img");
    let images = [];
    for (let i = 0; i < allImages.length; i++) {
      if (allImages[i].alt === alt) {
        images.push(allImages[i]);
      }
    }
    if (images.length === 1) {
      return images[0];
    }
    return images;
  }

  /**
   *Updates the HP value.
   *@param {integer} hpPoint the HP value
   *@param {integer} index the index of the query
   *@param {integer} data returned HP value
   */
  function generateHP(hpPoint, index, data) {
    qs(".hp")[index].textContent = hpPoint.toString() + "HP";
    let percent = Math.round((hpPoint / data) * PERCENT);
    qs(".health-bar")[index].style.width = percent + "%";
    if (percent <= LOW_HEALTH) {
      qs(".health-bar")[index].classList.add("low-health");
    }
  }
})();