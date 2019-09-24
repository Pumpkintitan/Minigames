class Position {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  distance(a) {
    // Calculate the distance between this Position and Position a
    var dx = Math.abs(a.x - this.x)
    var dy = Math.abs(a.y - this.y)

    return Math.hypot(dx, dy)
  }

  add(direction) {
    // Adds a direction to the position
    return new Position(this.x + direction.dx, this.y + direction.dy)
  }

  dirVector(a) {
    // Returns a vector of the difference between this and a
    return new Direction(a.x - this.x, a.y - this.y)
  }
}


class Direction {
  constructor(dx, dy) {
    this.dx = dx
    this.dy = dy
  }
  inverse() {
    return new Direction(-this.dx, -this.dy)
  }
}


class Ghost {
  constructor(position, direction, mode) {
    // The Ghost's position
    this.position = position
    this.direction = direction
    this.mode = mode
    this.frame = 0
    this.dead = false
    this.active = false
    this.staggerTimer = 0
    this.house = true
    this.exiting = false
    this.houseTarget = new Position(this.position.x, 16)
    this.queueChange = false
    this.returning = false
    this.homePos = position
  }

  getDirection(options, target) {
    // Options is an array of moves it is possible to do.
    // Each move is a Direction object
    // Target is the target position, a Position object.
    var distances = {}
    var currentPosition = this.position

    if (this.house) {
      if (this.position.y == 16) {
        this.houseTarget = new Position(this.position.x, 18)
      } else if (this.position.y == 18) {
        this.houseTarget = new Position(this.position.x, 16)
      }
      target = this.houseTarget
    } else if (this.exiting) {
      if (this.position.y == 14) {
        this.exiting = false
        if (!this.queueChange) {
          this.position = new Position(13, 14)
          this.direction = new Direction(-1, 0)
          this.frame = -6
        } else {
          this.position = new Position(14, 14)
          this.direction = new Direction(1, 0)
          this.frame = -6
        }
        return
      } else {
        if (this.position.x != 13) {
          target = new Position(13, 18)
        } else {
          target = new Position(13, 14)
        }
      }
    } else if (this.returning) {
      options = [new Direction(0, 1), new Direction(0, -1)]
      if (this.position.y != 18) {
        target = new Position(this.position.x, 18)
      }
      else {
        this.returning = false
        this.exiting = true
        this.dead = false
        this.mode = 'chase'
      }
    }

    // Get the distances for each of the options
    options.forEach(function(option) {
      var newpos = currentPosition.add(option)
      distances[`${option.dx},${option.dy}`] = newpos.distance(target)
    })

    // Get a list of the directions which have the minimum
    function getMax(object) {
      return Object.keys(object).filter(x => {
        return object[x] === Math.min.apply(null, Object.values(object));
      });
    };

    var directions = getMax(distances)

    if (directions.includes('0,-1')) {
      this.direction = new Direction(0, -1)
    } else if (directions.includes('-1,0')) {
      this.direction = new Direction(-1, 0)
    } else if (directions.includes('0,1')) {
      this.direction = new Direction(0, 1)
    } else if (directions.includes('1,0')) {
      this.direction = new Direction(1, 0)
    }
  }

  chase(options) {
    var directions = []
    options.forEach(function(option) {
      directions.push(`${option.dx},${option.dy}`)
    })
    if (this.mode === 'scatter' && !this.dead && !this.house && !this.exiting && !this.returning) {
      var inverseDirection = this.direction.inverse()
      if (directions.includes(`${inverseDirection.dx},${inverseDirection.dy}`)) {
        this.direction = inverseDirection
        this.frame = -this.frame
      }
    } else if (this.mode == 'scatter' && (this.house || this.exiting || this.returning)) {
      this.queueChange = !this.queueChange
    }
    this.mode = 'chase'
  }

  scatter(options) {
    var directions = []
    options.forEach(function(option) {
      directions.push(`${option.dx},${option.dy}`)
    })
    if (this.mode === 'chase' && !this.dead && !this.house && !this.exiting && !this.returning) {
      var inverseDirection = this.direction.inverse()
      if (directions.includes(`${inverseDirection.dx},${inverseDirection.dy}`)) {
        this.direction = inverseDirection
        this.frame = -this.frame
      }
    } else if (this.mode == 'chase' && (this.house || this.exiting || this.returning)) {
      this.queueChange = !this.queueChange
    }
    this.mode = 'scatter'
  }

  frighten(options) {
    var directions = []
    options.forEach(function(option) {
      directions.push(`${option.dx},${option.dy}`)
    })
    if ((this.mode === 'scatter' || this.mode === 'chase') && !this.dead && !this.house && !this.exiting && !this.returning) {
      var inverseDirection = this.direction.inverse()
      if (directions.includes(`${inverseDirection.dx},${inverseDirection.dy}`)) {
        this.direction = inverseDirection
        this.frame = -this.frame
      }
    } else if ((this.mode === 'scatter' || this.mode === 'chase') && (this.house || this.exiting || this.returning)) {
      this.queueChange = !this.queueChange
    }
    this.mode = 'fright'
  }
  kill() {
    this.dead = true
  }
}

