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
          the port *8080* by default. Can set the `PORT` env variable to change the listening port.



### 1.3. Instructions with Docker

- Build image: `docker build . -t riot-assignment`
- Test:        `docker run riot-assignment test`
- Run:         `docker run -p8080:8080 riot-assignment`



### 1.4. API endpoints


- Manipulate a single player entity.
    - `GET /players/:id` - Retrieve a player.
    - `PUT /players/:id` - Update a player.
    - `DELETE /players/:id` - Delete a player.
    - `POST /players` - Create a player.
- Fetch players entities.
    - `GET /players/count` - Count players.
    - `GET /players?strategy=rank&offset=0&limit=10` - Get top 10 players.
    - `GET /players?strategy=around_player&player_id=:id&range=5` - Get each 5 players near given player's rank for both higher and lower ranks each.


### 1.5. API specification in detail

A Swagger UI endpoint has been set to homepage for a detailed documentation and a playground.

- Visit Swagger UI: [http://0.0.0.0:8080](http://0.0.0.0:8080)
- See OpenAPI 3.0 specification: [./swagger.yaml](./swagger.yaml)

---


## 2. Design considerations

### 2.1. Assumptions
- Player's id and MMR should be a positive integer.
- Client request for creating entity includes player's id as payload.
- A player with higher MMR takes higher (numerically lower) rank.
- For the tied MMR, younger player (whose id is numerically higher) occupies higher rank.


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

Firstly, I decoupled the concept of `PlayerStore` and the `PlayerLeaderBoard`. There might be a lot of utilization
for user identities and game results in Riot Games. Then naturally there might be a single source of user data
like a distributed database which I named `PlayerStore` here in this project.

So, `PlayerStore` became an abstraction layer for a stateless application which can deal with a remote data
source and may don't have a persistent layer inside itself for scalability. Here for the demonstration,
`PlayerMemoryStore` has been implemented which roughly implements `PlayerStore`... to not to go too far :)


##### PlayerStoreConsumer => PlayerLeaderBoard

Secondly, I made `PlayerLeaderBoard` application as an implementation of `PlayerStoreConsumer`. I imagined
not just few threads in a single process of a node rather some independent services in a huge distributed
system; I meant yours.

I have seen once that Riot Games has been using Kafka as a central messaging broker. I'm not sure about
the exact role of that in the whole system. But here I assumed that there might be a lot of `PlayerLeaderBoard`
like apps. So I tried to treat `PlayerStore` as a kind of message producer, and `PlayerLeaderBoard` as a message consumer.

Finally, a `HTTP Server` would serve the features of `PlayerLeaderBoard` and `PlayerStore` as a single public
interface.


### 2.3. Data structure for rank calculation

At first, I thought this assignment has been designed for just testing an ability to implement a simple application
from a scratch. So my first idea was simply using a sorted Array with a binary search strategy for calculating
ranks, and an extra hash map for random access to specific user node.

After I had made some progress in broad perspective code structure, I realized that Riots Games would have dozens
of millions users. Then I found out that it requires consideration for a highly performant implementation of the
leaderboard.

Naive Array takes `O(N)` for insertion, deletion, searching (for rank calculation) operations. So I decided to use
Binary Search Tree based data structure which takes logarithmic time complexity `O(logN)` for such operations.

Before making a decision, I simply checked whether a single node can easily load all the user data in memory.
I found that more than 30 million users play LoL nowadays. So memory space for a tree with 30M nodes which are consist of
`{ id, mmr, left, right, size }`, `size` field is for memorized number of children nodes for calculating rank, and
an extra hashmap which maps `id  => node` would take approximately `(node (4byte + 4byte + 8byte + 8byte + 4byte) + hash (4byte + 8byte)) * 30M`
which reaches to just 1200 MiB.

So in-memory strategy seems obviously acceptable for this scenario. Then back to the data structure decision,
I chose Red Black Tree which is a kind of BST with self-balancing feature. Because there must be tons of updates
in user entities even in a single day, I thought a tree without self-balancing would be easily biased to make bad
performance.

For the codes, I just used an open source Red Black Tree library rather than struggling with reinventing that one.
