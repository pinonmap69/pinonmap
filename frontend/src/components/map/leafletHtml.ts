export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  color?: string;
}

export interface LeafletOptions {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  showUser?: boolean;
  pickMode?: boolean; // shows a single draggable pin the user can move
}

export function buildLeafletHtml(opts: LeafletOptions): string {
  const { center, zoom = 12, markers = [], showUser = false, pickMode = false } = opts;
  const markersJson = JSON.stringify(markers);
  const centerJson = JSON.stringify(center);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background:#e8eef3; }
    .pin-dot { background:#2D7FF9; width:16px; height:16px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 0 2px rgba(45,127,249,0.4); }
    .user-dot { background:#3EC7B8; width:14px; height:14px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 0 6px rgba(62,199,184,0.25); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function send(obj){
      var s = JSON.stringify(obj);
      if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(s); }
      else if (window.parent) { window.parent.postMessage(s, '*'); }
    }
    var center = ${centerJson};
    var markers = ${markersJson};
    var pickMode = ${pickMode ? 'true' : 'false'};
    var showUser = ${showUser ? 'true' : 'false'};

    var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([center.lat, center.lng], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    function pinIcon(color){
      return L.divIcon({ className:'', html:'<div class="pin-dot" style="background:'+(color||'#2D7FF9')+'"></div>', iconSize:[16,16], iconAnchor:[8,8] });
    }

    if (showUser) {
      var userMarker = L.marker([center.lat, center.lng], { icon: L.divIcon({ className:'', html:'<div class="user-dot"></div>', iconSize:[14,14], iconAnchor:[7,7] }) }).addTo(map);
    }

    if (pickMode) {
      var picked = L.marker([center.lat, center.lng], { draggable: true, icon: pinIcon('#FF9F43') }).addTo(map);
      picked.on('dragend', function(e){ var ll = e.target.getLatLng(); send({ type:'mapPress', lat: ll.lat, lng: ll.lng }); });
      map.on('click', function(e){ picked.setLatLng(e.latlng); send({ type:'mapPress', lat: e.latlng.lat, lng: e.latlng.lng }); });
    } else {
      var group = [];
      markers.forEach(function(m){
        var mk = L.marker([m.lat, m.lng], { icon: pinIcon(m.color) }).addTo(map);
        if (m.title) mk.bindPopup(m.title);
        mk.on('click', function(){ send({ type:'markerPress', id: m.id }); });
        group.push([m.lat, m.lng]);
      });
      if (group.length > 1) { try { map.fitBounds(group, { padding:[40,40], maxZoom: 14 }); } catch(e){} }
    }

    send({ type:'ready' });
  </script>
</body>
</html>`;
}