class Blinky extends Ghost {
  constructor(position, direction, mode) {
    super(position, direction, mode)
    this.house = false
    this.frame = -6
    this.color = 'red'
  }

  getMove(options, pacman) {
    if (this.house || this.exiting || this.returning) {
      return this.getDirection(options, new Position(0, 0))
    } else if (this.dead) {
      // Go back to ghost house
      return this.getDirection(options, new Position(13, 14))
    } else if (this.mode === 'chase') {
      // Chase mode, chase pacman
      var pacmanPosition = pacman.position
      return this.getDirection(options, pacmanPosition)
    } else if (this.mode === 'scatter') {
      // Blinky is in scatter mode, try and get to his off-map home
      // in the upper-right-hand corner
      return this.getDirection(options, new Position(25, 0))
    } else if (this.mode === 'fright') {
      var newDirection = options[Math.floor(Math.random() * options.length)]

      return this.getDirection([newDirection], new Position(0, 0))
    }
  }
}

class Pinky extends Ghost {
  constructor(position, direction, mode) {
    super(position, direction, mode)
    this.houseTarget = new Position(this.position.x, 18)
    this.color = 'pink'
  }

  getMove(options, pacman) {
    if (this.house || this.exiting || this.returning) {
      return this.getDirection(options, new Position(0, 0))
    } else if (this.dead) {
      // Go back to ghost house
      return this.getDirection(options, new Position(13, 14))
    } else if (this.mode === 'chase') {
      // Look at pacman's current direction and position and go towards the
      // square 4 tiles ahead
      var pacmanPosition = pacman.position
      var pacmanDirection = pacman.pointing

      // Lookahead targeting glitch
      if (pacmanDirection.dx == 0 && pacmanDirection.dy == -1) {
        var pacmanLead = pacmanPosition.add(new Direction(-4, -4))
      } else {
        var pacmanLead = pacmanPosition.add(new Direction(pacmanDirection.dx * 4, pacmanDirection.dy * 4))
      }

      return this.getDirection(options, pacmanLead)
    } else if (this.mode === 'scatter') {
      // Pinky tries to get to the upper left
      return this.getDirection(options, new Position(3, 0))
    } else if (this.mode === 'fright') {
      var newDirection = options[Math.floor(Math.random() * options.length)]

      return this.getDirection([newDirection], new Position(0, 0))
    }
  }
}

class Inky extends Ghost {
  constructor(position, direction, mode) {
    super(position, direction, mode)
    this.color = '#00FFFF'
  }

  getMove(options, pacman, blinky) {
    if (this.house || this.exiting || this.returning) {
      return this.getDirection(options, new Position(0, 0))
    } else if (this.dead) {
      // Go back to ghost house
      return this.getDirection(options, new Position(13, 14))
    } else if (this.mode === 'chase') {
      var currentPosition = this.position

      var pacmanPosition = pacman.position
      var pacmanDirection = pacman.pointing

      // Lookahead targeting glitch
      if (pacmanDirection.dx == 0 && pacmanDirection.dy == -1) {
        var pacmanLead = pacmanPosition.add(new Direction(-2, -2))
      } else {
        var pacmanLead = pacmanPosition.add(new Direction(pacmanDirection.dx * 2, pacmanDirection.dy * 2))
      }

      var targetVector = blinky.position.dirVector(pacmanLead)

      var targetSquare = currentPosition.add(new Direction(targetVector.dx * 2, targetVector.dy * 2))

      return this.getDirection(options, targetSquare)
    } else if (this.mode === 'scatter') {
      // Bottom right
      return this.getDirection(options, new Position(0, 35))
    } else if (this.mode === 'fright') {
      var newDirection = options[Math.floor(Math.random() * options.length)]

      return this.getDirection([newDirection], new Position(0, 0))
    }
  }
}

class Clyde extends Ghost {
  constructor(position, direction, mode) {
    super(position, direction, mode)
    this.color = 'orange'
  }

  getMove(options, pacman) {
    if (this.house || this.exiting || this.returning) {
      return this.getDirection(options, new Position(0, 0))
    } else if (this.dead) {
      // Go back to ghost house
      return this.getDirection(options, new Position(13, 14))
    } else if (this.mode === 'chase') {
      var currentPosition = this.position
      var pacmanPosition = pacman.position

      if (currentPosition.distance(pacmanPosition) >= 8.0) {
        return this.getDirection(options, pacmanPosition)
      } else {
        return this.getDirection(options, new Position(27, 35))
      }
    } else if (this.mode === 'scatter') {
      return this.getDirection(options, new Position(27, 35))
    } else if (this.mode === 'fright') {
      var newDirection = options[Math.floor(Math.random() * options.length)]

      return this.getDirection([newDirection], new Position(0, 0))
    }
  }
}

class Pacman {
  constructor(position, direction) {
    this.position = position
    this.direction = direction
    this.pointing = direction
  }
}
