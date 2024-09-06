var config = {
  draggable: true,
  position: 'start',
  onDrop: onDrop,
  draggable: false,
  snapbackSpeed: 100, // Customize snap speed for better touch handling
  dropOffBoard: 'snapback', // Ensures pieces snap back if dropped off the board
  onDragStart: onDragStart,
  onSnapEnd: onSnapEnd,
  onMoveEnd: onMoveEnd
}
var $board = $('#board') // DIV element
var myboard = Chessboard('board', config); // board from chessboard.js
var mygame = new Chess()
var myboardgame = new Chess()
var squareToHighlight = null
var squareFromHighlight = null
var squareClass = 'square-55d63'
var modeSolveProblem = false
var previousHighlightedMove = null; // hightlighted move on PGN game

// Load problem & game csv files
let rcproblemData = [];
let gameData = [];
let selectedBlindMoves = 0
document.addEventListener('DOMContentLoaded', function() {
    Papa.parse('rc_problem.csv', {
        download: true,
        header: true,
        complete: function(results) {
            rcproblemData = results.data;
            console.log('Problems loaded:');
        }
    });

    Papa.parse('games.csv', {
        download: true,
        header: true,
        complete: function(results) {
            gameData = results.data;
            console.log('Game data loaded:');
        }
    });
});

// nblindmoves
document.getElementById('mySelect').addEventListener('change', function() {
    //selectedBlindMoves = this.value;
    selectedBlindMoves = this.value === "max" ? -1 : parseInt(this.value);
    console.log("Selected blindmoves ", selectedBlindMoves)
});

// Prevent default touch behavior to avoid issues with dragging
document.getElementById('board').addEventListener('touchmove', function(event) {
    event.preventDefault(); // Prevent the default touch action (scrolling)
}, { passive: false });
document.getElementById('board').addEventListener('touchstart', function(event) {
    event.preventDefault();
}, { passive: false });

// Disable dragging of images (to prevent dragging the piece image itself)
document.querySelectorAll('#board img').forEach(function(img) {
    img.ondragstart = function() {
        return false;
    };
});

class ChessProblem {
    constructor(fento = '', solution = '', game = '', board='') {
        console.log("New Problem")
        this.fento = fento;
        this.solution = solution;
        this.game = game;
        this.pgnstring = "";
        this.startMove = 0;
        this.currentMove = 0;
        this.halfmove = 0;
    }

    fillPgn(pgnstring)
    {
        console.log("fillPgn ")
        mygame.load_pgn(pgnstring)
        myboardgame.load_pgn(pgnstring)

        this.pgnstring = pgnstring
        var moves = mygame.history();
        if (moves[moves.length - 1] === "") {
           moves = moves.slice(0, -1);
        }
        this.moves = moves
        this.nmoves = this.moves.length

    }

    fillValues(problem)
    {
        // PGN stuff
        console.log("fillValues ", problem)

        // FEN stuff
        const fento = problem.fento
        var fenparts = fento.split(' ');
        this.halfMove = fenparts[5]
        var piecePlacement = fenparts[0];
        var newPiecePlacement = piecePlacement.replace(/1+/g, match => match.length);
        fenparts[0] = newPiecePlacement;
        this.sideToMove = fenparts[1]
        var newFen = fenparts.join(' ');
        this.fento = newFen

        // SOLUTION
        const solutionlist = problem.var1_0.split(' ')
        currentProblem.solution = solutionlist
        console.log("SolutionList ", solutionlist)
    }
    getFen() {
        return this.fento;
    }

    getSolution() {
        return this.solution;
    }

    getGame() {
        return this.game;
    }
}
const currentProblem = new ChessProblem("1r1q1rk1/nbn1b1pp/8/1p2pp2/1P6/2NP1NP1/Q3PPBP/1R3RK1 b - - 1 16", ['dit is heeel raar'], myboardgame, myboard)


/////////////////////////////////////////////
////////////// LAYOUT STUFF  //////////////
function hideElement(buttonName) {
    var el = document.getElementById(buttonName);
    //    console.log("Hide element ", buttonName )
    el.style.display = 'none';
    //el.classList.add('hidden'); // Adds the 'hidden' class to hide the button
}

