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

  activatePieces (state = true) {
    if (state && !this.movablePieces) {
      this.rolled = []
      return this.nextPlayer()
    }

    this.$backdrop.addClass('hide')

    if (state) {
      const { colors } = this.getCurrentPlayer()

      this.$centerMessage
        .html(
          `Select a <strong>${colors
            .map((color) => color.toLowerCase())
            .join(' or ')}</strong> piece to move.`
        )
        .removeClass('hide')

      this.$movablePieces
        .addClass('active')
        .siblings('.piece-cover')
        .addClass('hide')
    } else {
      this.$movablePieces
        .removeClass('active')
        .siblings('.piece-cover')
        .removeClass('hide')
    }
  }

  canMakeCorridorMove (steps, pieceToMove) {
    const $pieceToMove = $(pieceToMove || this.$pieceToMove)
    const pieceColor = $pieceToMove.data('color')
    const $pieceBox = $pieceToMove.parent()

    if (!$pieceBox.hasClass('step')) {
      return true
    }

    const pieceInCorridor = $pieceBox.hasClass('corridor')
    const currentSpotNumber = parseInt($pieceBox.data('step'))

    if (pieceInCorridor) {
      return currentSpotNumber + steps <= 6
    } else if (currentSpotNumber <= this.corridorEntrances[pieceColor]) {
      return steps <= this.corridorEntrances[pieceColor] - currentSpotNumber + 6
    }

    return true
  }

  canMove (steps, otherSteps) {
    const canMoveSum = steps && otherSteps &&
      this.canMakeCorridorMove(steps + otherSteps, this.$pieceToMove)
    const $playerStepPieces = this.getRef(this.getPlayerColorsSelector('.step '))

    return (!canMoveSum || this.movablePieces > 1) &&

      (this.$pieceToMove.parent().hasClass('step') && this.canMakeCorridorMove(steps) &&
        (otherSteps === null || $playerStepPieces.length > 1 ||
          [steps, otherSteps].includes(6))) ||

      (this.$pieceToMove.parent().hasClass('home') && (steps === 6 &&
        (otherSteps === 6 || $playerStepPieces.length)))
  }

  celebrateExit (piece) {
    setTimeout(() =>
      alert(`Hooray!!! A ${$(piece).data('color')} piece is out!!!`)
    )
  }

  celebrateWinner () {
    const player = this.playablePlayers.splice(this.currentPlayer, 1)[0]

    this.winners.push(player)

    let playerColors = player.colors.join('/')

    setTimeout(() =>
      alert(`And we have a winner! Congrats Player "${playerColors}"`)
    )
  }

  checkMoveKills (callback) {
    const $box = this.$pieceToMove.parent()

    if (!$box.hasClass('step') || $box.hasClass('corridor')) {
      return callback()
    }

    const { colors } = this.getCurrentPlayer()

    const $otherPieces = $box
      .find(`.piece:not(.${colors.join('):not(.')})`.toLowerCase())

    const stepColors = this.getStepPieceColors($otherPieces)

    if ($otherPieces.length > 1 && stepColors.length > 1) {
      this.movingPieceCallback = callback
      this.showStepPieces(stepColors, 'Select piece to kill.', false)
    } else if ($otherPieces.length) {
      this.movingPieceCallback = callback
      this.killPiece($otherPieces.first())
    } else {
      callback()
    }
  }

  checkPlayerWins () {
    const selector = this.getPlayerColorsSelector('.piece')

    if (
      this.getRef(selector).length ===
      this.getRef('#center').find(selector).length
    ) {
      this.celebrateWinner()
      this.rolled = []
      this.currentPlayer--
    }
  }

  countMovablePieces () {
    this.movablePiecesSelector = this.getPlayerColorsSelector('.step .piece')

    if (this.rolled[0].first === 6 || this.rolled[0].second === 6) {
      this.movablePiecesSelector +=
        ', ' + this.getPlayerColorsSelector('.home .piece')
    }

    this.movablePieces = 0

    const rolled = this.rolled[0]
    const pieces = []

    if (rolled) {
      this.getRef(this.movablePiecesSelector)
        .each((i, piece) => {
          if (
            this.canMakeCorridorMove(rolled.first, piece) ||
            this.canMakeCorridorMove(rolled.second, piece) ||
            this.canMakeCorridorMove(rolled.first + rolled.second, piece)) {
            this.movablePieces++
            pieces.push(piece)
          }
        })
    }

    this.$movablePieces = $(pieces)
  }

  createDefaults () {
    this.rolled = []
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
    this.$movablePieces = null
    this.movablePieces = 0
    this.movingPieceCallback = null
    this.piecesSelector = ''
    this.doubleSixes = 0

    this.winners = []
    this.backdropClosable = false
    this.currentPlayer = -1
    this.$pieceToMove = null
  }

  createDice () {
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

  createRefs () {
    this.$backdrop = this.getRef('#backdrop')
    this.$centerMessage = this.getRef('.center-message')
    this.$links = this.getRef('a:not(.regular)')
    this.$rollBtns = this.getRef('.roll')

    this.$movements = this.$backdrop.find('#movements')
    this.$moves = this.$movements.children('.moves')
    this.$movementMessage = this.$movements.children('.message')
    this.$movementBtn = this.$movementMessage.children('button')

    this.$options = this.$backdrop.children('#options')
    this.$optionSelects = this.$options.find('select')

    this.$stepPieces = this.$backdrop.children('#step-pieces')

    this.$playBtn = this.$options.find('#play')
    this.$dice = this.getRef('#dice')
  }

  debug (color, count) {
    if (!color) {
      return
    }

    this.getRef(`.piece.${color}`).each((i, piece) => {
      if (i >= count) {
        return
      }

      const entranceNumber = this.getRef(`.corridor-entrance[data-color="${color}"]`).data('step')

      this.getRef(`.step[data-step="${entranceNumber - 2 - i}"]`).append(
        $(piece).detach()
      )
    })
  }

  diceRolled (rolled = {}) {
    this.backdropClosable = false

    if (!rolled.first || !rolled.second) {
      return
    }

    this.rolled.push(rolled)

    if (rolled.first === 6 && rolled.second === 6) {
      this.$centerMessage
        .html('You rolled double 6. Roll once more')
        .removeClass('hide')

      return this.nextPlayer()
    }

    this.countMovablePieces()

    // no moves
    if (
      !this.movablePieces &&
      this.rolled.length === 1 &&
      ![rolled.first, rolled.second].includes(6)
    ) {
      return this.showMovementMessage(
        'You need a 6 to get your piece into the action.'
      )
    } else if (!this.movablePieces) {
      return this.showMovementMessage('You do not have any valid move')
    }

    this.activatePieces()
  }

  extractPlayablePlayers () {
    this.playablePlayers = this.players.filter(
      (player) => !!player.colors.length
    )
  }

  gameEnded () {
    if (this.playablePlayers.length) {
      this.winners = [...this.winners, ...this.playablePlayers]
    }

    let message = 'Game has ended!!!\n========================\n'
    message +=
      'Position | Player\n-------------------------------------------\n'

    this.winners.forEach(({ colors }, index) => {
      message += `${index + 1}             | ${colors.join(',')}\n`
    })

    alert(message)

    this.reset()
  }

  getCurrentPlayer () {
    if (this.currentPlayer < 0) {
      return { colors: [] }
    }

    return this.playablePlayers[this.currentPlayer]
  }

  getPlayerColorsSelector (prefix = '', suffix = '') {
    const { colors } = this.getCurrentPlayer()
    let selector = ''

    colors.forEach((color) => {
      color = color.toLowerCase()

      if (selector) {
        selector += ', '
      }

      selector += `${prefix}.${color}${suffix}`
    })

    return selector
  }

  getRef (selector) {
    return this.$container.find(selector)
  }

  getStepPieceColors (pieces) {
    const colors = []

    $(pieces).each((i, piece) => {
      const pieceColor = $(piece).data('color')

      if (colors.indexOf(pieceColor) === -1) {
        colors.push(pieceColor)
      }
    })

    return colors
  }

  hideUnmovablePieces () {
    this.getRef('.piece').addClass('hide')

    this.playablePlayers.forEach(({ colors }) => {
      colors.forEach((color) => {
        this.getRef(`.piece.${color.toLowerCase()}`).removeClass('hide')
      })
    })
  }

  killPiece (piece) {
    const $piece = $(piece)
    const otherColor = $piece.data('color')

    alert(`${this.$pieceToMove.data('color')} kills ${otherColor}`)

    this.getRef(`.home.${otherColor}`).prepend($piece.detach())
    this.getRef('#center').append(this.$pieceToMove.detach())

    this.checkPlayerWins()

    if (this.movingPieceCallback) {
      this.movingPieceCallback()
      this.movingPieceCallback = null
    }
  }

  move (steps) {
    if (!steps) {
      return this.checkMoveKills(() => {
        this.countMovablePieces()

        this.$pieceToMove.removeClass('moving')

        // has one more move to make
        if (
          this.rolled.length &&
          (this.rolled[0].first || this.rolled[0].second)
        ) {
          this.activatePieces()
        }
        // moved both but rolled double sixes and has more moves
        else if (this.rolled.length > 1) {
          this.rolled.shift()
          this.countMovablePieces()
          this.activatePieces()
        }
        // done with turn
        else {
          this.rolled = []
          this.nextPlayer()
        }
      })
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

  nextPlayer () {
    if (this.playablePlayers.length <= 1 && this.winners.length) {
      return this.gameEnded()
    }

    this.getRef('.piece')
      .removeClass('active')
      .siblings('.piece-cover')
      .removeClass('hide')

    this.$rollBtns
      .addClass('hide')
      .parent()
      .siblings('.playing')
      .addClass('hide')

    this.$backdrop.addClass('hide')

    if (!this.rolled.length) {
      this.$centerMessage.text('Roll dice').removeClass('hide')
      this.currentPlayer++

      if (this.currentPlayer === this.playablePlayers.length) {
        this.currentPlayer = 0
      }
    }

    this.getRef(this.getPlayerColorsSelector('.home'))
      .find('.playing')
      .removeClass('hide')

      .siblings('.piece-cover')
      .removeClass('hide')

      .children('.roll')
      .removeClass('hide')
      .focus()

    this.getRef('.roll.mobile').removeClass('hide')
  }

  reset () {
    const ludo = this

    // returns pieces to home
    this.getRef('.step .piece, #center .piece').each(function () {
      const $this = $(this)
      const color = $this.data('color')

      ludo
        .getRef(`.home.${color}`)
        .prepend($this.removeClass('hide').detach())
        .find('.playing')
        .addClass('hide')
        .siblings('.piece-cover')
        .removeClass('hide')

      ludo.$rollBtns.addClass('hide')
    })

    this.$centerMessage.addClass('hide')
    this.$movements.addClass('hide')
    this.$movementMessage.addClass('hide')

    this.createDefaults()
    this.restorePlayers()

    this.$backdrop.removeClass('hide').children('#options').removeClass('hide')

    this.$playBtn.focus()
  }

  restorePlayers () {
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
        } catch (e) { }
      }
    }
  }

  savePlayers () {
    if (window.localStorage) {
      localStorage.setItem('players', JSON.stringify(this.players))
    }
  }

  setupEvents () {
    const ludo = this

    this.$backdrop.click(function (e) {
      if (e.target.id === 'backdrop' && ludo.backdropClosable) {
        ludo.$backdrop.addClass('hide')
        ludo.$options.addClass('hide')
        ludo.$movements.addClass('hide')
        ludo.$stepPieces.addClass('hide')
        ludo.movingPieceCallback = null
        ludo.$pieceToMove = null
      }
    })

    this.$links.click(function (e) {
      e.preventDefault()
      e.stopPropagation()

      const $this = $(this)

      if ($this.hasClass('moved')) {
        return
      } else if ($this.hasClass('piece')) {
        const pieceColor = $this.data('color')

        // selected piece from options
        if ($this.parent().hasClass('step-pieces')) {
          ludo.$stepPieces.addClass('hide')

          // selected piece to move
          if (ludo.$pieceToMove.length > 1) {
            if (ludo.$pieceToMove.first().hasClass(pieceColor)) {
              ludo.$pieceToMove = ludo.$pieceToMove.first()
            } else {
              ludo.$pieceToMove = ludo.$pieceToMove.last()
            }

            ludo.showMoves()
          }
          // selected piece to kill
          else {
            ludo.killPiece(ludo.$pieceToMove.siblings(`.${pieceColor}`).first())
          }
        }
        // selected piece from step/home
        else {
          const { colors } = ludo.getCurrentPlayer()
          const casedColors = colors.map(color => color.toLowerCase())
          const workableColors = [...casedColors]

          workableColors.splice(workableColors.indexOf(pieceColor), 1)

          // player has multiple colors on same step
          if (colors.length > 1 && $this.siblings(`.${workableColors[0]}`).length) {
            ludo.$pieceToMove = $this.parent().find(ludo.getPlayerColorsSelector('.piece'))
            ludo.showStepPieces(casedColors, 'Select piece to move')
          }
          // player has only one color on the step
          else {
            ludo.$pieceToMove = $this
            ludo.showMoves()
          }
        }
      } else if ($this.hasClass('move') && !$this.hasClass('not-movable')) {
        let steps = 0

        if ($this.hasClass('first')) {
          steps = ludo.rolled[0].first
          ludo.rolled[0].first = null
        } else if ($this.hasClass('second')) {
          steps = ludo.rolled[0].second
          ludo.rolled[0].second = null
        } else {
          steps = ludo.rolled[0].first + ludo.rolled[0].second
          ludo.rolled[0].first = null
          ludo.rolled[0].second = null
        }

        ludo.$centerMessage.text(`Moving ${steps} steps`).removeClass('hide')
        ludo.$backdrop.addClass('hide')

        ludo
          .getRef(ludo.getPlayerColorsSelector('.home', ' .playing'))
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

      ludo.rolled = []
      ludo.nextPlayer()
    })

    this.$movementBtn.click(function () {
      const $btn = $(this)

      if ($btn.parent().hasClass('same-player')) {
        return $btn.parent().removeClass('same-player')
      }

      ludo.rolled = []
      ludo.nextPlayer()
    })

    this.$rollBtns.click(function () {
      if (!ludo.playablePlayers.length) {
        return
      }

      ludo.$rollBtns.addClass('hide')
      ludo
        .getRef(ludo.getPlayerColorsSelector('.home', ' .playing'))
        .removeClass('hide')

      let rolled = { first: 0, second: 0 }

      ludo.$die1.dice('roll', (val) => {
        rolled.first = val
        ludo.diceRolled(rolled)
      })

      ludo.$die2.dice('roll', (val) => {
        rolled.second = val
        ludo.diceRolled(rolled)
      })
    })
  }

  showMoves () {
    this.$moves.addClass('hide')
    this.$movementMessage.addClass('hide')
    this.$centerMessage.addClass('hide')

    // all moves played
    if (!this.rolled.length) {
      this.$backdrop.addClass('hide')

      this.nextPlayer()
      return
    }

    // this.countMovablePieces()

    this.$backdrop.removeClass('hide')
    this.$movements.removeClass('hide')

    let options = 0

    const rolled = this.rolled[0]

    if (rolled.first) {
      const $move = this.$moves
        .children('.first')
        .removeClass('moved not-movable')

      $move.children('div').text(rolled.first)

      if (this.canMove(rolled.first, rolled.second)) {
        options++
      } else {
        $move.addClass('not-movable')
      }
    } else {
      this.$moves.children('.first').addClass('moved')
    }

    if (rolled.second) {
      const $move = this.$moves
        .children('.second')
        .removeClass('moved not-movable')

      $move.children('div').text(rolled.second)

      if (this.canMove(rolled.second, rolled.first)) {
        options++
      } else {
        $move.addClass('not-movable')
      }
    } else {
      this.$moves.children('.second').addClass('moved')
    }

    if (rolled.first && rolled.second) {
      const sum = rolled.first + rolled.second

      const $move = this.$moves
        .children('.sum')
        .removeClass('moved not-movable')

      $move.children('div').text(sum)

      // sum exceed required to exit game
      if (!this.canMakeCorridorMove(sum, this.$pieceToMove)) {
        $move.addClass('not-movable')
      } else {
        options++
      }
    } else {
      this.$moves.children('.sum').addClass('moved')
    }

    if (this.movablePieces) {
      if (!options) {
        this.showMovementMessage('You cannot move this piece')
      } else if (this.movablePieces === 1 && options > 1) {
        this.showMovementMessage('This would be your only move')
      }

      this.backdropClosable = true
      this.$moves.removeClass('hide')
    }
  }

  showMovementMessage (message) {
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

  showStepPieces (colors, message, closableBackdrop = true) {
    this.$movements.addClass('hide')
    this.$backdrop.removeClass('hide')
    this.backdropClosable = closableBackdrop

    this.$stepPieces
      .removeClass('hide')
      .find('.message')
      .html(message)
      .siblings('.step-pieces')
      .children()
      .each((i, piece) => {
        $(piece)
          .removeClass(`hide ${$(piece).data('color') || ''}`)
          .addClass(colors[i])
          .data('color', colors[i])
      })
      .parent()
  }
}

$(function () {
  window.ludo = new Ludo()

  window.onbeforeunload = function (e) {
    if (ludo.playablePlayers.length) {
      if (!prompt('The current game would be lost!')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
  }
})
