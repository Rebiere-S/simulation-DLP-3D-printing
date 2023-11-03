let machine_time_baseExposure = document.getElementById("machine_time_baseExposure").value,
    machine_time_nonBaseExposure = document.getElementById("machine_time_nonBaseExposure").value,
    
    machine_speed_baseLayersLift = document.getElementById("machine_speed_baseLayersLift").value,
    machine_speed_nonBaseLayersLift = document.getElementById("machine_speed_nonBaseLayersLift").value,
    
    machine_layers_layerHeight = document.getElementById("machine_layers_layerHeight").value,
    machine_layers_baseLayers = document.getElementById("machine_layers_baseLayers").value,
    
    machine_heights_afterLayerLifting = document.getElementById("machine_heights_afterLayerLifting").value,
    machine_heights_partElevationFromBed = document.getElementById("partElevationFromBed").value;
    
let baseHeight = machine_layers_layerHeight * machine_layers_baseLayers,
    supportsHeightWithoutBase = machine_heights_partElevationFromBed - baseHeight,
    
    layersSupportsPartElevationFromBed = supportsHeightWithoutBase / machine_layers_layerHeight,
    
    liftingTimeAfterBaseLayer = (machine_speed_baseLayersLift / 60) * machine_heights_afterLayerLifting,
    totalLiftingTimeAfterbaseLayers = machine_layers_baseLayers * liftingTimeAfterBaseLayer,
    liftingTimeAfterNonBaseLayer = (machine_speed_nonBaseLayersLift / 60) * machine_heights_afterLayerLifting,
    totalLiftingTimeAfterSupportsLayers = layersSupportsPartElevationFromBed * liftingTimeAfterNonBaseLayer,
    totalExposureTimeBase = machine_time_baseExposure * machine_layers_baseLayers,
    totalExposureTimeSupports = machine_time_nonBaseExposure * layersSupportsPartElevationFromBed,
    totalTimePrintingPartElevationFromBed = totalLiftingTimeAfterbaseLayers + totalLiftingTimeAfterSupportsLayers + totalExposureTimeBase + totalExposureTimeSupports;

let partHeight,
    
    layersPart,
    
    totalLiftingTimeAfterPartLayers,
    totalExposureTimePart,
    totalTimePrintingPart,
    
    totalPrintingTime;


function updateValues() {
  machine_time_baseExposure = document.getElementById("machine_time_baseExposure").value,
  machine_time_nonBaseExposure = document.getElementById("machine_time_nonBaseExposure").value,
    
  machine_speed_baseLayersLift = document.getElementById("machine_speed_baseLayersLift").value,
  machine_speed_nonBaseLayersLift = document.getElementById("machine_speed_nonBaseLayersLift").value,
    
  machine_layers_layerHeight = document.getElementById("machine_layers_layerHeight").value,
  machine_layers_baseLayers = document.getElementById("machine_layers_baseLayers").value,
    
  machine_heights_afterLayerLifting = document.getElementById("machine_heights_afterLayerLifting").value,
  machine_heights_partElevationFromBed = document.getElementById("partElevationFromBed").value;
  
  
  baseHeight = machine_layers_layerHeight * machine_layers_baseLayers,
  supportsHeightWithoutBase = machine_heights_partElevationFromBed - baseHeight,
    
  layersSupportsPartElevationFromBed = supportsHeightWithoutBase / machine_layers_layerHeight,
    
  liftingTimeAfterBaseLayer = (machine_speed_baseLayersLift / 60) * machine_heights_afterLayerLifting,
  totalLiftingTimeAfterbaseLayers = machine_layers_baseLayers * liftingTimeAfterBaseLayer,
  liftingTimeAfterNonBaseLayer = (machine_speed_nonBaseLayersLift / 60) * machine_heights_afterLayerLifting,
  totalLiftingTimeAfterSupportsLayers = layersSupportsPartElevationFromBed * liftingTimeAfterNonBaseLayer,
  totalExposureTimeBase = machine_time_baseExposure * machine_layers_baseLayers,
  totalExposureTimeSupports = machine_time_nonBaseExposure * layersSupportsPartElevationFromBed,
  totalTimePrintingPartElevationFromBed = totalLiftingTimeAfterbaseLayers + totalLiftingTimeAfterSupportsLayers + totalExposureTimeBase + totalExposureTimeSupports;
  
  
  updateResults();
}


