/* eslint-disable no-undef */

function getRelativePath(basePath, targetPath) {
    const baseParts = basePath.split('/').filter(part => part !== '');
    const targetParts = targetPath.split('/').filter(part => part !== '');

    while (baseParts.length > 0 && targetParts.length > 0 && baseParts[0] === targetParts[0]) {
        baseParts.shift();
        targetParts.shift();
    }

    const relativeParts = [];
    for (let i = 0; i < baseParts.length; i++) {
        relativeParts.push('..');
    }

    relativeParts.push(...targetParts);

    return relativeParts.join('/');
}

const publicPath = '/home/elin/wabot/WAbotAnnoying-master/public';

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

        if (log.multimedia && log.multimedia.filename) {
            const relativePath = getRelativePath(publicPath, log.multimedia.filename);
            content += `<div class="message-multimedia">Multimedia: ${log.multimedia.filename}</div>`;
            content += `<img src="../../${relativePath}" class="message-image" alt="Imagen">`;
        }

        content += `<button class="reply-btn btn btn-secondary" data-log='${JSON.stringify(log)}'>Responder</button>`;

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
