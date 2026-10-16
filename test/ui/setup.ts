// jsdom-д Leaflet-ийн хойшлогдсон canvas зурлага (map устгагдсаны дараа ажиллаж алдаа өгдөг) хэрэггүй
(window as any).requestAnimationFrame = () => 0;
(window as any).cancelAnimationFrame = () => {};
