'use strict';

var wm_title = document.getElementById('wm_title');
var wm_summary = document.getElementById('wm_summary');
var wm_subtitle = document.getElementById('wm_subtitle');
var wm_description = document.getElementById('wm_description');
var wm_creatives = document.getElementById('wm_creatives');
var wm_link = document.getElementById('wm_link');
var wm_app = document.getElementById('wm_app');
var wm_map = document.getElementById('wm_map');
var surf = document.getElementById('surf');

wm_link.style.display = 'none';
wm_app.style.display = 'none';
wm_map.style.display = 'none';

var is_first_time = true;


function updatePage(wmmeta){
    wm_title.innerHTML = wmmeta['title'];
    wm_summary.innerHTML = wmmeta['summary'];
    wm_subtitle.innerHTML = wmmeta['subtitle'];
    wm_description.innerHTML = wmmeta['description'];

    wm_summary.style.display =(wmmeta['summary'] === undefined) ? 'none' : 'block';
    wm_subtitle.style.display = (wmmeta['subtitle'] === undefined) ? 'none' : 'block';
    wm_creatives.style.display = (wmmeta['src'] === undefined) ? 'none' : 'block';
    wm_link.style.display =(wmmeta['url_learn'] === undefined) ? 'none' : 'block';
    wm_app.style.display = (wmmeta['url_app'] === undefined) ? 'none' : 'block';
    wm_map.style.display = (wmmeta['url_map'] === undefined) ? 'none' : 'block';

    if(wmmeta['src'] !== undefined ) wm_creatives.src = wmmeta['src'];
    if(wmmeta['url_learn'] !== undefined ) wm_link.innerHTML =`<a href="${wmmeta['url_learn']}" >Learn More</a>`;
    if(wmmeta['url_app'] !== undefined ) wm_app.innerHTML = `<a href="${wmmeta['url_app']}" >App Store</a>`;
    if(wmmeta['url_map'] !== undefined ) wm_map.innerHTML = `<a href="${wmmeta['url_map']}" >Apple Map</a>`;
}

aowl_decoder((decoded) => {
    if (decoded in wmdict){
        var wmmeta = wmdict[decoded];
        updatePage(wmmeta);
    }
    else{
        const url = `https://9h7mmn9x.ngrok.app/key?msg_key=${decoded}`;
        fetch(url)
        .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error('HTTP error ' + response.status);
            }
        })
        .then(data => {
            const msg_meta = JSON.parse(data.slice(1,-1));

            var wmmeta = {};
            wmmeta['title'] = msg_meta['title'];
            wmmeta['subtitle'] = msg_meta['chapter_title'];
            wmmeta['description'] =
            `
                Starts - ${msg_meta['starting_time']} <br>
                Chapter summary - ${msg_meta['summary']}. <br><br>
                Overall summary - ${msg_meta['overall_summary']}
            `;
            updatePage(wmmeta);

            wmdict[decoded] = wmmeta;
            surf.innerHTML = decoded;

        })
        .catch(error => {});
    }
});
