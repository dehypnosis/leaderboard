1. leader board
2. make a server
3. create public API with Swagger doc
5. draw and embed a diagram for design overview 

---


# LoL leaderboard demonstration

A submission for the assignment of Riot Games backend engineer interview.

Interviewee: Dong Wook Kim 


---


## 1. Instructions on how to build, test and run

### 1.1. Environment

- OS: macOS Catalina
- Runtime: nodeJS v12.14.0
- Package manager: yarn v1.22.0
- Build tool: Typescript v4.0.3
- Test tool: Jest v26.5.2 (ts-jest v26.4.1)

The application can be run on any local environment which is compatible to the above.
But for the convenience, it is fully dockerized.

- Docker v19.03.13



### 1.2. Instructions without Docker
Configure environment and install dependencies with `yarn install`. 

- Test:  `yarn test` runs unit tests on typescript codes and show the test coverage.
- Build: `yarn build` transpiles typescript codes to runnable JS.
- Run:   `yarn start` runs the built runnable. A HTTP server for the API listens to
          the port *8888* by default. Can set the `PORT` env variable to change the listening port.



### 1.3. Instructions with Docker

- Build image: `docker build . -t riot-assignment`
- Test:        `docker run riot-assignment test`
- Run:         `docker run -p8888:8888 riot-assignment`



### 1.4. API Specification

1. API to update/add a player (Leaderboard should also be updated)
- `PUT /players/:id`
- `POST /players`

2. API to delete a player
- `DELETE /players/:id`

3. API to return tier of a player
- `GET /players/:id`

4. API to return total number of player count
- `GET /players/count`

5. API to return list of top 10 players
- `GET /players?strategy=rank&offset=0&limit=10`

6. API to return list of players near given player's id. eg) If playerId is 5 and range of 5 is given.
   You are required to find 5 higher rank players and 5 lower rank players
- `GET /players?strategy=close_to_player&player_id=:id&range=5`


### 1.5. API Document

A Swagger UI endpoint has been set to homepage for a detailed documentation and a playground.

- Visit [https://localhost:8888](https://localhost:8888)

---


## 2. Design considerations

### 2.1. Assumptions
- A player's id cannot be duplicate.
- A player's id cannot be updated once created in persistent layer.
- Player's id and MMR should be a positive integer.
- A player with higher MMR takes higher (numerically lower) rank.
- For the tied MMR, younger player (whose id is numerically higher) will occupy higher rank.

### 2.2. Overview

Obviously, the requirement seems like making just a simple application which mimics the leaderboard of LoL.
But I know your assignment requires me to show my ability for designing not only for coding.

So I have elaborated this application somewhat to contain the fundamental of testability, portability,
extensibility and scalability.


#### 2.2.1. Testability:

Jest and Swagger has been set for unit test, a playground and documentation.


#### 2.2.2. Portability:
 
The app has been dockerized.


#### 2.2.3. Extensibility and scalability:


##### PlayerStore => PlayerMemoryStore

Firstly, I decoupled the conceipt of `PlayerStore` and the `PlayerLeaderBoard`. There might be a ton of utilizations
for user identities and game results in Riot Games. Then naturally there might be a single source of user data
like a distributed database which I named `PlayerStore` here in this project.

So, `PlayerStore` became an abstraction layer for a stateless application which can deal with a remote data
source and may don't have a persistent layer inside itself for scalability. But here for the demonstration,
`PlayerMemoryStore` has been implemented which roughly implements `PlayerStore`... to not to go too far :)

##### PlayerStoreConsumer => PlayerLeaderBoard

Secondly, I made `PlayerLeaderBoard` application as an implementation of `PlayerStoreConsumer`. I imagined
not just few threads in a single process of a node rather some independent services in a huge distributed
system; I meant yours.

I have heard once that Riot Games has been using Kafka as a central messaging broker. I'm not sure about
the exact role of that. But here I assumed that there might be a lot of `PlayerLeaderBoard like` apps.
So I tried to make `PlayerStore` as a kind of message broker, and `PlayerLeaderBoard` as message consumer.

// TODO: skipped list? balanced binary tree?
Thus `PlayerLeaderBoard` receives Add, Update, Delete messages from the store to compose a balanced binary tree
structure which is ready for low time complexity for major operations. At the same time, an extra hashmap composes
to directly point to each users by id for fast random access to any specific users.

##### HTTP Server

And finally, a `HTTP Server` properly serve the features of `PlayerLeaderBoard` and `PlayerStore` as a single public interface.

