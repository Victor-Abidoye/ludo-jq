class Ludo {
  static DIE_ROLL_DURATION = 1000

  constructor(container = 'body') {
    this.$container = $(container)

    this.createDefaults()
    this.createRefs()
    this.createDice()
    this.setupEvents()
    this.restorePlayers()
  }

  activatePieces(state = true) {
    this.$backdrop.addClass('hide')

    const player = this.getCurrentPlayer()

    this.$centerMessage
      .html(
        `Select a <strong>${player.colors
          .map((color) => color.toLowerCase())
          .join(' or ')}</strong> piece to move.`
      )
      .removeClass('hide')

    if (state) {
      this.getRef(this.selector)
        .addClass('active')
        .siblings('.piece-cover')
        .addClass('hide')
    } else {
      this.getRef(this.selector)
        .removeClass('active')
        .siblings('.piece-cover')
        .removeClass('hide')
    }
  }

  celebrateExit(piece) {}

  countMovablePieces() {
    const player = this.getCurrentPlayer()

    this.selector = ''
    this.movablePieces = 0

    player.colors.forEach((color) => {
      color = color.toLowerCase()

      if (this.selector) {
        this.selector += ', '
      }

      if (this.rolled.first === 6 || this.rolled.second === 6) {
        this.selector += `.home .piece.${color}`
      }

      if (this.selector) {
        this.selector += ', '
      }

      this.selector += `.step .piece.${color}`

      this.movablePieces += this.getRef(`.step .piece.${color}`).length
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

    this.movablePieces = 0
    this.piecesSelector = ''

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
    this.$movementMessage = this.$movements.find('.message')
    this.$movementBtn = this.$movementMessage.find('button')
    this.$options = this.$backdrop.find('#options')
    this.$optionSelects = this.$options.find('select')
    this.$playBtn = this.$options.find('#play')
  }

  diceRolled() {
    if (!this.rolled.first || !this.rolled.second) {
      return
    }

    this.countMovablePieces()

    // no moves
    if (
      !this.movablePieces &&
      this.rolled.first !== 6 &&
      this.rolled.second !== 6
    ) {
      this.$backdrop.removeClass('hide')
      this.$movements.removeClass('hide')
      this.$movements.find('.move').addClass('hide')

      return this.$movementMessage
        .removeClass('hide')
        .children('span')
        .text('You need a 6 to get your piece into the action.')
        .siblings('button')
        .focus()
    }

    this.activatePieces()
  }

  extractPlayablePlayers() {
    this.playablePlayers = this.players.filter(
      (player) => !!player.colors.length
    )
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

  move(steps) {
    if (!steps) {
      if (this.rolled.first || this.rolled.second) {
        this.activatePieces()
      } else {
        this.nextPlayer()
      }

      return
    }

    if (steps === 6 && this.$pieceToMove.parent('.home').length) {
      this.getRef(`td.start.${this.$pieceToMove.data('color')}`).append(
        this.$pieceToMove.detach()
      )
      return this.activatePieces()
    }

    this.activatePieces(false)

    const currentSpotNumber = parseInt(this.$pieceToMove.parent().data('step'))
    const pieceColor = this.$pieceToMove.data('color')
    const nextSpotNumber = currentSpotNumber < 52 ? currentSpotNumber + 1 : 1

    let nextSpotSelector = `td.step[data-step="${nextSpotNumber}"]:not(.corridor)`

    if (
      this.$pieceToMove.parent().hasClass(`corridor-entrance ${pieceColor}`)
    ) {
      nextSpotSelector = `td.step.corridor.${pieceColor}[data-step="1"]`
    } else if (this.$pieceToMove.parent().hasClass('corridor')) {
      nextSpotSelector = `td.step.corridor.${pieceColor}[data-step="${nextSpotNumber}"]`
    }

    const $nextSpot = this.getRef(nextSpotSelector)

    console.log(
      'current number',
      currentSpotNumber,
      'color',
      pieceColor,
      'next number',
      nextSpotNumber,
      'selector',
      nextSpotSelector,
      $nextSpot
    )

    if ($nextSpot.length) {
      $nextSpot.append(this.$pieceToMove.detach())
    }
    // Piece won from corridor
    else if (this.$pieceToMove.hasClass('corridor')) {
      this.$pieceToMove.addClass('hide')

      this.celebrateExit(this.$pieceToMove)
    }
    // Invalid move
    else {
      alert("That's an invalid move")

      return this.activatePieces()
    }

    setTimeout(() => {
      this.move(--steps)
    }, 300)
  }

  nextPlayer() {
    this.$backdrop.addClass('hide')

    this.getRef('.piece.active')
      .removeClass('active')
      .siblings('.piece-cover')
      .removeClass('hide')
    this.$rollBtns.addClass('hide')
    this.$backdrop.addClass('hide')

    this.currentPlayer++

    if (this.currentPlayer === this.playablePlayers.length) {
      this.currentPlayer = 0
    }

    this.getCurrentPlayer().colors.forEach((color) => {
      color = color.toLowerCase()

      this.getRef(`.home.${color} .roll`).removeClass('hide').focus()
    })
  }

  reset() {
    this.$playBtn.focus()
  }

  restorePlayers() {
    if (window.localStorage) {
      let savedPlayers = localStorage.getItem('players')

      if (savedPlayers) {
        savedPlayers = JSON.parse(savedPlayers)

        savedPlayers.forEach(({ colors }, playerIndex) => {
          colors.forEach((color, colorIndex) => {
            const selector = `select[data-player-index="${playerIndex}"][data-color-index="${colorIndex}"]`

            this.getRef(selector).val(color).trigger('change')
          })
        })
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
        }

        ludo.$centerMessage.text(`Moving ${steps} steps`).removeClass('hide')

        ludo.move(steps)
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
      ludo.extractPlayablePlayers()
      ludo.savePlayers()

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
    this.$movements.children('.move').addClass('hide')
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

    if (this.rolled.first) {
      const $move = this.$movements
        .children('.first')
        .removeClass('moved not-movable')

      $move.children('div').text(this.rolled.first)

      if (!this.movablePieces && this.rolled.first !== 6) {
        $move.addClass('not-movable')
      }
    } else {
      this.$movements.children('.first').addClass('moved')
    }

    if (this.rolled.second) {
      const $move = this.$movements
        .children('.second')
        .removeClass('moved not-movable')

      $move.children('div').text(this.rolled.second)

      if (!this.movablePieces && this.rolled.second !== 6) {
        $move.addClass('not-movable')
      }
    } else {
      this.$movements.children('.second').addClass('moved')
    }

    if (this.rolled.first && this.rolled.second) {
      const $move = this.$movements
        .children('.sum')
        .removeClass('moved not-movable')

      $move.children('div').text(this.rolled.first + this.rolled.second)

      if (!this.movablePieces) {
        $move.addClass('not-movable')
      }
    } else {
      this.$movements.children('.sum').addClass('moved')
    }

    if (
      this.movablePieces &&
      this.$pieceToMove.parent('.step').length &&
      this.rolled.first &&
      this.rolled.second
    ) {
    }

    this.$movements.children('.move').removeClass('hide')
  }
}

$(function () {
  const ludo = new Ludo()

  ludo.reset()

  window.onbeforeunload = function (e) {
    if (ludo.playablePlayers.length) {
      if (!prompt('The current game would be lost!')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
  }
})
