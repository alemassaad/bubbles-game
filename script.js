'use strict';

//canvas elements
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//game elements
const scoreElement = document.getElementById('scorenumvalue');
let score = 0;
const startElement = document.getElementById('startbutton');
const menuElement = document.getElementById('menu');
const scoreDisplay = document.getElementById('scoredisplay');
const uSuck = document.getElementById('usuck');
const themesButton = document.getElementById('themesbutton');

//theme elements
let backgroundColor = 'rgba(0, 0, 0, 0.1)';
let enemiesColor = 'rgb(0, 255, 26)';
let projectilesColor = 'white';
let buttonsColor = 'rgb(6, 149, 20)';
let scoreColor = 'black';

//object classes
class Player{
    constructor(x, y, radius, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    };
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    };
};
class Projectile{
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    };
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    };
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    };
};
class Enemy{
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    };
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    };
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    };
};
const friction = 0.98; //speed at which particles fade
class Particle{
    constructor(x, y, radius, color, velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    };
    draw(){
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    };
    update(){
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= .01;
    };
};

//initiating game
let player = new Player(canvas.width/2, canvas.height/2, 12, projectilesColor);
let projectiles = [];
let enemies = [];
let particles = [];
//restarting game
function init(){
    player = new Player(canvas.width/2, canvas.height/2, 12, projectilesColor);
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreElement.innerHTML = score;
    uSuck.style.display = 'block';
    startElement.innerHTML = 'Play again!';
};

//generating enemies
function spawnEnemies(){
    setInterval(
        function(){
            //random radius between 5 and 50
            const radius = Math.random() * (50 - 15) + 15;
            //position random but from the sides
            let x = undefined;
            let y = undefined;
            if(Math.random() < 0.5){
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            }else{
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
            };
            //other parameters
            const color = enemiesColor;
            const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
            const velocity = {x: 0.8*Math.cos(angle), y: 0.8*Math.sin(angle)};
            enemies.push(new Enemy(x, y, radius, color, velocity));
        }, Math.random()*(2500 - 800) + 800); //frequency of spawning (in ms)
};

//display function
function display(){
    ctx.fillStyle = backgroundColor; //transparency controls the shading/tailing effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
};
//main animation loop
let animationId = undefined;
function animate(){
    animationId = requestAnimationFrame(animate);
    display();
    //particles management
    particles.forEach(function (particle, idx){
        //removing dead particles
        if(particle.alpha <= 0){
            particles.splice(idx, 1);
        }else{
            particle.update();
        };
    });
    //projectiles management
    projectiles.forEach(function(projectile, idx){
        projectile.update();
        //removing far projectiles (when offscreen)
        if( projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ){
            setTimeout(function(){
                projectiles.splice(idx, 1);
            });
        };
    });
    //enemies management
    enemies.forEach(function(enemy, enemy_idx){
        enemy.update();
        //game over (when enemy touches player)
        const player_dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if(player_dist - enemy.radius - player.radius < 1){
            cancelAnimationFrame(animationId);
            menuElement.style.display = 'flex';
            scoreDisplay.innerHTML = score;
        };
        //projectile-enemy collisions
        projectiles.forEach(function(projectile, proj_idx){
            const proj_dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(proj_dist - enemy.radius - projectile.radius < 1){
                //score update
                score += 100;
                scoreElement.innerHTML = score;
                //generating particles
                for(let i = 0; i < enemy.radius * 0.7; i++){ //radius coefficient controls number of particles generated
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, projectilesColor, {
                        //velocity of particles
                        x: (Math.random() - 0.5) * (Math.random() * 5),
                        y: (Math.random() - 0.5) * (Math.random() * 5)}
                    ));
                };
                //shrinking enemies
                if(enemy.radius > 12){
                    gsap.to(enemy, {radius: enemy.radius - 7}); //using gsap module for smoother shrinking animation
                    setTimeout(function(){
                        projectiles.splice(proj_idx, 1); //removing used projectile
                    });
                //removing dead enemies
                }else{
                    setTimeout(function(){
                        enemies.splice(enemy_idx, 1);
                        projectiles.splice(proj_idx, 1); //removing used projectile
                        //score update
                        score += 250;
                        scoreElement.innerHTML = score;
                    });
                };
            };
        });
    });
};

//generating projectiles
window.addEventListener('click', function(event){
    const angle = Math.atan2(event.clientY - canvas.height/2, event.clientX - canvas.width/2);
    const velocity = {x: 7 * Math.cos(angle), y: 7 * Math.sin(angle)};
    projectiles.push(new Projectile(canvas.width/2, canvas.height/2, 5, projectilesColor, velocity));
});
//touchscreen equivalent
canvas.addEventListener('touchstart', function(event){
    const angle = Math.atan2(event.touches[0].clientY - canvas.height/2, event.touches[0].clientX - canvas.width/2);
    const velocity = {x: 7 * Math.cos(angle), y: 7 * Math.sin(angle)};
    projectiles.push(new Projectile(canvas.width/2, canvas.height/2, 5, 'white', velocity));
});

//button 'Start Game!'
startElement.addEventListener('click', function(){
    init();
    animate();
    spawnEnemies();
    menuElement.style.display = 'none';
});

//themes
const themesDict = {
    bg: ['rgba(0, 0, 0, 0.1)', 'rgb(255, 255, 255, 0.1)'],
    enm: ['rgb(0, 255, 26)', 'rgb(149, 6, 6)'],
    proj: ['white', 'black'],
    buttons: ['rgb(6, 149, 20)', 'rgb(100, 10, 3)'],
    score: ['white', 'black']
};
let themeCounter = 0;
themesButton.addEventListener('click', function(){
    let j = (themeCounter +1)%2;
    backgroundColor = themesDict.bg[j];
    enemiesColor = themesDict.enm[j];
    projectilesColor = themesDict.proj[j];
    buttonsColor = themesDict.buttons[j];
    scoreColor = themesDict.score[j];
    themeCounter = j;
    document.querySelector('body').style.backgroundColor = backgroundColor;
    let array = document.querySelectorAll('.button');
    for(let k = 0; k < array.length; k++){
        array[k].style.backgroundColor = buttonsColor;
    };
    document.getElementById('scorecounter').style.color = scoreColor;
    display();
});