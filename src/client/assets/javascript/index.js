
// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	custom_names: ['Steve', 'Creeper', 'Skeleton', 'Spider', 'Ender Dragon'],
	custom_tracks: [{custom_name:'Mountains',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/allinonemovie-201131/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=655158">allinonemovie</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=655158">Pixabay</a>'},{custom_name:'Island',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/francois_bellay-3621440/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1870748">François Bellay</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1870748">Pixabay</a>'},{custom_name:'Port',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/francois_bellay-3621440/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1889477">François Bellay</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1889477">Pixabay</a>'},{custom_name:'Plains',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/chickenonline-616783/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=669303">Chickenonline</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=669303">Pixabay</a>'},{custom_name:'Farm',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/allinonemovie-201131/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=2873197">allinonemovie</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=2873197">Pixabay</a>'},{custom_name:'Hills',image_credit:'Image by <a id="image-credit" href="https://pixabay.com/users/alexander-divos-4234251/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1970876">Alexander Divos</a> from <a id="image-credit" href="https://pixabay.com/?utm_source=link-attribution&amp;utm_medium=referral&amp;utm_campaign=image&amp;utm_content=1970876">Pixabay</a>'}]
}

// Wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad();
	setupClickHandlers();
})

const onPageLoad = () => {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks);
				renderAt('#tracks', html);
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers);
				renderAt('#racers', html);
			})
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

const setupClickHandlers = () => {
	document.addEventListener('click', function(event) {
		const { target } = event;

		// Biome form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		}

		// Racer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();
	
			// start race
			handleCreateRace(store.custom_tracks[store.track_id - 1]);
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target);
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace(track_name) {
	// render starting UI
	renderAt('#race', renderRaceStartView(track_name));
	document.querySelector('header').style.backgroundImage = `url("../assets/images/${store.custom_tracks[store.track_id - 1].custom_name}.jpg")`


	// Get player_id and track_id from the store
	const { player_id, track_id } = store;
	
	// Invoke the API call to create the race, then save the result
	const race = await createRace(player_id, track_id);

	// Update the store with the race id
	store.race_id = race.ID;

	// The race has been created, now start the countdown
	// Call the async function runCountdown
	const countdownComplete = await runCountdown();

	// Call the async function startRace
	const raceStarted = await startRace(store.race_id - 1);

	// Call the async function runRace
	runRace(store.race_id);
}

const runRace = (raceID) => {
	return new Promise(resolve => {

		const lookupRaceInfo = () => {

			getRace(raceID - 1)
			.then(data => {
				if(data.status === 'in-progress') {
					renderAt('#leaderBoard', raceProgress(data.positions));
				}
				if(data.status === 'finished') {
					clearInterval(raceInfoInterval);
					renderAt('#race', resultsView(data.positions));
					resolve(data);
				}
			})
		}

		const raceInfoInterval = setInterval(lookupRaceInfo, 500);
	})
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise(resolve => {
			// Use Javascript's built in setInterval method to count down once per second

			const decrementTimer = () => {
				if(timer === 0) {
					clearInterval(countdownInterval);
					resolve();
				} else {
					document.getElementById('big-numbers').innerHTML = --timer;
				}
			}

			const countdownInterval = setInterval(decrementTimer, 1000);
		})
	} catch(error) {
		console.log('runCountdown ', error);
	}
}

const handleSelectPodRacer = (target) => {

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected racer to the store
	store.player_id = target.id;
}

const handleSelectTrack = (target) => {

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected');
	if(selected) {
		selected.classList.remove('selected');
	}

	// add class selected to current target
	target.classList.add('selected');

	// save the selected track id to the store
	store.track_id = target.id;

	document.querySelector('header').style.backgroundImage = `url("../assets/images/${target.innerText}.jpg")`

	renderAt('#image-credit-container', store.custom_tracks[store.track_id - 1].image_credit);

}

const handleAccelerate = () => {
	console.log("accelerate button clicked");
	// TODO - Invoke the API call to accelerate
	accelerate(store.race_id - 1);
}

// HTML VIEWS ------------------------------------------------

const renderRacerCars = (racers) => {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

const renderRacerCard = (racer) => {
	const { id, driver_name, top_speed, acceleration, handling } = racer;
	const custom_name = store.custom_names[id - 1];

	return `
		<li class="card podracer" id="${id}">
			<h3>${custom_name}</h3>
			<p>Top speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

const renderTrackCards = (tracks) => {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('');

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

const renderTrackCard = (track) => {
	const { id, name } = track;
	const custom_name = store.custom_tracks[id - 1].custom_name;

	return `
		<li id="${id}" class="card track">
			<h3>${custom_name}</h3>
		</li>
	`
}

const renderCountdown = (count) => {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

const renderRaceStartView = (track, racers) => {
	return `
		<header>
			<div class="container">
				<h1 class="text-center mb-5">${track.custom_name}</h1>
				<div class="jumbotron text-center" id="leaderBoard">${renderCountdown(3)}</div>
			</div>
		</header>
	`
}

const resultsView = (positions) => {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1);

	setTimeout(() => document.querySelector('#hidden-accelerate').style.display = 'none', 200)
	

	return `
		<header>
			<div class="jumbotron text-center">
				<h2 class="display-4 text-dark">Race Results</h2>
				${raceProgress(positions)}
				<hr class="my-4">
				<a class="btn btn-primary btn-lg btn-block" href="/race">Start a new race</a>
			</div>
		</header>
	`
}

const raceProgress = (positions) => {
	
	let playerPositions = positions
	.map(obj => {
		const results = obj;
		obj.driver_name = store.custom_names[obj.id - 1];
		return results;
	});

	const userPlayer = positions.find(e => e.id === Number(store.player_id));

	userPlayer.driver_name += " (you)";

	playerPositions = playerPositions.sort((a, b) => (a.segment > b.segment) ? -1 : 1);
	let count = 1;

	const results = playerPositions.map(p => {
		return `
			<li class="list-group-item">${count++}: ${p.driver_name}</li>
		`
	}).join('')

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				<ul class="list-group">
					${results}
				</ul>
				<div id="hidden-accelerate">
					<button id="gas-peddle" type="button" class="btn btn-primary btn-lg btn-block mt-3">ACCELERATE (click to win)</button>
				</div>
			</section>
		</main>
	`
}

const renderAt = (element, html) => {
	const node = document.querySelector(element);

	node.innerHTML = html;
}


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}


function getTracks() {
	return fetch(`${SERVER}/api/tracks`)
	.then(res => res.json())
	.catch(err => console.log("Problem with getTracks request::", err))
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`)
	.then(res => res.json())
	.catch(err => console.log("Problem with getRacers request::", err))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`)
	.then(res => res.json())
	.catch(err => console.log("Problem with getRace request::", err))
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.then(res => res)
	.catch(err => console.log("Problem with startRace request::", err))
}

function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts()
	})
	.then(data => data)
	.catch(err => console.log("Problem with accelerate request::", err))
}

