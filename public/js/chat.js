const socket =io();
// Elements
const $messageform = document.querySelector('#message-form');
const $messageFormInput = $messageform.querySelector('input');
const $messageformButton = $messageform.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages =  document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
const { username, room } = Qs.parse(location.search,{ignoreQueryPrefix:true})


//Functions
const autoscroll =()=>{
    // New message element
    const $newMessage = $messages.lastElementChild
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight= $newMessage.offsetHeight+ newMessageMargin
    // Visible height: 

    const visibleHeight = $messages.offsetHeight
    // Height of messages container
    const containerHeight = $messages.scrollHeight
    // How far I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight- newMessageHeight<= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('HH:MM ')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})

socket.on('locationMessage',(locationMessage)=>{
    console.log(locationMessage);
    const html = Mustache.render(locationMessageTemplate,{
        username:locationMessage.username,
        url:locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('HH:MM ')
    });
    $messages.insertAdjacentHTML('beforeend',html);
})
$messageform.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageformButton.setAttribute('disabled','disabled');
    // disable the form
    const message = e.target.elements.message.value; 
    socket.emit('sendMessage',message,(error)=>{
        //enable the form 
        $messageFormInput.value='';
        $messageFormInput.focus();
        $messageformButton.removeAttribute('disabled');

        if(error){
            return console.log(error);
        }
        console.log("The message is send")
    });
})
$sendLocationButton.addEventListener('click',()=>{
    $sendLocationButton.setAttribute('disabled','disabled');
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser !');
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        console.log(position);
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },()=>{
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared !')
        })
    })
})
socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error);
        location.href='/'
    }
})
socket.on('roomData',({room,users})=>{
    const html= Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML =html
})