
const KEY = 'c1LJuR0Bl2y02PefaQ2d8PvPnBKEN8KdhAOFYR_Bgmw';

// things that toggle between liverpool and lyon
const liverPool = {
	formURL:'https://forms.office.com/Pages/ResponsePage.aspx?id=zTRAbSVyck-4U5H-rqZJGb5R086JKX1Dr4bzttc1Kn9UN1daUkVQRVRGMURaWk8yRjJHN0dPMVgxQi4u',
	csvURL:'./Business Responses.csv',
	panelTitle:'Giving back to local businesses during lockdown',
	panelP1:`This map of Liverpool shows you <strong>which businesses remain open during lockdown</strong> and still deliver food and goods locally. <strong>If you are a Liverpool-based business owner</strong> and want to be included, use the submission form below.`,
	submitBtnText:'Submit your business',
	panelP2:`HERE's new give-back solution, <strong>HERE WeGo Deliver, streamlines complex multi-stop deliveries and can help small 
businesses like yours</strong> transition to a high-demand delivery model. <strong>Free access to the HERE WeGo Deliver</strong> app will 
be extended next year. It now has new features, including <strong>availability in 11 different languages, set-up for 
contactless deliveries, tour export</strong> in CSV format and a comfortable order import assistant.`,
	wegoBtnText:'Get HERE WeGo Deliver for free',
	openHoursText:'Open Hours',
	addressText:'Address',
	deliveryText:'Delivery?',
	contactlessText:'Contactless Delivery?',
	curbsideText:'Curbside Pickup?',
	center: {
		lat: 53.41005, lng: -2.9784 
	}
}

const lyon = {
	formURL:'https://forms.office.com/Pages/ResponsePage.aspx?id=zTRAbSVyck-4U5H-rqZJGb5R086JKX1Dr4bzttc1Kn9UQk9VTVpLRU9BNExYR1dKSTlEVlhWQjdTQi4u',
	csvURL:'./Business Responses.csv',
	panelTitle:'Soutenir les commerces de proximité pendant le confinement',
	panelP1:`Cette carte de Lyon montre les entreprises qui continuent leur activité pendant le confinement et maintiennent les livraisons à domicile. Si vous êtes propriétaire d'une entreprise basée à Lyon, utilisez notre formulaire pour ajouter votre commerce sur la carte.`,
	submitBtnText:'Submit le business',
	panelP2:`Pour vous aider pendant cette période difficile, nous avons également lancé une solution pour planifier vos livraisons et faire face à l’augmentation des demandes. Avec HERE WeGo Deliver, mobilisez votre personnel et lancez rapidement et simplement votre propre service de livraison.
L’application est gratuite`,
	wegoBtnText:'Lancer HERE WeGo Deliver',
	openHoursText:'Le Open Hours',
	addressText:'Le Address',
	deliveryText:'Le Delivery?',
	contactlessText:'Le Contactless Delivery?',
	curbsideText:'Le Curbside Pickup?',
	center: {
		lat: 45.763420, lng: 4.834277 
	}

}

let formURL;
let csvURL;
let openHoursText, addressText, deliveryText, contactlessText, curbsideText;
let locale, center;

document.addEventListener('DOMContentLoaded', init, false);

let map, icon, group;

const icons = {
	fallback: new H.map.Icon('icons/lui-icon-destinationpin-onlight-solid-medium.png'),
	dining: new H.map.Icon('icons/lui-icon-eatanddrink-onlight-solid-medium.png'),
	business: new H.map.Icon('icons/lui-icon-shopping-onlight-solid-medium.png'),
	coffee: new H.map.Icon('icons/lui-icon-coffee-onlight-solid-medium.png'),
	bar: new H.map.Icon('icons/lui-icon-bar-onlight-solid-medium.png'),
	fastfood: new H.map.Icon('icons/lui-icon-foodpizza-onlight-solid-medium.png')
}

/* hack way to get liverpool vs lyon */
function getLocale() {
	if(window.location.href.indexOf('lyon') >= 0 || window.location.search.indexOf('fr') >= 0) return 'fr';
	return 'en';
}

async function init() {

	locale = getLocale();
	console.log('locale', locale);
	
	let localInfo = liverPool;
	if(locale !== 'en') localInfo = lyon;

	formURL = localInfo.formURL;
	csvURL = localInfo.csvURL;
	document.querySelector('#panelTitle').innerHTML = localInfo.panelTitle;
	document.querySelector('#panelP1').innerHTML = localInfo.panelP1;
	document.querySelector('#gotoFormBtn').innerHTML = localInfo.submitBtnText;
	document.querySelector('#panelP2').innerHTML = localInfo.panelP2;
	document.querySelector('#wegoBtn').innerHTML = localInfo.wegoBtnText;
	openHoursText = localInfo.openHoursText;
	addressText = localInfo.addressText;
	deliveryText = localInfo.deliveryText;
	contactlessText = localInfo.contactlessText;
	curbsideText = localInfo.curbsideText;
	center = localInfo.center;

	document.querySelector('#gotoFormBtn').addEventListener('click', e => {
		document.location.href = formURL;
	});

	document.querySelector('#wegoBtn').addEventListener('click', e => {
		document.location.href = 'https://wegodeliver.here.com/?cid=here.com-cta';
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
			center,
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

	group.addEventListener('tap', evt => {
		ui.getBubbles().forEach(bub => ui.removeBubble(bub));
				
		var bubble =  new H.ui.InfoBubble(evt.target.getGeometry(), {
			content: evt.target.getData()
		});
		// show info bubble
		ui.addBubble(bubble);
		//center map maybe? no, not now
		//map.getViewModel().setLookAtData({position: evt.target.getGeometry()});
	}, false);

	console.log(data);
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

				//remove if no location
				results = results.filter(r => {
					return !!r.location.lat;
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
	if(type.toLowerCase().indexOf('food') >= 0) return 'dining';
	if(type.toLowerCase().indexOf('restaurant') >= 0) return 'dining';
	if(type.toLowerCase().indexOf('bar') >= 0) return 'bar';

	console.log('fallback due to unrecognize type',type);
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
${openHoursText}: ${info.openHours}<br/>
${addressText}: ${info.address}<br/>`;
	if(info.url) html += `<img src="icons/lui-icon-information-onlight-solid-medium.png"> <a href="${info.url}" target="_new">${linkShort(info.url)}</a><br/>`;
	if(info.phone) html += `<img src="icons/lui-icon-phone-onlight-solid-medium.png" >  ${info.phone}<br/>`;
	if(info.instagram) html += `<img src="icons/instagram-logo.png"> <a href="${info.instagram}" target="_new">${linkShort(info.instagram)}</a><br/>`;
	if(info.twitter) html += `<img src="icons/twitter_logo.png"> <a href="${info.twitter}" target="_new">${linkShort(info.twitter)}</a><br/>`;
	if(info.facebook) html += `<img src="icons/fb_logo.png"> <a href="${info.facebook}" target="_new">${linkShort(info.facebook)}</a><br/>`;

	html += `
</p>

<p>
${deliveryText} ${info.delivery}<br/>
${contactlessText} ${info.contactless}<br/>
${curbsideText} ${info.curbside}
</p>
</div>
	`;
	marker.setData(html);
	group.addObject(marker);

}

function linkShort(s) {
	return s.replace('https://', '');
}