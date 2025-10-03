# AroundU

 **AroundU** provides a privacy-friendly, location-based chat platform that allows users to connect with people nearby without sharing personal information.

## How to Test
 - Check out the app live at: [AroundU](https://tinyurl.com/aroundUchat)  
 - Test the app by opening it on **two devices or browser tabs**
 -  Log in with different usernames
 -  Allow location access
 -  Start chatting with nearby users in real time.


## Technology Stack

- **MongoDB** : NoSQL database for flexible data storage  
- **Express.js** : Backend framework to build RESTful APIs  
- **React** : Frontend library for dynamic user interfaces  
- **Node.js** : Runtime environment for backend development  
- **Socket.io** : Real-time chat functionality  
- **JSON Web Token** : Secure authentication and session management 

## Features

- **User Authentication** : Secure login and registration  
- **Nearby Users** : Discover and chat with users around you 
- **Real-Time Chat** : Instant messaging with nearby users  
- **Privacy-Friendly** : No need to share contact credentials  

## Instruction
- Users must enable and allow location access for nearby discovery 
- Users **cannot send messages** if they are **out of range or disconnected**, ensuring that chats remain relevant to nearby interactions


## Setup & Installation

#### Clone the repository

   ```bash
   git https://github.com/Arul-Kaarthikeyan/AroundU-MERN.git
   cd AroundU-MERN
   ```

#### Create a .env file 

```bash
MONGO_URI = your_mongodb_uri
JWT_SECRET = your_jwt_secret
PORT = your_port
RADIUS_METERS = nearby_user_range
```


#### Backend Setup
```bash
cd backend
node server

```

#### Frontend Setup
```bash
cd frontend
npm install
npm start