function showElement(buttonName) {
    var el = document.getElementById(buttonName);
    el.style.display = 'inline-block';
    //el.classList.remove('hidden'); // Adds the 'hidden' class to hide the button
}

function hideMovesAndNumbers1(start, end) {

    console.log("HideMovesNumbers ", start, " ", end)
    const moveElements = document.querySelectorAll('#move-list span');

    for (let i = 0; i < moveElements.length; i++) {
        const moveElement = moveElements[i];
        if (i >= (start - 1) * 2 && i < end * 2) {
            console.log("Element ", i, " : ", moveElement)
  //        console.log(moveElement.classList);
            //moveElement.classList.add('hidden');
  //          moveElement.style.display = 'none'
            console.log(moveElement.classList);
        } else {
            moveElement.classList.remove('hidden');
        }
    }
}


function hideMovesAndNumbers(start, end) {
    console.log("Hide moves")

    for (let i = start; i < end; i++) {

        let moveElement = document.querySelector(`.move[data-move-index="${i}"]`);
        if (moveElement) {
            console.log("Element ", i, " ", moveElement)
            moveElement.classList.add('hidden');
        }
        if (i % 2 === 0) {
            let moveNumberElement = document.querySelectorAll('#move-list .move-number')[i/2];
            console.log("MovenumberElement ", i/2, ": ", moveNumberElement)
            if (moveNumberElement) {
                moveNumberElement.classList.add('hidden');
            }
        }
    }
}

function showMoves(start, end) {
    console.log("show moves ", start, " ", end)
    for (let i = start; i < end; i++) {
        let moveElement = document.querySelector(`.move[data-move-index="${i}"]`);
        if (moveElement) {
            moveElement.classList.remove('hidden');
        }

        // Show the move number as well
        if (i % 2 === 0) {
            let moveNumberElement = document.querySelectorAll('#move-list .move-number')[i/2];
            if (moveNumberElement) {
                moveNumberElement.classList.remove('hidden');
            }
        }
    }
}


// todo: nodig?
function updateChessboard(fen) {
    myboardgame.load(fen)
    myboard.position(fen);
}

function resizeChessboard() {
    var boardWidth = Math.min(window.innerWidth * 0.9, 400); // Set a maximum board width
    var boardElement = document.getElementById('board');
    boardElement.style.width = boardWidth + 'px';
    boardElement.style.height = boardWidth + 'px';
    myboard.resize();
}

/* color green/red when solution is good/false */
function triggerFadeBlink(color) {
    if (color == 'green')
    {
        document.body.classList.add('fade-blink-green');
        setTimeout(function() {
        document.body.classList.remove('fade-blink-green'); }, 1000);
    }
    else {
    document.body.classList.add('fade-blink');
    setTimeout(function() {
        document.body.classList.remove('fade-blink');}, 1000);
    }
}

function removeHighlights ()
 {
  console.log("Remove Highlights ", squareFromHighlight, " ", squareToHighlight)
  $board.find('.square-' + squareFromHighlight).removeClass('highlight-black')
  $board.find('.square-' + squareToHighlight).removeClass('highlight-black')

  $board.find('.square-' + squareFromHighlight).removeClass('highlight-white')
  $board.find('.square-' + squareToHighlight).removeClass('highlight-white')

}

function clearBoard()
{
    var moveList = document.getElementById('move-list');
    moveList.innerHTML = ''; // This removes all existing moves
    moveList.style.display = 'none';
    removeHighlights()
 }

/* Display game & moves */
function loadGameOnBoard(pgnString)
{
    console.log("Load game on board ")
    clearBoard()
    //var moves = pgnString.split(';');
    var moves = currentProblem.moves
    var moveList = document.getElementById('move-list');
    moveList.style.display = 'inline-block';
    //moveList.style.display = 'block';

    moves.forEach(function(move, index) {
    // Add the move number before the first move of each pair
        if (index % 2 === 0) {
            var moveNumber = Math.floor(index / 2) + 1; // Calculate move number
            var moveNumberElement = document.createElement('span');
            moveNumberElement.innerHTML = moveNumber + ". "; // Add move number
            moveNumberElement.classList.add('move-number');
            moveNumberElement.classList.add('hidden');
            moveList.appendChild(moveNumberElement);
        }

        // Add the move itself
        var moveElement = document.createElement('span');
        moveElement.innerHTML = move + " ";
        moveElement.classList.add('move');
        moveElement.classList.add('hidden');
        moveElement.dataset.moveIndex = index;
        moveList.appendChild(moveElement);
    });
    // Add click event to each move to execute it on the board
    document.querySelectorAll('.move').forEach(function(element) {
        element.addEventListener('click', function() {
            var moveindex = parseInt(this.dataset.moveIndex);
            console.log("click: moveindex ", moveindex)
            currentProblem.currentMove = moveindex
            executeMovesUpTo(moves, moveindex);
            // Highlight the clicked move
            if (previousHighlightedMove) {
                previousHighlightedMove.classList.remove('highlighted');
            }
            this.classList.add('highlighted');
            previousHighlightedMove = this;
        });
    });
}



