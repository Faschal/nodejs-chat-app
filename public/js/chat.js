const socket = io()

// elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton =document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const shareTemplate = document.querySelector('#share-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
  // New Message element
  const $newMessage = $messages.lastElementChild

  // Height of the new message
  const newMessageStyle = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyle.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far i scroll ?
  const scrollOffset = $messages.scrollTop + visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message', (message) => {
  console.log(message)
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('locationMessage', (message) => {
  console.log(message)
  const html = Mustache.render(shareTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend', html)
  autoscroll()
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  
  $messageFormButton.setAttribute('disabled', 'disabled')

  const message = e.target.elements.message.value
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()

    if(error) {
      return console.log(error)
    }

    console.log('Message Delivered')
  })
})

$shareLocationButton.addEventListener('click', () => {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }

  $shareLocationButton.setAttribute('disabled', 'disabled')

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }, () => {
      $shareLocationButton.removeAttribute('disabled')
      console.log('Location shared')
    })
  })
})

socket.emit('join', { username, room }, (error) => {
  if(error) {
    alert(error)
    location.href = '/'
  }
})