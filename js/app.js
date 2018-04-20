const IMAGES = [
    "awm.png", "m24.png", "aug.png", "groza.png", "mk14.png", "m249.png", "vest.png", "helmet.png"
];

const STATES = {
    closed  : 'closed',
    opened  : 'opened',
    played  : 'played'
};

const CARD_CLASSES = {
    card    : 'card',
    opened  : 'opened'
};

const SETTINGS = {
    CLOSE_ON_FAIL   : 2000, //ms = 2s
    CLOSE_ON_SUCCESS: 3000, //ms = 3s
};

class Card {

    constructor(onChangeState, canBeOpened){
        this.state          = STATES.closed;
        this.node           = null;
        this.image          = null;
        this.onChangeState  = onChangeState;
        //Method "canBeOpened" used to check: can be cell opened. For example, if we have already opeped 2 -> we cannot open 3.
        this.canBeOpened    = canBeOpened;
        this.create();
    }

    /**
     * Create a node of card (not mounted)
     */
    create(){
        this.node = document.createElement('LI');
        this.node.className = CARD_CLASSES.card;
        this.bind();
        return this.node;
    }

    getNode(){
        return this.node;
    }

    mount(parent){
        parent.appendChild(this.node);
    }

    setImage(image){
        this.image = image;
        this.update();
    }

    bind(){
        $(this.node).on('click', this.onClick.bind(this));
    }

    onClick(){
        if (this.state === STATES.played){
            return false;
        }
        if (this.canBeOpened() === false){
            return false;
        }
        switch(this.state){
            case STATES.closed:
                this.open();
                break;
            case STATES.opened:
                this.close();
                break;
        }
        this.onChangeState({
            state   : this.state,
            image   : this.image,
            instance: this
        });
    }

    /**
     * Switch to OPEN state
     */
    open(){
        this.state          = STATES.opened;
        this.node.className = CARD_CLASSES.card + ' ' + CARD_CLASSES.opened;
        this.update();
    }
    
    /**
     * Switch to CLOSE state
     */
    close(){
        this.state          = STATES.closed;
        this.node.className = CARD_CLASSES.card;
        this.update();
    }

    update(){
        switch(this.state){
            case STATES.closed:
                this.node.style.backgroundImage = 'url("./img/air.png")';
                break;
            case STATES.opened:
                this.node.style.backgroundImage = 'url("./img/' + this.image + '")';
                break;
        }
    }

    off(){
        this.state = STATES.played;
    }

    reset(){
        this.state = STATES.closed;
        this.update();
    }

}

class TurnsCounter{

    constructor(){
        this.count = 0;
        this.node = document.querySelector('#turns-counter');
        if (this.node === null){
            throw new Error(`Check your HTML, cannot find node #turns-counter`);
        }
        this._update();
    }

    up(){
        this.count += 1;
        this._update();
    }

    reset(){
        this.count = 0;
        this._update();
    }

    _update(){
        this.node.innerHTML = this.count;
    }

}
    
const RATING_BY_TURNS = [16, 24, 1000];

class Rating {

    constructor(){
        this.turns  = 0;
        this.time   = 0;
        this.rate   = 0;
        this.node   = document.querySelector('#success-counter');
        if (this.node === null){
            throw new Error(`Check your HTML, cannot find node #success-counter`);
        }
        this._update();
    }

    update(turns, time){
        this.turns  = turns;
        this.time   = time;
        this._update();
    }

    reset(){
        this.turns = 0;
        this._update();
    }

    _update(){
        let stars = -1;//10
        RATING_BY_TURNS.forEach((rate, pos) => {
            if (stars === -1 && this.turns < rate){
                stars = RATING_BY_TURNS.length - pos;
            }
        });
        //Reset content in rate-node;
        this.node.innerHTML = '';
        //Add stars to rate-node
        for (let i = stars; i > 0; i -= 1){
            const star = document.createElement('SPAN');
            star.className = 'rate-star';
            this.node.appendChild(star);
        }
        this.rate = stars;
    }

}

class TimerCounter{

    constructor() {
        this.seconds = 0;
        this.node = document.querySelector('#time-counter');
        if (this.node === null){
            throw new Error(`Check your HTML, cannot find node #time-counter`);
        }
        this.next();
    }

    next(){
        this.seconds += 1;
        this._update();
        setTimeout(this.next.bind(this), 1000);
    }

    _update(){
        const minutes = Math.floor(this.seconds / 60);
        const seconds = this.seconds % 60;
        this.node.innerHTML = 
            (minutes > 9 ? minutes : ('0' + minutes)) +
            ':' +
            (seconds > 9 ? seconds : ('0' + seconds));
    }

    reset(){
        this.seconds = 0;
    }

}

class Desk {

    constructor(onFinish){
        this.cards  = [];
        this.count  = 16;
        this.node   = document.querySelector('#desk');
        this.opened = [];
        this.onFinish       = onFinish;
        this.turnsCounter   = new TurnsCounter();
        this.timerCounter   = new TimerCounter();
        this.rating         = new Rating();
        this.matchs         = 0;
        if (this.node === null || typeof this.node === 'undefined'){
            throw new Error('Something wrong with HTML. Please be sure you have <div id="desk">... ');
        }
        this.create();
        this.setupImages();
    }

    /**
     * Fill a desk with cards
     */
    create(){
        if (this.cards.length > 0) {
            return false;
        }
        //Create cards
        for (let i = this.count - 1; i >= 0; i -= 1){
            let card = new Card(
                this.onCardChanged.bind(this),
                this.canNewCardBeOpened.bind(this)
            );
            this.cards.push(card);
        }
        //Mount cards
        this.cards.forEach((card) => {
            card.mount(this.node);
        });
    }