////////////// GAME STUFF ///////////////////////////
function executeMovesUpTo(moves, moveIndex)
{
    console.log("executeMovesUpTo ", moveIndex, " ", moves)
    myboardgame.reset();
    removeHighlights()
    var move;
    for (var i = 0; i <= moveIndex; i++) {
        move = myboardgame.move(moves[i]);
    }
    myboard.position(myboardgame.fen());
    currentProblem.currentMove = moveIndex

    if (move) {
        $board.find('.square-' + move.from).addClass('highlight-black')
        $board.find('.square-' + move.to).addClass('highlight-black')
        squareFromHighlight = move.from
        squareToHighlight = move.to
    }
}

function executeMove(movefrom, moveto)
{
   removeHighlights()
   var move = myboardgame.move({from: movefrom, to: moveto, promotion: 'q'})
   //move = myboardgame.move(movefrom, moveto)
   $board.find('.square-' + movefrom).addClass('highlight-black')
   $board.find('.square-' + moveto).addClass('highlight-black')
   squareFromHighlight = movefrom
   squareToHighlight = moveto
   onSnapEnd()
}

function checkSolution(movefrom, moveto)
{
      console.log("Check solution ", movefrom, " ", moveto)
      var moveString = movefrom + moveto;
      var solutionString = currentProblem.solution[0]
      if (moveString === solutionString)
      {
         modeSolveProblem = false
         triggerFadeBlink('green')
         console.log("The move ", moveString, " matches the solution! ");
         document.body.style.backgroundColor = "";
         document.getElementById('problemDisplay').textContent = ``;

         showSolution()
         /*

         //loadGameOnBoard(currentProblem.pgnstring)
         showMoves(0, currentProblem.nmoves)
         moveindex = currentProblem.startMove
         var moveElement = document.querySelector(`.move[data-move-index="${moveindex}"]`);
         if (moveElement) {
             moveElement.classList.add('highlighted');
             previousHighlightedMove = moveElement;  // Update the reference
         }
         executeMovesUpTo(currentProblem.moves, moveindex)
         */
      }
      else
      {
        console.log("The move ", moveString, "does not match the solution.", solutionString);
        document.getElementById('problemDisplay').textContent = `INCORRECT, TRY AGAIN!!!`;
        triggerFadeBlink('red')
        updateChessboard(currentProblem.fenfrom)
      }
}


