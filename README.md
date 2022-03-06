# multiplayer-game-backend

# How to Start the Game 
```js
npm install
npm run dev
```

## Details 
This solution is time-boxed to 3 hours. This is socket.io based backend server. There are two mode
1. PVE ---> Playe vs Computer/(Environment)
2. PVE ----> Player vs Player

### Basci Login
On Connections create empty users sttate with empty name
Set User on `setName` socket.io request
On PvP Create a room for 1st player and joinRoom for 2nd Player
On Make Move call check if player is in the room and have not already made a move and calculate winner when both players have made the moves.


### Features 
* Allow two players to enter their names
* One of the players can also be the computer, i.e. player vs computer
* Allow each to play a turn, one at a time, during which the player selects one of the option
from rock, paper, scissors
* During each turn notify who has won and increment the scores

## Improvements
### This Backend does not includes the features
* User must be able to save their game
* In Future Use Database to store the game state
* DB Model will be 
Users: MongoDB Collection
Schema
```js
    _id: ObjectID
    name: string
    // Rooms Id
    rooms: string[]
    // rooms: [room1, room2]
    pve: Object { score }

```
Rooms: MongoDB Collection
Schema
```js
    _id: ObjectID
    roomId: string
    // Save scores of each player in the room
    scores: Number[]
```
* Disconnection needs to handle better when using the db 

