const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');


app.use(cors());
const server = http.Server(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:8080",
    }
});
const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Listening on port ${port}`));


const states = {
    draw: 'draw',
    win: 'win',
    loss: 'loss',
}
const randomChoices = ['rock', 'paper', 'scissors'];
const users = {};
const rooms = {};
// Player vs Enviroment (Computer)
const pve = {};

const game = {
    "rock": ["scissors"],
    "paper": ["rock"],
    "scissors": ["paper"]
};

io.on('connection', (socket) => {
    console.log(`Client connected ${socket.id}`);
    users[socket.id] = {
        name: '',
    }
    // Genetate Random Choice for Player vs Environment 
    const generateRandomChoice = () => {
        const randomIndex = Math.floor(Math.random() * 3);
        return randomChoices[randomIndex];
    }
    // Calculate the winner
    const calculateWinner = (choice1, choice2) => {
        if (choice1 === choice2) {
            return states.draw;
        }
        return game[choice1].includes(choice2) ? states.win : states.loss;
    }
    // Set the player move
    const makeMove = (choices, player, choice) => {
        choices[player - 1] = choice;
    }
    // Get the room Details
    const getRoomDetails = (roomId) => {
        const room = rooms[roomId];
        return {
            room,
            players: room?.players,
            choices: room?.choices,
            scores: room?.scores,
        }
    }
    // Set the player name
    socket.on("setName", (name) => {
        users[socket.id].name = name;
    })
    // Create a new room
    socket.on("createRoom", () => {
        const roomId = uuidv4();
        const playerId = socket.id;
        // Create a new room and add the player to it
        rooms[roomId] = {
            players: [playerId, ''],
            scores: [0, 0],
            choices: ['', ''],
        }
        // Send the room id to the player
        socket.emit("roomCreated", roomId);
        socket.join(roomId);

    })
    // Join a room
    socket.on("joinRoom", (roomId) => {
        if (!roomId || !rooms[roomId])
            return socket.emit("error", "Room does not exist");

        const { players } = getRoomDetails(roomId);
        const player2Id = socket.id;
        players[1] = player2Id;
        // Send the room id to the player
        socket.join(roomId);
        socket.emit("playerTwoJoined", roomId);
        socket.emit("roomJoined", roomId);
    })
    // Make a move and send the result to the player
    socket.on('make-move', (data) => {
        const { roomId, move } = data;
        const choice = move?.toLowerCase();
        // Invalid roomId or choice
        if (!choice || !game[choice])
            return socket.emit("error", "Invalid move");
        // Room does not exist
        if (!roomId || !rooms[roomId])
            return socket.emit("error", "Room does not exist");
        const {
            room,
            choices,
            scores,
            players
        } = getRoomDetails(roomId);
        // Get the player's id from the players array in the room
        if (!players.includes(socket.id)) {
            return socket.emit("error", "You are not in the room");
        }
        const player1Id = players[0];
        const player2Id = players[1];
        const player = socket.id === player1Id ? 1 : 2;
        // Player already made a move
        if (choices[player - 1])
            return socket.emit("error", "You already made a move");
        // Make the move
        makeMove(choices, player, choice);
        // Check both Player have made a move
        if (choices[0] !== "" && choices[1] !== "") {
            // Calculate the winner
            const winner = calculateWinner(choices[0], choices[1]);
            if (winner === states.win) {
                scores[0]++;
                socket.to(roomId).emit("gameOver", {
                    winnerId: player1Id,
                    score: scores[0],
                    enemyChoice: choices[1],
                })
            }
            else if (winner === states.loss) {
                scores[1]++;
                socket.to(roomId).emit("gameOver", {
                    winnerId: player2Id,
                    score: scores[1],
                    enemyChoice: choices[0],
                })
            }
            else {
                socket.to(roomId).emit("gameOver", {
                    status: "draw",
                })
            }
            // Reset the choices
            room.choices = ['', ''];
        }

    })
    // Play with Computer
    socket.on('pve', () => {
        const playerId = socket.id;
        pve[playerId] = {
            score: 0,
        }

    })
    // Play with Computer and send the result to the player 
    socket.on('pveMove', (choice) => {
        const playerId = socket.id;
        if (!pve[playerId]) {
            return socket.emit("error", "You have not selected to play with computer");
        }
        const choice1 = choice.toLowerCase();
        const choice2 = generateRandomChoice();
        const winner = calculateWinner(choice1, choice2);

        pve[playerId].score += winner === states.win ? 1 : 0;
        socket.emit("pveResult", {
            status: states[winner],
            score: pve[playerId].score,
            choice: choice1,
            computerChoice: choice2,
        });
    });
    // Disconnect
    socket.on('disconnect', () => {
        console.log(`Client disconnected ${socket.id}`);
        delete users[socket.id];
    })
});
