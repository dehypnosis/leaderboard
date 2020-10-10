1. user, userStore -> leaderboard (userStoreSubscriber) interface and implementation
2. make a server
3. create public API with Swagger doc
4. create swagger endpoint
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

The application can be run on any local environment which is compatible to above.
But for your convenience, Build, Test and Run commands have been fully dockerized.

- Docker v19.03.13



### 1.2. Instructions without Docker
Configure environment and install dependencies with `yarn install`. 

#### Test
- `yarn test`: Run unit tests on typescript codes and show the test coverage.

#### Build
- `yarn build`: Transpile typescript codes to runnable JS.

#### Run
- `yarn start`: Run the built runnable. A HTTP server for the API will be started to listen to
                port *8888* by default. Can set the `PORT` env variable to change the listening port.



### 1.3. Instructions with Docker

#### Build image
- `docker build . -t riot-assignment`

#### Test
- `docker run riot-assignment test`

#### Run
- `docker run -p8888:8888 riot-assignment`



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


### 1.5. Documentation

A Swagger UI endpoint has been set for detailed documentation and testability.

- [https://localhost:8888/~doc](https://localhost:8888/~doc)

---


## 2. Design considerations

### 2.1. Assumptions
- A user with higher MMR takes higher (numerically lower) rank.
- For the tied MMR, younger user (whose id is numerically higher) will occupy higher rank.

### 2.2. Implementation overview

Obviously, the requirement seems like making just a simple application which mimics the leaderboard of LoL.
But I know your assignment requires me to show my ability for designing not only for coding.

So I have elaborated this application somewhat to contain the fundamental of testability, portability,
extensibility and scalability.


1. For the testability:

Jest and Swagger has been set for unit test, manual test and documentation.


2. For the portability and scalability:
 
The app has been dockerized.


3. For the extensibility and scalability:

Firstly, I decoupled the conceipt of `UserStore` and the `LeaderBoard`. There might be a ton of utilizations
for user identities and game results in Riot Games. Then naturally there might be a single source of user data
like a distributed database which I named `UserStore` here in this project.

So, `UserStore` became an abstraction layer for a stateless application which can deal with a remote data
source and may don't have a persistent layer inside itself for scalability. But here for the demonstration,
`UserMemoryStore` has been implemented which implements `UserStore`... to not to go too far :)

Secondly, I made `LeaderBoard` application as an instance of `UserStoreConsumer`. I imagined
not just few threads in a single process of a node rather some independent services in a huge distributed
system; I meant yours.

I have heard once that Riot Games has been using Kafka as a central messaging broker. I'm not sure about
the exact role of that. But here I assumed that there might be a lot of `LeaderBoard like` apps.
So I tried to make `UserStore` as a kind of `MessageBroker`, and `LeaderBoard` as `MessageConsumer`.
 