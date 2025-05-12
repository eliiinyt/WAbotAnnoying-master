document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const mainContent = document.getElementById('main-content');
    const logMessagesDiv = document.getElementById('log-messages');
    const socket = io();
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await axios.post('/login', { username, password });
            if (response.data.success) {
                loginSection.style.display = 'none';
                mainContent.style.display = 'block';
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            alert('Error al iniciar sesión');
        }
    });
        socket.on('newLog', (log) => {

            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'received');
            let content = `
            <div class="message-info">${log.name} (${log.sender})</div>
            <div class="message-content">${log.body}</div>
        `;

        if (log.url) {
            content += `<img src="${log.url}" class="message-image" alt="Imagen">`;
        }

        content += `<button class="reply-btn" data-log='${JSON.stringify(log)}'>Responder</button>`;

        messageElement.innerHTML = content;
        logMessagesDiv.appendChild(messageElement);
    });

     logMessagesDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('reply-btn')) {
            const log = JSON.parse(event.target.getAttribute('data-log'));
            const replyMessage = prompt('Escribe tu respuesta:');
            if (replyMessage) {
                console.log('Respuesta:', replyMessage, 'para el log:', log);
                socket.emit('reply', { replyMessage, log });
            }
        }
    });
});