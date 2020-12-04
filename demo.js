const KEY = 'c1LJuR0Bl2y02PefaQ2d8PvPnBKEN8KdhAOFYR_Bgmw';
const sheetURL = 'https://spreadsheets.google.com/feeds/cells/1-YPlOIC6AxynitIiitrQ08oxzXxtgeCvsQFa3bmcYsQ/1/public/full?alt=json';
const formURL = 'https://forms.office.com/Pages/ResponsePage.aspx?id=zTRAbSVyck-4U5H-rqZJGb5R086JKX1Dr4bzttc1Kn9UN1daUkVQRVRGMURaWk8yRjJHN0dPMVgxQi4u';

const csvURL = './Business Responses.csv';
document.addEventListener('DOMContentLoaded', init, false);

let map, icon, group;

const icons = {
	fallback: new H.map.Icon('icons/lui-icon-destinationpin-onlight-solid-medium.png'),
	dining: new H.map.Icon('icons/lui-icon-eatanddrink-onlight-solid-medium.png'),
	business: new H.map.Icon('icons/lui-icon-shopping-onlight-solid-medium.png'),
	coffee: new H.map.Icon('icons/lui-icon-coffee-onlight-solid-medium.png'),
	fastfood: new H.map.Icon('icons/lui-icon-foodpizza-onlight-solid-medium.png')
}

async function init() {

	document.querySelector('#gotoFormBtn').addEventListener('click', e => {
		document.location.href = formURL;
	});

	var platform = new H.service.Platform({
		'apikey': KEY
	});

	// Obtain the default map types from the platform object:
	let defaultLayers = platform.createDefaultLayers();

	map = new H.Map(
		document.getElementById('mapContainer'),
		defaultLayers.vector.normal.map,
		{
			zoom: 13,
			center: { lat: 53.41005, lng: -2.9784 },
			pixelRatio: window.devicePixelRatio || 1
		}
	);
	window.addEventListener('resize', () => map.getViewPort().resize());


	let behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
	//todo, modify this so we dont get defaults and remove them
	var ui = H.ui.UI.createDefault(map, defaultLayers);
	ui.removeControl('zoom');
	ui.removeControl('mapsettings');
	ui.removeControl('scalebar');

	await setStyle();

	let data = await loadData();
	console.log('i have '+data.length+' records to show');

	group = new H.map.Group();
	map.addObject(group);

	group.addEventListener('pointermove', evt => {
		console.log('show bubble event');
		ui.getBubbles().forEach(bub => ui.removeBubble(bub));
		// event target is the marker itself, group is a parent event target
		// for all objects that it contains
		var bubble =  new H.ui.InfoBubble(evt.target.getGeometry(), {
			// read custom data
			content: evt.target.getData()
		});
		// show info bubble
		ui.addBubble(bubble);
		//center map maybe? no, not now
		//map.getViewModel().setLookAtData({position: evt.target.getGeometry()});

	}, false);


	data.forEach(d => {
		addLocation(d.location, d.info);
	});


}

async function setStyle() {
	const style = await fetch('mapStyle.yaml').then((res) => res.text());
	const provider = map.getBaseLayer().getProvider()
	provider.setStyle(new H.map.Style(style));
}

async function loadData() {

	return new Promise((resolve, reject) => {
		Papa.parse(csvURL, {
			download:true, 
			header:true,
			skipEmptyLines:'greedy',
			complete: output => {
				//console.log(output);
				let results = [];
				output.data.forEach(d => {
					let location = { lat: parseFloat(d["Lat"],10), lng:parseFloat(d["Lng"],10) };
					let info = { 
						name: d["Name"], 
						address: d["Address"], 
						openHours:d["Open Hours"],
						contactless:d["Contactless"],
						curbside:d["Takeaway"],
						delivery:d["Delivery"],
						url:d["URL"],
						phone:d["Phone"],
						instagram:d["Instagram"],
						facebook:d["Facebook Page"],
						twitter:d["Twitter"],
						whatsapp:d["WhatsApp"],
						businesstype:d["Type"]
					}
					info.icon = getIcon(info.businesstype);
					results.push({ location, info });
				});

				resolve(results);

			}
		});

	});
}

function getIcon(type) {
	if(type.toLowerCase().indexOf('coffee') >= 0) return 'coffee';
	if(type.toLowerCase().indexOf('fast food') >= 0) return 'fastfood';
	if(type.toLowerCase().indexOf('shopping') >= 0) return 'business';
	if(type.toLowerCase().indexOf('eating out') >= 0) return 'dining';
	//default
	return 'fallback';
}


function addLocation(location, info) {
	let marker = new H.map.Marker({lat:location.lat, lng:location.lng}, { icon:icons[info.icon]});
	let type = info.businesstype.split(' - ').pop();
	let html = `
<div class='info'>
<div class='businessName'>${info.name}</div>
<p>
${type}<br/>
Open Hours: ${info.openHours}<br/>
Address: ${info.address}<br/>`;
	if(info.url) html += `<img src="icons/lui-icon-information-onlight-solid-medium.png"> <a href="${info.url}" target="_new">${info.url}</a><br/>`;
	if(info.phone) html += `<img src="icons/lui-icon-phone-onlight-solid-medium.png" >  ${info.phone}<br/>`;
	if(info.instagram) html += `<img src="icons/instagram-logo.png"> <a href="https://www.instagram.com/${info.instagram}" target="_new">${info.instagram}</a><br/>`;
	if(info.twitter) html += `<img src="icons/twitter_logo.png"> <a href="https://www.twitter.com/${info.twitter}" target="_new">${info.twitter}</a><br/>`;
	if(info.facebook) html += `<img src="icons/fb_logo.png"> <a href="https://www.facebook.com/${info.facebook}" target="_new">${info.facebook}</a><br/>`;

	html += `
</p>

<p>
Delivery? ${info.delivery}<br/>
Contactless Delivery? ${info.contactless}<br/>
Curbside Pickup? ${info.curbside}
</p>
</div>
	`;
	marker.setData(html);
	group.addObject(marker);

}

