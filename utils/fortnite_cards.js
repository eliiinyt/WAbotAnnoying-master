
const { createCanvas, registerFont } = require('canvas');
const path = require('path');
const fetch = require('node-fetch'); 

const fontPath = path.join(__dirname, '..', 'assets', 'genshin', 'zhcn.ttf');
try {
    registerFont(fontPath, { family: 'Genshin' });
} catch (e) {
    console.error('Error registrando fuente ig:', e);
}
const FONT_FAMILY = 'Genshin';

const API_BASE_URL = 'https://fortnite-api.com/v2/stats/br/v2';


async function getFortniteStats(username, apiKey, accountType = 'epic', timeWindow = 'lifetime') {
    if (!username || !apiKey) return null;

    const url = `${API_BASE_URL}?name=${encodeURIComponent(username)}&accountType=${accountType}&timeWindow=${timeWindow}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Error ${response.status} al obtener estadísticas.`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const playerStats = data.data;

        const overallStats = playerStats.stats.all.overall;
        const soloStats = playerStats.stats.all.solo;
        const duoStats = playerStats.stats.all.duo;
        const squadStats = playerStats.stats.all.squad;

        const formatModeStats = (modeStats, label) => ({
            label: label,
            kd: modeStats.kd,
            wins: modeStats.wins,
            kills: modeStats.kills,
            winRate: `${modeStats.winRate.toFixed(1)}%`,
            matches: modeStats.matches,
        });

        return {
            playerName: playerStats.account.name,
            totalWins: overallStats.wins,
            kd: overallStats.kd,
            winRate: `${overallStats.winRate.toFixed(1)}%`,
            level: playerStats.battlePass.level || 1, 
            
            solo: formatModeStats(soloStats, "SOLO"),
            duo: formatModeStats(duoStats, "DUO"),
            squad: formatModeStats(squadStats, "SQUAD"),
            
            total: {
                wins: overallStats.wins,
                kd: overallStats.kd,
                winRate: `${overallStats.winRate.toFixed(1)}%`,
                matches: overallStats.matches,
                kills: overallStats.kills,
            }
        };

    } catch (error) {
        console.error('Fallo en el scraper de Fortnite:', error.message);
        return null;
    }
}


function drawGlassPanel(ctx, x, y, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawBadge(ctx, text, x, y, color) {
    ctx.save();
    ctx.font = `20px "${FONT_FAMILY}"`;
    const textWidth = ctx.measureText(text).width;
    const padding = 20;
    const width = textWidth + padding * 2;
    const height = 40;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y, width, height, 20);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + height / 2);
    ctx.restore();
}

function drawStatItem(ctx, label, value, x, y) {
    ctx.fillStyle = "#aaa";
    ctx.font = `18px "${FONT_FAMILY}"`;
    ctx.textAlign = "left";
    ctx.fillText(label, x, y);
    
    ctx.fillStyle = "white";
    ctx.font = `28px "${FONT_FAMILY}"`;
    ctx.fillText(value, x, y + 35);
}

function drawStatCard(ctx, statData, x, y, width, height, accentColor) {
    drawGlassPanel(ctx, x, y, width, height);

    ctx.save();
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(x, y, 10, height, [20, 0, 0, 20]);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = accentColor;
    ctx.font = `32px "${FONT_FAMILY}"`;
    ctx.textAlign = "left";
    ctx.fillText(statData.label, x + 40, y + 50);

    const statsY = y + 110;
    const colWidth = (width - 50) / 4;

    const kdValue = statData.kd !== undefined ? statData.kd.toFixed(2) : '0.00';
    
    drawStatItem(ctx, "Wins", statData.wins, x + 40, statsY);
    drawStatItem(ctx, "K/D", kdValue, x + 40 + colWidth, statsY);
    drawStatItem(ctx, "Win %", statData.winRate, x + 40 + colWidth * 2, statsY);
    drawStatItem(ctx, "Matches", statData.matches, x + 40 + colWidth * 3, statsY);
}


async function generateFortniteCard(username, apiKey) {
    
    const stats = await getFortniteStats(username, apiKey);

    if (!stats) {
        throw new Error(`No se encontraron estadísticas para el jugador **${username}** o la API falló.`);
    }

    const width = 1280;
    const height = 720;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0c29');
    bgGradient.addColorStop(0.5, '#302b63');
    bgGradient.addColorStop(1, '#24243e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.2, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.9, 200, 0, Math.PI * 2);
    ctx.fill();


    drawGlassPanel(ctx, 50, 50, 400, 620);

    const avatarY = 150;
    ctx.save();
    ctx.beginPath();

    ctx.arc(250, avatarY, 80, 0, Math.PI * 2);
    ctx.fillStyle = '#ccc';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.font = `40px "${FONT_FAMILY}"`;
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(stats.playerName, 250, avatarY + 120); 
    ctx.shadowBlur = 0; 
    drawBadge(ctx, `Level ${stats.level}`, 250, avatarY + 170, '#FFD700');

ctx.textAlign = "center";
ctx.fillStyle = "#eee";
ctx.font = `24px "${FONT_FAMILY}"`;
ctx.fillText("Wins Totales", 250, 450);
ctx.font = `48px "${FONT_FAMILY}"`;
ctx.fillStyle = "white";
ctx.fillText(stats.totalWins, 250, 500);

ctx.fillStyle = "#eee";
ctx.font = `24px "${FONT_FAMILY}"`;
ctx.fillText("K/D Ratio", 250, 550);
ctx.font = `36px "${FONT_FAMILY}"`;
ctx.fillStyle = "white";
ctx.fillText(stats.kd.toFixed(2), 250, 590);


const gridX = 500;
const gridY = 50;
const gridWidth = 730;

drawStatCard(ctx, stats.solo, gridX, gridY, gridWidth, 180, '#4facfe');
drawStatCard(ctx, stats.duo, gridX, gridY + 200, gridWidth, 180, '#43e97b');
drawStatCard(ctx, stats.squad, gridX, gridY + 400, gridWidth, 180, '#a18cd1');
 return canvas.toBuffer();
}

module.exports = {
    generateFortniteCard
};