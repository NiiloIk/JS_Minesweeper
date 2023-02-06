const canvas = document.getElementById("myCanvas");
const context = canvas.getContext("2d");
const button = document.getElementById("myBtn");
const input = document.getElementById("myInput");
const teksti = document.getElementById("teksti");
const more = document.getElementById("more");
const less = document.getElementById("less");
const sizeTxt = document.getElementById("size");

let tileWidth = 20;
let tiles = 10;
let mines, CheckedPositions, adjacentMineList, flaggedPositions = [];
let cursorXPosition, cursorYPosition;
let startCheck, loseCheck;

// TODO: Miinalipun asettaminen.
// Vähemmän sekavien aloituksien poistaminen (jää varmaan tekemättä).

// Asettaa uudet miinat kentälle. Resetoi listalta vanhat säädöt yms.
function start()
{
    canvas.height = canvas.width = tileWidth * tiles;
    sizeTxt.innerHTML = tiles + "x" + tiles;
    CheckedPositions = [];
    adjacentMineList = [];
    flaggedPositions = [];
    mines = [];
    draw();
    startCheck = true;
    loseCheck = false;
}
start();

// Piirtää kaiken Canvasin sisällä.
function draw()
{  
    context.clearRect(0, 0, canvas.height, canvas.width);
    // v määrittää siis tiilien välin koon.
    let v = 1
    let h = tileWidth;

    for(let i = 0; i < tiles; i++)
    {
        for(let j = 0; j < tiles; j++)
        {
            let logicalPosition = j + (i * tiles)
            let x = h * j + v/2;
            let y = h * i + v/2;

            // Tarkistetaan onko kyseinen kohta painamaton, eikä näytä onko miina alla.    
            if (!CheckedPositions.includes(logicalPosition))
            {
                context.fillStyle = "darkgrey";
                context.fillRect(x, y, h - v, h - v);
            }
            else
            {
                // piirtää painetut laatat eri värisenä
                context.fillStyle = "grey";
                context.fillRect(x, y, h - v, h - v);

                // piirtää numerot kentälle
                if (adjacentMineList[logicalPosition] > 0)
                {
                    let text = adjacentMineList[logicalPosition];
                    context.font = "10px serif";
                    context.fillStyle = "white";
                    context.fillText(text, x + h/3, y +h/1.5);
                }
            }
            // piirtää miinat kentälle, kun pelaaja on hävinnyt.
            if (loseCheck && (mines.includes(logicalPosition)))
            {
                context.fillStyle = "red";
                context.fillRect(x + h/4, y + h/4, (h - v) / 2, (h - v) / 2);
            }
            else if (flaggedPositions.includes(logicalPosition))
            {
                context.fillStyle = "black";
                context.fillRect(x + h/3, y + h/4, (h - v) / 4, (h - v) / 2)
            }
        }
    }
}

// Asettaa miinat kentälle. Miinaa ei voida asettaa siihen mistä pelaaja on painanut.
function setMines()
{
    // vastaukset tulee 0 - max
    let tileMAX = tiles * tiles;
    let mineCount = Math.floor(tileMAX / 5);
    mines = [];
    for (let i = 0; i < mineCount; i++)
    {
        let minepos = Math.floor(tileMAX * Math.random());
        if (mines.includes(minepos) || CheckedPositions.includes(minepos))
        {
            while (mines.includes(minepos) || CheckedPositions.includes(minepos))
            {
                minepos = Math.floor(tileMAX * Math.random());
            }
        }
        mines.push(minepos);
    }
    teksti.innerHTML = "Mines: " + mineCount;
}

// Tarkistaa jokaisen "solun" vieressä olevien miinojen määrän.
function checkAdjacentMineAmount()
{
    let x;
    let amountOfAdjacentMines = 0;
    for (let y = 0; y < (tiles * tiles); y++)
    {
        for (let i = 0; i < 3; i++)
        {
            for (let j = 0; j < 3; j++)
            {
                // X:n avulla tarkastetaan, onko tällä hetkellä tarkastettava solu reunassa. Jos solu on reunassa, niin silloin ei tarkisteta "laittomasti"
                x = y % tiles;

                // oikean puolen tarkistus
                if (x == (tiles - 1) && j == 2)
                {}
                // vasemman puolen tarkistus
                else if (x == 0 && j == 0)
                {}
                else
                {
                    // Likaisen näköisen matematiikan/koodin avulla tarkastetaan numeron ympäröivät solut.
                    let tile = y - tiles + (tiles* i) - 1 + j;
                    if (mines.includes(tile)){
                        amountOfAdjacentMines += 1;
                    }
                }
            }
        }
        adjacentMineList.push(amountOfAdjacentMines);
        amountOfAdjacentMines = 0;
    }
}