document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const contentsBuffer = event.target.result;
            const contents = new DataView(contentsBuffer);

            let results;

            if (isBinarySTL(contents)) {
                results = parseBinarySTL(contents);
            } else {
                const asciiContents = new TextDecoder().decode(contentsBuffer);
                results = parseSTL(asciiContents);
            }

            partHeight = results.dimensions.x.toFixed(2);
            document.getElementById("dimensions").value = 
              "X = " + results.dimensions.x.toFixed(2) + "mm; " +
              "Y = " + results.dimensions.y.toFixed(2) + "mm; " +
              "Z = " + results.dimensions.z.toFixed(2) + "mm";
            document.getElementById("partOrientationX").value = results.dimensions.x.toFixed(2);
            document.getElementById("partOrientationY").value = results.dimensions.y.toFixed(2);
            document.getElementById("partOrientationZ").value = results.dimensions.z.toFixed(2);
          
            document.getElementById("volume").value = results.volume.toFixed(1);
            document.getElementById("surface").value = results.surfaceArea.toFixed(1);
          
            updateResults();
        };

        reader.readAsArrayBuffer(file);
    }
});

function isBinarySTL(contents) {
    const numTriangles = contents.getUint32(80, true);
    return contents.byteLength == 84 + (50 * numTriangles);
}

function magnitude(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

function parseBinarySTL(contents) {
    const numTriangles = contents.getUint32(80, true);
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let volume = 0;
    let totalSurfaceArea = 0;

    for (let i = 0; i < numTriangles; i++) {
        const offset = 84 + (50 * i);

        const vertices = [];
        for (let j = 0; j < 3; j++) {
            const x = contents.getFloat32(offset + 12 + (j * 12), true);
            const y = contents.getFloat32(offset + 12 + (j * 12) + 4, true);
            const z = contents.getFloat32(offset + 12 + (j * 12) + 8, true);

            vertices.push({ x, y, z });

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;

            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
        }

        const AB = {
            x: vertices[1].x - vertices[0].x,
            y: vertices[1].y - vertices[0].y,
            z: vertices[1].z - vertices[0].z
        };

        const AC = {
            x: vertices[2].x - vertices[0].x,
            y: vertices[2].y - vertices[0].y,
            z: vertices[2].z - vertices[0].z
        };

        const cross = crossProduct(AB, AC);
        totalSurfaceArea += magnitude(cross) * 0.5;

        volume += dotProduct(vertices[0], cross) / 6.0;
    }

    return {
        dimensions: {
            x: maxX - minX,
            y: maxY - minY,
            z: maxZ - minZ
        },
        volume: Math.abs(volume),
        surfaceArea: totalSurfaceArea
    };
}

function parseSTL(contents) {
    const lines = contents.split("\n");
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let volume = 0;
    let totalSurfaceArea = 0;

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith("vertex")) {
            const p1 = parseVertex(lines[i]);
            const p2 = parseVertex(lines[++i]);
            const p3 = parseVertex(lines[++i]);

            minX = Math.min(minX, p1.x, p2.x, p3.x);
            minY = Math.min(minY, p1.y, p2.y, p3.y);
            minZ = Math.min(minZ, p1.z, p2.z, p3.z);
            maxX = Math.max(maxX, p1.x, p2.x, p3.x);
            maxY = Math.max(maxY, p1.y, p2.y, p3.y);
            maxZ = Math.max(maxZ, p1.z, p2.z, p3.z);

            const AB = vectorSubtract(p2, p1);
            const AC = vectorSubtract(p3, p1);

            const cross = crossProduct(AB, AC);
            totalSurfaceArea += magnitude(cross) * 0.5;

            volume += dotProduct(p1, cross) / 6.0;
        }
    }

    return {
        dimensions: {
            x: maxX - minX,
            y: maxY - minY,
            z: maxZ - minZ
        },
        volume: Math.abs(volume),
        surfaceArea: totalSurfaceArea
    };
}

function parseVertex(line) {
    const parts = line.trim().split(/\s+/);
    return {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
    };
}

function vectorSubtract(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z
    };
}

function crossProduct(v1, v2) {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}


function updatePartOrientation(value) {
  if (value) {
    partHeight = value;
    
    updateResults();
  }
}


function updateResults() {
  layersPart = partHeight / machine_layers_layerHeight,
    
  totalLiftingTimeAfterPartLayers = liftingTimeAfterNonBaseLayer * layersPart,
  totalExposureTimePart = machine_time_nonBaseExposure * layersPart,
  totalTimePrintingPart = totalLiftingTimeAfterPartLayers + totalExposureTimePart,
    
  totalPrintingTime = totalTimePrintingPartElevationFromBed + totalTimePrintingPart;
  
  
  document.getElementById("printingTime").value = splitInteger(totalPrintingTime / 3600) + " heures et " + Math.round((totalPrintingTime / 60) - (Math.round(splitInteger(totalPrintingTime / 3600)) * 60)) + " minutes";
}

function splitInteger(number) {
  return number < 0 ? Math.ceil(number) : Math.floor(number);
}