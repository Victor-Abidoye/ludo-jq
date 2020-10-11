class Ludo {
  static DIE_ROLL_DURATION = 1000

  constructor(container = 'body') {
    this.$container = $(container)

    this.createDefaults()
    this.createRefs()
    this.createDice()
    this.setupEvents()
    this.restorePlayers()

    this.$playBtn.focus()
  }

  activatePieces(state = true) {
    if (state && !this.possibleMoves) {
      this.rolled.first = this.rolled.second = null
      return this.nextPlayer()
    }

    this.$backdrop.addClass('hide')

    const { colors } = this.getCurrentPlayer()

    this.$centerMessage
      .html(
        `Select a <strong>${colors
          .map((color) => color.toLowerCase())
          .join(' or ')}</strong> piece to move.`
      )
      .removeClass('hide')

    if (state) {
      this.getRef(this.movableAllPiecesSelector)
        .addClass('active')
        .siblings('.piece-cover')
        .addClass('hide')
    } else {
      this.getRef(this.movableAllPiecesSelector)
        .removeClass('active')
        .siblings('.piece-cover')
        .removeClass('hide')
    }
  }

  canMakeCorridorMove(move, pieceToMove) {
    const $pieceToMove = $(pieceToMove || this.$pieceToMove)
    const pieceColor = $pieceToMove.data('color')
    const $pieceBox = $pieceToMove.parent()

    if (!$pieceBox.hasClass('step')) {
      return true
    }

    const pieceInCorridor = $pieceBox.hasClass('corridor')
    const currentSpotNumber = parseInt($pieceBox.data('step'))

    if (pieceInCorridor) {
      return currentSpotNumber + move <= 6
    } else if (currentSpotNumber <= this.corridorEntrances[pieceColor]) {
      return move <= this.corridorEntrances[pieceColor] - currentSpotNumber + 6
    }

    return true
  }

  celebrateExit(piece) {
    setTimeout(() =>
      alert(`Hooray!!! A ${$(piece).data('color')} piece is out!!!`)
    )
  }

  celebrateWinner() {
    const player = this.playablePlayers.splice(this.currentPlayer, 1)[0]

    this.rolled.first = this.rolled.second = null
    this.winners.push(player)

    let playerColors = ''

    player.colors.forEach((color) => {
      if (playerColors) {
        playerColors += '/'
      }

      playerColors += color

      this.getRef(`.home.${color.toLowerCase()} .playing`).addClass('hide')
    })

    setTimeout(() =>
      alert(`And we have a winner! Congrats Player "${playerColors}"`)
    )
  }

  checkMoveKills() {
    const $box = this.$pieceToMove.parent()

    if (!$box.hasClass('step') || $box.hasClass('corridor')) {
      return
    }

    const { colors } = this.getCurrentPlayer()

    // TODO: Allow current player select which of the other players' pieces he wants to kill
    const $firstOtherPieces = $box
      .find(`.piece:not(${colors.join('):not(')})`)
      .first()

    if ($firstOtherPieces.length) {
      const otherColor = $firstOtherPieces.data('color')

      alert(`${this.$pieceToMove.data('color')} kills ${otherColor}`)

      this.getRef(`.home.${otherColor}`).prepend($firstOtherPieces.detach())
      this.getRef('#center').append(this.$pieceToMove.detach())

      this.checkPlayerWins()
    }
  }

  checkPlayerWins() {
    if (
      this.getRef(this.movablePiecesSelector).length ===
      this.getRef('#center').find(this.movablePiecesSelector).length
    ) {
      this.celebrateWinner()
    }
  }

  countMovablePieces() {
    const { colors } = this.getCurrentPlayer()

    this.movablePiecesSelector = ''
    this.movableAllPiecesSelector = ''
    this.movableHomePiecesSelector = ''
    this.movableStepPiecesSelector = ''

    this.movablePieces = 0

    colors.forEach((color) => {
      color = color.toLowerCase()

      if (this.movablePiecesSelector) {
        this.movablePiecesSelector += ', '
      }

      this.movablePiecesSelector += `.piece.${color}`

      if (this.movableAllPiecesSelector) {
        this.movableAllPiecesSelector += ', '
      }

      if (this.movableHomePiecesSelector) {
        this.movableHomePiecesSelector += ', '
      }

      if (this.rolled.first === 6 || this.rolled.second === 6) {
        this.movableAllPiecesSelector += `.home .piece.${color}`
        this.movableHomePiecesSelector += `.home .piece.${color}`
      }

      if (this.movableAllPiecesSelector) {
        this.movableAllPiecesSelector += ', '
      }

      if (this.movableStepPiecesSelector) {
        this.movableStepPiecesSelector += ', '
      }

      this.movableAllPiecesSelector += `.step .piece.${color}`
      this.movableStepPiecesSelector += `.step .piece.${color}`

      this.movablePieces += this.getRef(this.movableAllPiecesSelector).length
    })
  }

  createDefaults() {
    this.rolled = {
      first: null,
      second: null,
    }

    this.players = [
      { colors: ['Yellow'], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
    ]
    this.playablePlayers = []

    this.corridorEntrances = {
      yellow: 51,
      green: 12,
      red: 25,
      blue: 38,
    }
    this.movablePieces = 0
    this.piecesSelector = ''
    this.possibleMoves = 2
    this.doubleSixes = 0

    this.winners = []
    this.backdropClosable = false
    this.currentPlayer = -1
    this.$pieceToMove = null
  }

  createDice() {
    this.$die1 = this.getRef('#die-1').dice({
      duration: this.DIE_ROLL_DURATION,
      imageUrl: './assets/img/dice.png',
      value: 6,
    })

    this.$die2 = this.getRef('#die-2').dice({
      duration: this.DIE_ROLL_DURATION,
      imageUrl: './assets/img/dice.png',
      value: 6,
    })
  }

  createRefs() {
    this.$backdrop = this.getRef('#backdrop')
    this.$centerMessage = this.getRef('#center .message')
    this.$links = this.getRef('a')
    this.$rollBtns = this.getRef('.roll')

    this.$movements = this.$backdrop.find('#movements')
    this.$moves = this.$movements.children('.moves')
    this.$movementMessage = this.$movements.children('.message')
    this.$movementBtn = this.$movementMessage.children('button')
    this.$options = this.$backdrop.children('#options')
    this.$optionSelects = this.$options.find('select')
    this.$playBtn = this.$options.find('#play')
  }

  debug(color, count) {
    if (!color) {
      return
    }

    this.getRef(`.piece.${color}`).each((i, piece) => {
      if (i >= count) {
        return
      }

      this.getRef(`.corridor.${color}[data-step="${5 - i}"]`).append(
        $(piece).detach()
      )
    })
  }

  diceRolled() {
    this.backdropClosable = false

    if (!this.rolled.first || !this.rolled.second) {
      return
    }

    this.countMovablePieces()

    if (this.rolled.first === 6 && this.rolled.second === 6) {
      this.doubleSixes++

      this.$centerMessage
        .html('You rolled double 6. Roll once more')
        .removeClass('hide')

      return this.nextPlayer()
    }

    // no moves
    if (
      !this.movablePieces &&
      ![this.rolled.first, this.rolled.second].includes(6)
    ) {
      return this.showMovementMessage(
        'You need a 6 to get your piece into the action.'
      )
    } else if (!this.hasValidStepMoves()) {
      return this.showMovementMessage('You do not have any valid move')
    }

    this.activatePieces()
  }

  extractPlayablePlayers() {
    this.playablePlayers = this.players.filter(
      (player) => !!player.colors.length
    )
  }

  gameEnded() {
    let message = 'Game has ended!!!\n========================\n'
    message +=
      'Position | Player\n-------------------------------------------\n'

    this.winners.forEach(({ colors }, index) => {
      message += `${index + 1}             | ${colors.join(',')}\n`
    })

    alert(message)

    this.reset()
  }

  getCurrentPlayer() {
    if (this.currentPlayer < 0) {
      return { colors: [] }
    }

    return this.playablePlayers[this.currentPlayer]
  }

  getRef(selector) {
    return this.$container.find(selector)
  }

  hasValidStepMoves() {
    this.possibleMoves = 0

    const moves = {
      first: 0,
      second: 0,
    }

    this.getRef(this.movableAllPiecesSelector).each((i, piece) => {
      const $box = $(piece).parent()

      if ($box.hasClass('home')) {
        moves.first++
        moves.second++
      } else {
        if (this.canMakeCorridorMove(this.rolled.first, piece)) {
          moves.first++
        }
        if (this.canMakeCorridorMove(this.rolled.second, piece)) {
          moves.second++
        }
      }
    })

    if (moves.first) {
      this.possibleMoves++
    }

    if (moves.second) {
      this.possibleMoves++
    }

    return !!this.possibleMoves
  }

  hideUnmovablePieces() {
    this.getRef('.piece').addClass('hide')

    this.playablePlayers.forEach(({ colors }) => {
      colors.forEach((color) => {
        this.getRef(`.piece.${color.toLowerCase()}`).removeClass('hide')
      })
    })
  }

  move(steps) {
    if (!steps) {
      this.checkMoveKills()

      this.$pieceToMove.removeClass('moving')

      if (this.rolled.first || this.rolled.second) {
        this.activatePieces()
      } else if (this.doubleSixes) {
        this.doubleSixes--
        this.rolled.first = this.rolled.second = 6
        this.showMoves()
      } else {
        this.nextPlayer()
      }

      return
    }

    this.$pieceToMove.addClass('moving')

    if (steps >= 6 && this.$pieceToMove.parent('.home').length) {
      this.getRef(`td.start.${this.$pieceToMove.data('color')}`).append(
        this.$pieceToMove.detach()
      )

      return setTimeout(() => {
        this.move(steps > 6 ? steps - 6 : 0)
      }, 300)
    }

    this.activatePieces(false)

    const currentSpotNumber = parseInt(this.$pieceToMove.parent().data('step'))
    const pieceColor = this.$pieceToMove.data('color')
    const nextSpotNumber = currentSpotNumber < 52 ? currentSpotNumber + 1 : 1

    let nextSpotSelector = `td.step[data-step="${nextSpotNumber}"]:not(.corridor)`

    if (
      this.$pieceToMove.parent().hasClass(`corridor-entrance`) &&
      this.$pieceToMove.parent().data('color') === pieceColor
    ) {
      nextSpotSelector = `td.step.corridor.${pieceColor}[data-step="1"]`
    } else if (this.$pieceToMove.parent().hasClass('corridor')) {
      nextSpotSelector = `td.step.corridor.${pieceColor}[data-step="${nextSpotNumber}"]`
    }

    const $nextSpot = this.getRef(nextSpotSelector)

    if ($nextSpot.length) {
      $nextSpot.append(this.$pieceToMove.detach())
    }
    // Piece won from corridor
    else if (this.$pieceToMove.parent().hasClass('corridor')) {
      this.getRef('#center').append(this.$pieceToMove.detach())

      setTimeout(() => {
        this.celebrateExit(this.$pieceToMove)

        this.checkPlayerWins()
      })
    }
    // Invalid move
    else {
      alert("That's an invalid move")

      return this.move(0)
    }

    setTimeout(() => {
      this.move(--steps)
    }, 300)
  }

  nextPlayer() {
    if (!this.playablePlayers.length) {
      return this.gameEnded()
    }

    this.getRef('.piece.active')
      .removeClass('active')
      .siblings('.piece-cover')
      .removeClass('hide')

    this.$rollBtns
      .addClass('hide')
      .parent()
      .siblings('.playing')
      .addClass('hide')

    this.$backdrop.addClass('hide')

    if (!this.doubleSixes) {
      this.$centerMessage.addClass('hide')
      this.currentPlayer++
    }

    if (this.currentPlayer === this.playablePlayers.length) {
      this.currentPlayer = 0
    }

    this.getCurrentPlayer().colors.forEach((color) => {
      color = color.toLowerCase()

      this.getRef(`.home.${color} .piece-cover`)
        .removeClass('hide')
        .children('.roll')
        .removeClass('hide')
        .focus()
    })
  }

  reset() {
    const ludo = this

    // returns pieces to home
    this.getRef('.piece').each(function () {
      const $this = $(this)
      const color = $this.data('color')

      ludo
        .getRef(`.home.${color}`)
        .prepend($this.removeClass('hide').detach())
        .find('.playing')
        .addClass('hide')
        .siblings('.piece-cover')
        .removeClass('hide')
        .children('.roll')
        .addClass('hide')
    })

    this.$centerMessage.addClass('hide')
    this.$movements.addClass('hide')
    this.$movementMessage.addClass('hide')

    this.createDefaults()
    this.restorePlayers()

    this.$backdrop.removeClass('hide').children('#options').removeClass('hide')

    this.$playBtn.focus()
  }

  restorePlayers() {
    if (window.localStorage) {
      let savedPlayers = localStorage.getItem('players')

      if (savedPlayers) {
        try {
          savedPlayers = JSON.parse(savedPlayers)

          savedPlayers.forEach(({ colors }, playerIndex) => {
            colors.forEach((color, colorIndex) => {
              const selector = `select[data-player-index="${playerIndex}"][data-color-index="${colorIndex}"]`

              this.getRef(selector).val(color).trigger('change')
            })
          })
        } catch (e) {}
      }
    }
  }

  savePlayers() {
    if (window.localStorage) {
      localStorage.setItem('players', JSON.stringify(this.players))
    }
  }

  setupEvents() {
    const ludo = this

    this.$backdrop.click(function () {
      if (ludo.backdropClosable) {
        ludo.$backdrop.addClass('hide')
      }
    })

    this.$links.click(function (e) {
      e.preventDefault()

      const $this = $(this)

      if ($this.hasClass('moved')) {
        return
      } else if ($this.hasClass('piece')) {
        ludo.$pieceToMove = $this

        ludo.showMoves()
      } else if ($this.hasClass('move') && !$this.hasClass('not-movable')) {
        let steps = 0

        // TODO: Show current player list of colors at the same position

        ludo.possibleMoves--

        if ($this.hasClass('first')) {
          steps = ludo.rolled.first
          ludo.rolled.first = null
        } else if ($this.hasClass('second')) {
          steps = ludo.rolled.second
          ludo.rolled.second = null
        } else {
          steps = ludo.rolled.first + ludo.rolled.second
          ludo.rolled.first = null
          ludo.rolled.second = null
          ludo.possibleMoves = 0
        }

        ludo.$centerMessage.text(`Moving ${steps} steps`).removeClass('hide')
        ludo.$backdrop.addClass('hide')

        ludo
          .getRef(`.home.${ludo.$pieceToMove.data('color')} .playing`)
          .removeClass('hide')

        ludo.move(steps)
      } else if ($this.hasClass('close')) {
        ludo.$backdrop.addClass('hide')
      }
    })

    this.$optionSelects.change(function () {
      const $this = $(this)

      const playerIndex = $this.data('playerIndex')
      const colorIndex = $this.data('colorIndex')
      const newColor = $this.val()
      const player = ludo.players[playerIndex]

      $this.addClass('active')

      // former color exists
      if (player.colors[colorIndex]) {
        const oldColor = player.colors[colorIndex]

        // unhide all past color options
        $this
          .closest('#options')
          .find(`option.${oldColor.toLowerCase()}`)
          .removeClass('hide')
      }

      // a new color is selected
      if (newColor) {
        // hide all current color options
        $this
          .closest('#options')
          .find('select:not(.active)')
          .find(`option.${newColor.toLowerCase()}`)
          .addClass('hide')

        $this.parent().find('select:not(.active)').prop('disabled', false)

        if (player.colors.length) {
          player.colors.splice(colorIndex, 1)
        }

        player.colors.push(newColor)
      }
      // reset color
      else {
        // reset the second color
        if (colorIndex) {
          // remove color
          player.colors.splice(colorIndex, 1)
        }
        // reset the first color
        else {
          if (player.colors[1]) {
            const secondColor = player.colors[1]

            // unhide all second color options
            $this
              .closest('#options')
              .find(`option.${secondColor.toLowerCase()}`)
              .removeClass('hide')
          }

          // reset colors
          player.colors = []

          // disable second color select box
          $this
            .parent()
            .find('select:not(.active)')
            .prop('disabled', true)
            .val('')
        }
      }

      $this.removeClass('active')
    })

    this.$playBtn.click(function () {
      ludo.savePlayers()
      ludo.extractPlayablePlayers()
      ludo.hideUnmovablePieces()

      ludo.$backdrop
        .addClass('hide')
        .find('#options')
        .addClass('hide')
        .siblings('#movements')
        .removeClass('hide')

      ludo.nextPlayer()
    })

    this.$movementBtn.click(function () {
      const $btn = $(this)

      if ($btn.parent().hasClass('same-player')) {
        return $btn.parent().removeClass('same-player')
      }

      ludo.nextPlayer()
    })

    this.$rollBtns.click(function () {
      if (!ludo.playablePlayers.length) {
        return
      }

      ludo.$rollBtns.addClass('hide')
      $(this).parent().siblings('.playing').removeClass('hide')

      ludo.rolled.first = 0
      ludo.rolled.second = 0

      ludo.$die1.dice('roll', (val) => {
        ludo.rolled.first = val
        ludo.diceRolled()
      })

      ludo.$die2.dice('roll', (val) => {
        ludo.rolled.second = val
        ludo.diceRolled()
      })
    })
  }

  showMoves() {
    this.$moves.addClass('hide')
    this.$movementMessage.addClass('hide')
    this.$centerMessage.addClass('hide')

    // all moves played
    if (this.rolled.first === null && this.rolled.second === null) {
      this.$backdrop.addClass('hide')

      this.nextPlayer()
      return
    }

    this.countMovablePieces()

    this.$backdrop.removeClass('hide')

    let options = 0

    if (this.rolled.first) {
      const $move = this.$moves
        .children('.first')
        .removeClass('moved not-movable')

      $move.children('div').text(this.rolled.first)

      if (
        ((!this.movablePieces || this.$pieceToMove.parent('.home').length) &&
          this.rolled.first !== 6) ||
        !this.canMakeCorridorMove(this.rolled.first)
      ) {
        $move.addClass('not-movable')
      } else {
        options++
      }
    } else {
      this.$moves.children('.first').addClass('moved')
    }

    if (this.rolled.second) {
      const $move = this.$moves
        .children('.second')
        .removeClass('moved not-movable')

      $move.children('div').text(this.rolled.second)

      if (
        ((!this.movablePieces || this.$pieceToMove.parent('.home').length) &&
          this.rolled.second !== 6) ||
        !this.canMakeCorridorMove(this.rolled.second)
      ) {
        $move.addClass('not-movable')
      } else {
        options++
      }
    } else {
      this.$moves.children('.second').addClass('moved')
    }

    if (this.rolled.first && this.rolled.second) {
      const sum = this.rolled.first + this.rolled.second

      const $move = this.$moves
        .children('.sum')
        .removeClass('moved not-movable')

      $move.children('div').text(sum)

      // sum exceed required to exit game
      if (!this.canMakeCorridorMove(sum)) {
        $move.addClass('not-movable')
      } else {
        options++
      }
    } else {
      this.$moves.children('.sum').addClass('moved')
    }

    if (this.possibleMoves) {
      if (!options) {
        this.showMovementMessage('You cannot move this piece')
      } else if (
        this.possibleMoves === 1 &&
        this.rolled.first !== null &&
        this.rolled.second !== null
      ) {
        this.showMovementMessage('This would be your only move')
      }

      this.backdropClosable = true
      this.$moves.removeClass('hide')
    }
  }

  showMovementMessage(message) {
    this.$backdrop.removeClass('hide')
    this.$movements.removeClass('hide')
    this.$moves.addClass('hide')

    return this.$movementMessage
      .removeClass('hide')
      .children('span')
      .text(message)
      .siblings('button')
      .focus()
  }
}

$(function () {
  const ludo = new Ludo()

  window.onbeforeunload = function (e) {
    if (ludo.playablePlayers.length) {
      if (!prompt('The current game would be lost!')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
  }
})