    _shuffle(a) {
        //injection: begin
        //https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
        //injection: end
    }

    setupImages(){
        let srcs = [];
        IMAGES.forEach((src) => {
            srcs.push(...[src,src]);
        });
        srcs = this._shuffle(srcs);
        this.cards.forEach((card, index)=>{
            card.setImage(srcs[index]);
        });
    }

    canNewCardBeOpened(){
        return this.opened.length >= 2 ? false : true;
    }

    isCardOpened(img){
        let results = false;
        this.opened.forEach((card) => {
            if (card.image === img) {
                results = true;
            }
        });
        return results;
    }

    onCardChanged(params){
        //===DEBUG MODE=============
        //this.onFinish();
        //===DEBUG MODE=============
        this.turnsCounter.up();
        this.rating.update(this.turnsCounter.count, this.timerCounter.seconds);
        if (this.opened.length === 0){
            //No opened cards
            if (params.state === STATES.opened){
                this.opened.push(params);
            }
            return true;
        }
        if (this.opened.length > 0){
            if (params.state !== STATES.opened){
                return true;
            }
            if (this.isCardOpened(params.image) === true){
                //If we have a match. Do nothing
                this.opened.push(params);
                this.offOpened();
                this.matchs += 1;
                if (this.matchs === 8){
                    //It's victory
                    this.onFinish();
                }
            } else {
                //If we don't have a match
                this.opened.push(params);
                setTimeout(this.closeOpened.bind(this), SETTINGS.CLOSE_ON_FAIL);
            }
        }
    }

    closeOpened(){
        this.opened.forEach((opened)=>{
            opened.instance.close();
        });
        this.opened = [];
    }

    offOpened(){
        this.opened.forEach((opened)=>{
            opened.instance.off();
        });
        this.opened = [];
    }

    play(){

    }

    reset(){
        this.cards.forEach((card) => {
            card.reset();
        });
        this.timerCounter.reset();
        this.turnsCounter.reset();
        this.rating.reset();
        this.setupImages();
        this.matchs = 0;
    }

    getResults(){
        return {
            moves   : this.turnsCounter.count,
            seconds : this.timerCounter.seconds,
            rate    : this.rating.rate
        }
    }

    show(){
        this.node.style.opacity = '1';
    }

    hide(){
        this.node.style.opacity = '0.0001';
    }

}

class Panel{

    constructor(){
        this.count = 0;
        this.node = document.querySelector('#score-panel');
        if (this.node === null){
            throw new Error(`Check your HTML, cannot find node #score-panel`);
        }
    }

    show(){
        this.node.style.display = '';
    }

    hide(){
        this.node.style.display = 'none';
    }

}

class GreetingDialog {

    constructor(onStart){
        this.onStart = onStart;
        this.node   = document.querySelector('#greeting');
        this.bindControls();
        this.hide();
    }

    /**
     * Listeners of game buttons
     */
    bindControls(){
        const button = document.querySelector('#new-game-button');
        if (button !== null){
            button.addEventListener('click', this.onNewGameClick.bind(this));
        }
    }

    onNewGameClick(){
        this.onStart();
    }

    show(){
        this.node.style.display = 'block';
    }

    hide(){
        this.node.style.display = 'none';
    }

}

class ResultsDialog {

    constructor(onRepeat) {
        this.onRepeat = onRepeat;
        this.node   = document.querySelector('#results');
        this.bindControls();
        this.hide();
    }

    /**
     * Listeners of game buttons
     */
    bindControls(){
        const button = document.querySelector('#repeat-game-button');
        if (button !== null){
            button.addEventListener('click', this.onResetGameClick.bind(this));
        }
    }

    onResetGameClick(){
        this.onRepeat();
    }

    show(results){
        this.node.style.display = 'block';
        let node = null;
        node = document.querySelector('#res-moves');    
        node.innerHTML = results.moves;
        node = document.querySelector('#res-time');
        const minutes = Math.floor(results.seconds / 60);
        const seconds = results.seconds % 60;
        node.innerHTML = 
            (minutes > 9 ? minutes : ('0' + minutes)) +
            ':' +
            (seconds > 9 ? seconds : ('0' + seconds));
        node = document.querySelector('#res-rate');
        node.innerHTML = '';
        //Add stars to rate-node
        for (let i = results.rate; i > 0; i -= 1){
            const star = document.createElement('SPAN');
            star.className = 'rate-star';
            node.appendChild(star);
        }
    }

    hide(){
        this.node.style.display = 'none';
    }

}

class Game {

    constructor(){
        this.desk       = new Desk(this.onFinish.bind(this));
        this.greeting   = new GreetingDialog(this.onStart.bind(this));
        this.results    = new ResultsDialog(this.onRepeat.bind(this));
        this.panel      = new Panel();
        this.node       = document.querySelector('#restart-game-button');
        if (this.node === null){
            throw new Error(`Check your HTML, cannot find node #restart-game-button`);
        }
        this.node.addEventListener('click', this.onRestart.bind(this));
        this.init();
    }

    init(){
        this.panel.hide();
        this.desk.hide();
        this.greeting.show();
    }

    onStart(){
        this.panel.show();
        this.desk.show();
        this.desk.reset();
        this.greeting.hide();
    }

    onRepeat(){
        this.onStart();
        this.results.hide();
    }

    onFinish(){
        this.panel.hide();
        this.desk.hide();
        this.results.show(
            this.desk.getResults()
        );
    }

    onRestart(){
        this.desk.reset();
    }

}

//Waiting for page will be loaded fully
$().ready(() => {
    let game = new Game();
});

