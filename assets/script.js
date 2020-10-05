$(function () {
  const DIE_ROLL_DURATION = 1000
  const rolled = {
    first: 0,
    second: 0,
  }

  const $backdrop = $('#backdrop')
  const $centerMessage = $('#center .message')
  const $movements = $('#movements')
  const $movementMessage = $movements.find('.message')

  let players = [
    { colors: ['Yellow'], rollsBeforeFirstSix: 0 },
    { colors: [], rollsBeforeFirstSix: 0 },
    { colors: [], rollsBeforeFirstSix: 0 },
    { colors: [], rollsBeforeFirstSix: 0 },
  ]

  let currentPlayer = -1

  let $pieceToMove = null

  let playablePlayers = []

  const $die1 = $('#die-1').dice({
    duration: DIE_ROLL_DURATION,
    imageUrl: './assets/img/dice.png',
    value: 6,
  })

  const $die2 = $('#die-2').dice({
    duration: DIE_ROLL_DURATION,
    imageUrl: './assets/img/dice.png',
    value: 6,
  })

  const nextPlayer = () => {
    $('.roll-dice').removeClass('hide')
    $('.roll').addClass('hide')
    $backdrop.addClass('hide')

    currentPlayer++

    if (currentPlayer === playablePlayers.length) {
      currentPlayer = 0
    }

    const player = players[currentPlayer]

    player.colors.forEach((color) => {
      color = color.toLowerCase()

      $(`.home.${color} .roll`).removeClass('hide')
    })
  }

  const diceRolled = () => {
    if (!rolled.first || !rolled.second) {
      return
    }

    const player = players[currentPlayer]

    let stepPieces = 0

    player.colors.forEach((color) => {
      color = color.toLowerCase()

      if (rolled.first === 6 || rolled.second === 6) {
        $(`.home.${color} .piece-cover`).addClass('hide')
      }

      $(`.piece.${color}`)
        .addClass('active')
        .siblings('.piece-cover')
        .addClass('hide')

      stepPieces += $(`.step .piece.${color}`).length
    })

    if (!stepPieces && rolled.first !== 6 && rolled.second !== 6) {
      $backdrop.removeClass('hide')
      $movements.children('.move').addClass('hide')

      return $movementMessage
        .removeClass('hide')
        .children('span')
        .text('You need a 6 to get your piece into the action.')
    }

    $('#movements > .first > div').text(rolled.first)
    $('#movements > .second > div').text(rolled.second)

    $centerMessage
      .text(`Select a ${player.colors.join(' or ')} piece to move.`)
      .removeClass('hide')
  }

  const move = (steps) => {
    if (!steps) {
      return
    }

    const kclass = $pieceToMove.closest('td').attr('class').split(' ')
    let currentSpot = parseInt(kclass[kclass.length - 1])

    $(`td.${++currentSpot}`).prepend($pieceToMove.remove())

    setTimeout(move, 300, --steps)
  }

  $('a').click(function (e) {
    e.preventDefault()

    const $this = $(this)

    if ($this.hasClass('piece')) {
      $pieceToMove = $this

      $backdrop.removeClass('hide').children('#movements').removeClass('hide')
    } else if ($this.hasClass('move')) {
      let steps = 0

      if ($this.hasClass('first')) {
        steps = rolled.first
        rolled.first = 0
      } else {
        steps = rolled.second
        rolled.second = 0
      }

      $centerMessage.text(`Moving ${steps} steps`)

      move(steps)
    }
  })

  $('#options select').change(function () {
    const $this = $(this)

    const playerIndex = $this.data('playerIndex')
    const colorIndex = $this.data('colorIndex')
    const newColor = $this.val()
    const player = players[playerIndex]

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

  $('#play').click(function () {
    playablePlayers = players.filter((player) => !!player.colors.length)

    if (window.localStorage) {
      localStorage.setItem('players', JSON.stringify(players))
    }

    $backdrop
      .addClass('hide')
      .find('#options')
      .addClass('hide')
      .siblings('#movements')
      .removeClass('hide')

    nextPlayer()
  })

  $('.roll').click(function () {
    if (!playablePlayers.length) {
      return
    }

    $('.roll').addClass('hide')

    rolled.first = 0
    rolled.second = 0

    $die1.dice('roll', (val) => {
      rolled.first = val
      diceRolled()
    })

    $die2.dice('roll', (val) => {
      rolled.second = val
      diceRolled()
    })
  })

  $('#movements button').click(function () {
    nextPlayer()
  })

  if (window.localStorage) {
    let savedPlayers = localStorage.getItem('players')

    if (savedPlayers) {
      savedPlayers = JSON.parse(savedPlayers)

      savedPlayers.forEach(({ colors }, playerIndex) => {
        colors.forEach((color, colorIndex) => {
          const selector = `select[data-player-index="${playerIndex}"][data-color-index="${colorIndex}"]`

          $(selector).val(color).trigger('change')
        })
      })
    }
  }

  window.onbeforeunload = function (e) {
    if (playablePlayers.length) {
      if (!prompt('The current game would be lost!')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
  }
})
