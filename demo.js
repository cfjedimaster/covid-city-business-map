const KEY = 'c1LJuR0Bl2y02PefaQ2d8PvPnBKEN8KdhAOFYR_Bgmw';
const sheetURL = 'https://spreadsheets.google.com/feeds/cells/1-YPlOIC6AxynitIiitrQ08oxzXxtgeCvsQFa3bmcYsQ/1/public/full?alt=json';

document.addEventListener('DOMContentLoaded', init, false);

let map, icon, group;

async function init() {
	var platform = new H.service.Platform({
		'apikey': KEY
	});

	// Obtain the default map types from the platform object:
	let defaultLayers = platform.createDefaultLayers();

	map = new H.Map(
		document.getElementById('mapContainer'),
		defaultLayers.vector.normal.map,
		{
			zoom: 12,
			center: { lat: 53.41005, lng: -2.9784 },
			pixelRatio: window.devicePixelRatio || 1
		}
	);


	let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
	let ui = H.ui.UI.createDefault(map, defaultLayers);

	icon = new H.map.Icon('cart.png');

	group = new H.map.Group();
	map.addObject(group);

	group.addEventListener('tap', evt => {

		ui.getBubbles().forEach(bub => ui.removeBubble(bub));
		// event target is the marker itself, group is a parent event target
		// for all objects that it contains
		var bubble =  new H.ui.InfoBubble(evt.target.getGeometry(), {
			// read custom data
			content: evt.target.getData()
		});
		// show info bubble
		ui.addBubble(bubble);
	}, false);

	let data = await loadData();
	console.log('i have '+data.length+' records to show');
	console.log(data[0]);
	data.forEach(d => {
		let location = { lat: parseFloat(d.lat,10), lng:parseFloat(d.lng,10) };
		let info = { 
			name: d["Name"], 
			address: d["Address"], 
			openHours:d["Opening Hours"],
			contactless:d["Do you offer contactless delivery?"],
			curbside:d["Do you offer curbside pickup?"],
			delivery:d["Do you offer delivery?"]
		}
		addLocation(location, info);
	});

}


async function loadData() {
	let resp = await fetch(sheetURL);
	let data = await resp.json();
	let entries = data.feed.entry;
	
	const numCols = 10;
	const columns = entries.slice(0, numCols).map((x) => x.content.$t);
	
	const tableCells = entries.slice(numCols, entries.length);
	let output = [];
	/*
	Notes for Ray tomorrow, 
	each item in tableCells is - wait for it, a cell, but we have no entry for blank cells
	so new logic will be keep track of current row via cell title, which is A1, B1, etc,
	and the number is the row. So new logic will simply do this for each
	Nope, cuz cell.gs$cell has a row and col val
	*/

	for(let i=0;i<tableCells.length;i++) {
		let cell = tableCells[i];
		let col = parseInt(cell.gs$cell.col,10);
		let row = parseInt(cell.gs$cell.row,10);

		if(!output[row-2]) {
			let newRow = {};
			columns.forEach(c => newRow[c] = '');
			output[row-2] = newRow;
		}

		output[row-2][columns[col-1]] = cell.content.$t;
	}

	/*
	we now have blank rows - but we can easily filter to just approved = true
	*/
	return output.filter(c => c.approved === 'TRUE');
	
}

function addLocation(location, info) {
	console.log(location, info);
	let marker = new H.map.Marker({lat:location.lat, lng:location.lng}, { icon:icon});
	let html = `
<div class='info'>
<p>
<strong>Name: ${info.name}</strong><br/>
Open Hours: ${info.openHours}<br/>
Address: ${info.address}<br/>
</p>

<p>
Delivery? ${info.delivery}<br/>
Contactless Delivery? ${info.contactless}<br/>
Curbside Pickup? ${info.curbside}
</p>
</div>
	`;
	marker.setData(html);
//	map.addObject(marker);
	group.addObject(marker);

}