/////////////////////////////////////
/////////// BUTTONS ////////////////
/////////////////////////////////////
function loadProblem() {

    /* load random problem from json file */
    hideElement('buttonNext')
    hideElement('buttonPrev')
    hideElement('mySelect')
    hideElement('problemDisplay')

    fetch('rc_problem.json')
        .then(response => response.json())
        .then(data => {
            // Get a random problem from the array
            clearBoard()
            showElement('buttonShowSolution')
            hideElement('buttonShowGame')
            hideElement('buttonLoadProblem')
            // TODO now last rows are not used, these have no games
            //const randomRow = Math.floor(Math.random() * rcproblemData.length);
            const randomRow = Math.floor(Math.random() * 0.4 * rcproblemData.length);
            //const randomRow = 23008

            const problem = rcproblemData[randomRow];
            console.log("Loaded problem: ", randomRow, " ", problem);
            // Display the problem: for debugging
            // document.getElementById('problemDisplay').textContent = `FEN: ${problem.fento}, Solution: ${problem.var1_0}`;

            const gameId = problem.gameid;
            const relatedGame = gameData.find(row => row.id === gameId);
            console.log("Related game ", gameId, " ", relatedGame.pgn);

            // todo: gameid 17225 empty PGN
            // todo: gameid 1 = NO GAME
            currentProblem.fillPgn(relatedGame.pgn)
            currentProblem.fillValues(problem)
            loadGameOnBoard(relatedGame.pgn)

            // NB lists start at 0, so move 3 = move 2 black
            /* startmove is the move that should be done to solve the problem */
            if (currentProblem.sideToMove == 'b'){
                myboard.orientation('black');
                currentProblem.startMove = (currentProblem.halfMove) * 2 - 1
            }
            else
            {
                myboard.orientation('white')
                currentProblem.startMove = (currentProblem.halfMove ) * 2 - 1
            }

             // execute moves for game
            mygame.reset();
            moves = currentProblem.moves
            for (var i = 0; i < currentProblem.startMove; i++) {
                mygame.move(moves[i]);
            }
            console.log("MyGame: ", mygame.fen(), " ", mygame.turn() )


            // blindmoves
            maxblindmoves = currentProblem.startMove
            if (selectedBlindMoves == -1)
            {
               nblindmoves = maxblindmoves
            }
            else if (selectedBlindMoves > maxblindmoves)
            {
                nblindmoves = maxblindmoves
             }
            else
            {
                nblindmoves = selectedBlindMoves
            }
            console.log("nblindmoves ", nblindmoves)
            currentmove = currentProblem.startMove - nblindmoves

             // execute moves for boardgame (blindgame)
            myboardgame.reset();  // Reset the game to the starting position
            moves = currentProblem.moves
            for (var i = 0; i < currentmove; i++) {
                myboardgame.move(moves[i]);
            }
            fen = myboardgame.fen()
            currentProblem.fenfrom = fen
            myboard.position(fen);
            console.log("MyBoardGame: ", myboardgame.fen(), " ", myboardgame.turn() )

            currentProblem.currentMove = currentmove;
            modeSolveProblem = true
            console.log("Current problem solution", currentProblem.solution)
          //  hideMovesAndNumbers(5, 8)
             showMoves(currentmove, currentmove+nblindmoves)
        })
        .catch(error => console.error('Error loading random problem:', error));

}

// Load Test Problem
function loadTestProblem()
{
    console.log("TEST")
    hideMovesAndNumbers(0, 10)
}

function buttonPrevMove()
{
   console.log("Prev Move")
   currentMove = currentProblem.currentMove

   console.log(currentProblem.currentMove, " ", currentProblem.nmoves)
   newmove = currentMove - 1
   if (newmove < 0)
       newmove  = 0;
   console.log("move: ", currentProblem.moves[newmove])
    //executeMovesUpTo(currentProblem.moves, newmove)

   moveindex = newmove
   var moveElement = document.querySelector(`.move[data-move-index="${moveindex}"]`);
   if (moveElement) {
        moveElement.click(); // Programmatically trigger the click event
    }
    removeHighlights()
}

/* NB current move is al uitgevoerd !! */
function buttonNextMove()
{
   console.log("Next Move ", currentProblem.currentMove)
   currentMove = currentProblem.currentMove
   moveindex = currentMove + 1
   if (moveindex > currentProblem.nmoves)
       moveindex = currentProblem.nmoves

   console.log("newmove: ", moveindex, " move: ", currentProblem.moves[moveindex])
   var moveElement = document.querySelector(`.move[data-move-index="${moveindex}"]`);
   if (moveElement) {
        console.log("CLICK")
        moveElement.click(); // Programmatically trigger the click event
    }

}

// Button solution
function showSolution()
{
   hideElement('buttonShowSolution')
   showElement('buttonShowGame')
   showElement('buttonLoadProblem')
   showElement('mySelect')
   showElement('problemDisplay')
   console.log("Show solution")
   modeSolveProblem = false

   var solutionString = currentProblem.solution[0]
   document.getElementById('problemDisplay').textContent = solutionString;

   //showMoves(0, currentProblem.nmoves)
   moveindex = currentProblem.startMove// show the move of the problem
   executeMovesUpTo(currentProblem.moves, moveindex)

   var moveElement = document.querySelector(`.move[data-move-index="${moveindex}"]`);
   //console.log("moveElement ", moveElement)
   //if (moveElement) {
   //     moveElement.click(); // Programmatically trigger the click event
   // }
   movefrom = solutionString.slice(0,2)
   moveto = solutionString.slice(2,4)
   executeMove(movefrom, moveto)
 }


