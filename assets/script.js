const rolled = {
  one: 0,
  two: 0,
}

$(function () {
  const DIE_ROLL_DURATION = 1000
  let movementSpeed = DIE_ROLL_DURATION

  const roll = (die, duration = DIE_ROLL_DURATION) => {
    if (duration === DIE_ROLL_DURATION) {
      move(die)
    }

    const number = Math.ceil(Math.random() * 6)

    const $die = $(die)
    const isOne = $die.hasClass('die-1')

    $die.css('background-image', `url(./assets/img/die-${number}.png)`)

    if (!duration) {
      rolled[isOne ? 'one' : 'two'] = number
      return
    }

    setTimeout(roll, 100, die, duration - 100)
  }

  $('a').click(function (e) {
    e.preventDefault()
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
    $die1.dice('roll', (val) => (rolled.one = val))
    $die2.dice('roll', (val) => (rolled.two = val))
  })
})