// Tarkistaa viereiset numerot, ja avaa ruudun, jos siinä ei ole numeroa.
// Pitäisi parantaa hieman, mutta on vaikeaa.
function checkAdjacentNumbers(number)
{
    for (let i = 0; i < 3; i++)
    {
        for (let j = 0; j < 3; j++)
        {
            // Tässä käytetään samaa logiikkaa kuin ylemmässä checkAdjacentMineAmountissa
            let x = number % tiles;

            if (x == (tiles - 1) && j == 2)
            {}
            else if (x == 0 && j == 0)
            {}
            else
            {
                let tile = number - tiles + (tiles * i) - 1 + j;
                // ei jatka entuudestaan tarkastettujen tiilien tarkastamista, eikä näytä miinoja.
                if (tile < 0 || tile > tiles*tiles-1 || CheckedPositions.includes(tile) || mines.includes(tile))
                {}
                else
                {
                    CheckedPositions.push(tile);
                    if (adjacentMineList[tile] == 0 && !startCheck)
                    {
                        checkAdjacentNumbers(tile);
                    }
                }
            }
        }
    }
}


// Palauttaa canvaksella painamisen sijainnin ja vie sen seuraavaan funktioon.
canvas.addEventListener('mouseup', function(e) {
    const rect = canvas.getBoundingClientRect();
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    let pos = checkTile(x, y);
    if(e.button == 0) {
        leftClick(pos);
    } else if (e.button == 2)
    {
        flag(pos);
    }
    draw();
})


// Kun pelaaja painaa solusta, niin tapahtuu jotain.
function leftClick(pos)
{
    // Jos pelaaja painaa ensimmäistä kertaa, niin miinat asetetaan kentälle yms.
    if (startCheck){
        checkAdjacentNumbers(pos);
        setMines();
        CheckedPositions = [];
        startCheck = false;
        checkAdjacentMineAmount();
        checkAdjacentNumbers(pos);
    }
    // Jos tietystä kohtaa on jo painettu, mitään ei tapahdu.
    if (CheckedPositions.includes(pos))
    {}
    // Jos pelaaja koskee miinaan, niin se häviää pelin.
    else if (mines.includes(pos))
    {
        loseCheck = true;
        CheckedPositions.push(pos);
    }
    // Jos kosketussa kohdassa ei ole yhtään miinaa lähellä, niin tämä avaa kaikki viereiset numerot.
    else if (adjacentMineList[pos] == 0) {
        checkAdjacentNumbers(pos);
    }
    else{
        CheckedPositions.push(pos);
    }

    // voitontarkastus
    if (tiles * tiles == CheckedPositions.length + mines.length)
    {
        teksti.innerHTML = "You won."
    }
}
function flag(pos) {
    if (!flaggedPositions.includes(pos))
    {
        flaggedPositions.push(pos);
    }
    else{
        let index = flaggedPositions.indexOf(pos);
        flaggedPositions.splice(index, 1);
    }
}

// Tarkistaa painetun "solun" numeron ja palauttaa sen
function checkTile(X, Y)
{
    let pos = 0;
    let Xpos = Math.floor(X / tileWidth);
    let Ypos = Math.floor(Y / tileWidth);
    pos = Xpos + (Ypos * tiles);
    return pos;
}

// Muuttaa kentän koon, kun painaa Näppäimestä "update"
button.addEventListener('click', function(){
    if (input.value == "")
    {
        start();
    }
    else{
        tiles = parseInt(input.value);
        changeSize(0);
    }
    
})

// Kentän koko +1 nappula.
more.addEventListener('click', function(){
    changeSize(1);
})

// Kentän koko -1 nappula.
less.addEventListener('click', function(){
    changeSize(-1);
})

function changeSize(sizeChange)
{
    tiles += sizeChange;
    input.value = "";
    start();
}