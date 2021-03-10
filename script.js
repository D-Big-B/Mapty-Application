'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
inputType.optionValue = 'Running';
class Workout{


    constructor(coords,distance,duration){
        this.date = new Date();
        this.id = (Date.now()+'').slice(-10);
        this.coords = coords;
        this.distance= distance;
        this.duration = duration;
        this.clicks = 0 ;        
    }
    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click(){
        this.clicks++ ;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        //minutes per km
        this.pace = this.duration / this.distance;
        return this.pace
    }
}
class Cycling extends Workout{
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        //minutes per km
        this.speed = this.distance / this.duration;
        return this.speed;
    }
}

// const run1 = new Running([39,-12],5.2, 24, 178);
// const cycling1 = new Cycling([39,-12],27,95,523);

// console.log(run1,cycling1);

class App{
    _map;
    _mapEvent;
    _workouts = [];
    _mapZoomLevel = 13;
    constructor(){
         // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
        form.addEventListener('submit',this._newWorkout.bind(this));

        inputType.addEventListener('change',this._toggleElevationField.bind(this))

        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }
    _getPosition(){
    
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
            alert("Could not find your position");
        });

    }
    _loadMap(position){
        
            const {latitude} = position.coords;
            const {longitude} = position.coords;
            // console.log(latitude,longitude);

            const coords = [latitude,longitude]
            this._map = L.map('map').setView(coords, this._mapZoomLevel);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this._map);

            this._workouts.forEach(work =>{
                this._renderWorkoutMarker(work);
            })

            this._map.on('click',this._showForm.bind(this));

    }
    _showForm(mapE){
        this._mapEvent = mapE;
        form.classList.remove('hidden');
    }
    _hideForm(){
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
    
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid' , 1000);
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){
            e.preventDefault();
        // Get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDistance.value;
        const {lat,lng} = this._mapEvent.latlng;
        let workout;
        
        const validInput = (...inputs)=> inputs.every(inp => Number.isFinite(inp));

        const allPositive = (...inputs)=> inputs.every(inp => inp > 0);
        
        
        // If Workout running, create running object
        if(type === 'running'){
            const cadence = +inputCadence.value;
            //Check if data is valid
            if(
                !validInput(distance,duration,cadence)||
                !allPositive(distance,duration,cadence)
                ) 
                    return(alert('Input should be a positive number'));
            workout = new Running([lat,lng],distance,duration,cadence);
        }
        //if Workout cycling , create cycling object
        if(type === 'cycling'){
            const elevation = +inputElevation.value;
            if(
                !validInput(distance,duration,elevation)||
                !allPositive(distance,duration)
                ) 
                    return(alert('Input should be a positive number'));
            workout = new Cycling([lat,lng],distance,duration,elevation)
        }
        //Add a new object to workout array
        this._workouts.push(workout);

        //Render workout on map as marker
       this._renderWorkoutMarker(workout);
       
    
        //Render workout as list 
        this._renderWorkout(workout);
        ///Hide form and clear input fields

        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();

    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this._map)
        .bindPopup(
            L.popup({
                maxWidth : 250,
                minWidth : 100,
                autoClose : false,
                closeOnClick : false,
                className : `${workout.type}-popup`,
            })
            )
        .setPopupContent(`${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }
    _renderWorkout(workout){
        let html = 
        `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'?'🏃‍♂️':'🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if(workout.type === 'running')
            html += 
            `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `;

        if(workout.type === 'cycling')
        html += 
        `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;

        form.insertAdjacentHTML('afterend',html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl) return;

        const workout = this._workouts.find(work => work.id === workoutEl.dataset.id);

        this._map.setView(workout.coords, this._mapZoomLevel , {
            animate : true,
            pan : {
                duration : 1
            }
        });

        // workout.click();
    }    

    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this._workouts))
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;

        this._workouts = data;

        this._workouts.forEach(work =>{
            this._renderWorkout(work);
        })


    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();

    }
}


const app = new App();

    

    

    