// Button solution
function showGame()
{
   console.log("Show game")
   hideElement('buttonShowGame')
   showElement('buttonShowSolution')
   showElement('buttonNext')
   showElement('buttonPrev')

   var solutionString = currentProblem.solution[0]
   document.getElementById('problemDisplay').textContent = ``;
   showMoves(0, currentProblem.nmoves)
   moveindex = currentProblem.startMove// show the move of the problem
   var moveElement = document.querySelector(`.move[data-move-index="${moveindex}"]`);
   console.log("moveElement ", moveElement)
   if (moveElement) {
        moveElement.click(); // Programmatically trigger the click event
   }

   movefrom = solutionString.slice(0,2)
   moveto = solutionString.slice(2,4)
   executeMove(movefrom, moveto)


 }


//////////////////////////////////////////////////////////////////
// EVENTS
function onDragStart (source, piece, position, orientation)
{
    console.log("OnDragStart")
    removeHighlights()
}



// todo: check promotion (now queen is assumed)
function onDrop (source, target, piece, newPos, oldPos, orientation)
{
  console.log("OnDrop: ", source, " ", target, " ", piece, " ", orientation, " ", oldPos)
  movefrom = source
  moveto = target

  removeHighlights()
  squareFromHighlight = movefrom
  squareToHighlight = moveto
  $board.find('.square-' + moveto).addClass('highlight-black')
  $board.find('.square-' + movefrom).addClass('highlight-black')
  if (modeSolveProblem == true)
  {
      checkSolution(movefrom, moveto)
  }
  else
    {
         console.log("Do move from ", source, " to ", target)
         var move = myboardgame.move({from: source, to: target, promotion: 'q'})
         onSnapEnd()
     }
}

// update the board position after the piece snap (for castling, en passant, pawn promotion)
function onSnapEnd () {
  myboard.position(myboardgame.fen())
}

function onMoveEnd(source, target)
{
   console.log("onMoveEnd")
}


// click moves
$(document).ready(function() {
    // Attach a click event to all squares on the board
    $('#board').on('click', '.square-55d63', function() {
        var square = $(this).attr('data-square');  // Get the square coordinates (e.g., 'a1', 'b2')
        console.log("Square clicked: " + square);

        // Handle the first click and store the selected square
        if (!window.selectedSquare) // first square
        {
            removeHighlights()
            movefrom = square
            console.log("First square selected: " + movefrom);
            $board.find('.square-' + movefrom).addClass('highlight-black')

            squareFromHighlight = movefrom
            window.selectedSquare = square;

        } else { // second square
            var targetSquare = square;
            var movefrom = window.selectedSquare
            var moveto = square
            squareToHighlight = moveto
            if (moveto == movefrom)
            {
               console.log(movefrom ,  " ==  ", moveto)
               removeHighlights()
            }
            else
            {
               console.log("Do move")
               $board.find('.square-' + moveto).addClass('highlight-black')
               //onDrop (movefrom, moveto, null, null, null, 'white')

                if (modeSolveProblem)
                    checkSolution(window.selectedSquare, targetSquare)
                else{
                      var move = myboardgame.move({from: window.selectedSquare, to: targetSquare, promotion: 'q'})
                      removeHighlights()
                      if (move != null)
                      {
                          squareFromHighlight = movefrom
                          squareToHighlight = moveto
                          $board.find('.square-' + moveto).addClass('highlight-black')
                          $board.find('.square-' + movefrom).addClass('highlight-black')
                          onSnapEnd()
                      }
                }
            }
                // You can then process the move (e.g., update the board, validate the move, etc.)
           window.selectedSquare = null;  // Reset the selection

        }
    });
});


////////////////////////////////////////////////////

// Adjust the board size on window resize
window.addEventListener('resize', resizeChessboard);
resizeChessboard(); // Call it once to set the initial size
hideElement('buttonShowSolution')
hideElement('buttonShowGame')
hideElement('buttonNext')
hideElement('buttonPrev')