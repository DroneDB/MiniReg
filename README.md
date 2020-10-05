# MiniReg

A minimal toy implementation of the [DroneDB Registry API](https://github.com/DroneDB/Registry) written in NodeJS.

## Running

```
# git clone https://github.com/DroneDB/MiniReg --recurse-submodules && cd MiniReg
# npm install
# node index.js
```

## Endpoints

  - [x] `POST /users/authenticate` (default `username`: admin, `password`: password)
  - [x] `POST /share/init`
  - [x] `POST /share/upload/<token>`
  - [x] `POST /share/commit/<token>`  

## Contributing

Make a pull request for small contributions. For big contributions, please open a discussion first.

## Roadmap

See the [list of wanted features](https://github.com/DroneDB/MiniReg/issues?q=is%3Aopen+is%3Aissue+label%3A%22new+feature%22).
