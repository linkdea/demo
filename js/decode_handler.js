'use strict';

var wmdict = undefined;
fetch('data/wm_cta.json')
.then((response) => response.json())
.then((json) => {
    wmdict = json;
});

var wm_title = document.getElementById('wm_title');
var wm_description = document.getElementById('wm_description');
var wm_creatives = document.getElementById('wm_creatives');
var wm_link = document.getElementById('wm_link');
var wm_app = document.getElementById('wm_app');
var wm_map = document.getElementById('wm_map');

wm_link.style.display = 'none';
wm_app.style.display = 'none';
wm_map.style.display = 'none';

var is_first_time = true;

linkdea_wm_decoder((decoded) => {

    function updatePage(wmmeta){
        wm_title.innerHTML = wmmeta['title'];
        wm_description.innerHTML = wmmeta['description'];
        wm_creatives.style.display = (wmmeta['src'] === "") ? 'none' : 'block';

        wm_link.style.display =(wmmeta['url_learn'] === "#") ? 'none' : 'block';
        wm_app.style.display = (wmmeta['url_app'] === "#") ? 'none' : 'block';
        wm_map.style.display = (wmmeta['url_map'] === "#") ? 'none' : 'block';

        wm_creatives.src = wmmeta['src'];
        wm_link.innerHTML =`<a href="${wmmeta['url_learn']}" >Learn More</a>`;
        wm_app.innerHTML = `<a href="${wmmeta['url_app']}" >App Store</a>`;
        wm_map.innerHTML = `<a href="${wmmeta['url_map']}" >Apple Map</a>`;
    }

    if (is_first_time) {
        is_first_time = false;
        let localObj = localStorage.getItem("saved_wm_meta")
        if (localObj !== null){
            wmmeta = JSON.parse(localObj);
            updatePage(wmmeta);
        }
    }

    if (decoded in wmdict){
        var wmmeta = wmdict[decoded];
        updatePage(wmmeta);
        localStorage.setItem("saved_wm_meta", JSON.stringify(wmmeta));
    }

});
