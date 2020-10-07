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

  createDefaults() {
    this.rolled = {
      first: 0,
      second: 0,
    }

    this.players = [
      { colors: ['Yellow'], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
      { colors: [], rollsBeforeFirstSix: 0 },
    ]

    this.playablePlayers = []

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

    const player = this.getCurrentPlayer()

    let stepPieces = 0

    player.colors.forEach((color) => {
      color = color.toLowerCase()

      if (this.rolled.first === 6 || this.rolled.second === 6) {
        this.getRef(`.home.${color} .piece-cover`).addClass('hide')
      }

      this.getRef(`.piece.${color}`)
        .addClass('active')
        .siblings('.piece-cover')
        .addClass('hide')

      stepPieces += this.getRef(`.step .piece.${color}`).length
    })

    if (!stepPieces && this.rolled.first !== 6 && this.rolled.second !== 6) {
      this.$backdrop.removeClass('hide')
      this.$movements.children('.move').addClass('hide')

      return this.$movementMessage
        .removeClass('hide')
        .children('span')
        .text('You need a 6 to get your piece into the action.')
    }

    this.$movements.find('.first > div').text(this.rolled.first)
    this.$movements.find('.second > div').text(this.rolled.second)

    this.$centerMessage
      .html(
        `Select a <strong>${player.colors
          .map((color) => color.toLowerCase())
          .join(' or ')}</strong> piece to move.`
      )
      .removeClass('hide')
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
      return
    }

    const kclass = this.$pieceToMove.closest('td').attr('class').split(' ')
    let currentSpot = parseInt(kclass[kclass.length - 1])

    $(`td.${++currentSpot}`).prepend(this.$pieceToMove.remove())

    setTimeout(() => {
      this.move(--steps)
    }, 300)
  }

  nextPlayer() {
    // $('.roll-dice').removeClass('hide')
    this.$rollBtns.addClass('hide')
    this.$backdrop.addClass('hide')

    this.currentPlayer++

    if (this.currentPlayer === this.playablePlayers.length) {
      this.currentPlayer = 0
    }

    this.getCurrentPlayer().colors.forEach((color) => {
      color = color.toLowerCase()

      this.getRef(`.home.${color} .roll`).removeClass('hide')
    })
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

      if ($this.hasClass('piece')) {
        ludo.$pieceToMove = $this

        ludo.$backdrop
          .removeClass('hide')
          .children('#movements')
          .removeClass('hide')
      } else if ($this.hasClass('move')) {
        let steps = 0

        if ($this.hasClass('first')) {
          steps = ludo.rolled.first
          ludo.rolled.first = 0
        } else {
          steps = ludo.rolled.second
          ludo.rolled.second = 0
        }

        ludo.$centerMessage.text(`Moving ${steps} steps`)

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
