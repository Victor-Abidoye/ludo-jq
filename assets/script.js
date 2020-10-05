let players = [
  { colors: ['Yellow'], rollsBeforeFirstSix: 0 },
  { colors: [], rollsBeforeFirstSix: 0 },
  { colors: [], rollsBeforeFirstSix: 0 },
  { colors: [], rollsBeforeFirstSix: 0 },
]
$(function () {
  const DIE_ROLL_DURATION = 1000
  const rolled = {
    first: 0,
    second: 0,
  }

  if (window.localStorage) {
    const savedPlayers = localStorage.getItem('players')

    if (savedPlayers) {
      players = JSON.parse(savedPlayers)

      players.forEach(({ colors }, playerIndex) =>
        colors.forEach((color, colorIndex) => {
          const selector = `select[data-player-index="${playerIndex}"][data-color-index="${colorIndex}"]`

          $(selector).val(color).trigger('change')
        })
      )
    }
  }

  let playablePlayers = []

  $('a').click(function (e) {
    e.preventDefault()
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

    $('#backdrop').addClass('hide')
  })

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

  $('#dice').click(function () {
    if (!playablePlayers.length) {
      return
    }

    $die1.dice('roll', (val) => (rolled.first = val))
    $die2.dice('roll', (val) => (rolled.second = val))
  })

  window.onbeforeunload = function (e) {
    if (playablePlayers.length) {
      if (!prompt('The current game would be lost!')) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
  }
})
