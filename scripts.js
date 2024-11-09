const panelSizes = {
  "50x50": { width: 50, height: 50, power: { absen: 131, naipix: 184 } },
  "50x100": { width: 50, height: 100, power: { absen: 262, naipix: 368 } }
};

const consumptionLimit = 2200;
let selectedPanels = [];
let totalPowerConsumption = 0;
let connectionLines = [];
let selectionEnabled = false;
let currentBrand = 'absen';
let panelWidth, panelHeight, panelPower;
let panelsX, panelsY;
let currentPanel = { x: 0, y: 0 };

const gridCanvas = document.getElementById("gridCanvas");
const gridCtx = gridCanvas.getContext("2d");

// Handle form submission to generate grid
document.getElementById('setupForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const screenWidth = parseFloat(document.getElementById('screenWidth').value);
  const screenHeight = parseFloat(document.getElementById('screenHeight').value);
  const panelSize = document.getElementById('panelSize').value;
  currentBrand = document.getElementById('brand').value;

  const panel = panelSizes[panelSize];
  panelWidth = panel.width;
  panelHeight = panel.height;
  panelPower = panel.power[currentBrand];

  panelsX = Math.floor(screenWidth / (panelWidth / 100));
  panelsY = Math.floor(screenHeight / (panelHeight / 100));

  // Ajustar el panel cuando se selecciona Naipix de metro y hay sobrante
  const remainingHeight = screenHeight - panelsY * (panelHeight / 100);
  if (remainingHeight > 0 && remainingHeight <= 0.5) {
    // Si hay sobrante en la altura, añadir paneles de 50x50
    panelsY += 1;
  }

  gridCanvas.width = panelsX * panelWidth;
  gridCanvas.height = panelsY * panelHeight;

  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  selectedPanels = [];
  totalPowerConsumption = 0;
  connectionLines = [];

  drawGrid(panelsX, panelsY, panelWidth, panelHeight);
});

// Function to draw the grid
function drawGrid(panelsX, panelsY, panelWidth, panelHeight) {
  gridCtx.strokeStyle = currentBrand === 'naipix' ? "blue" : "orange";
  gridCtx.lineWidth = 1;

  for (let x = 0; x < panelsX; x++) {
    for (let y = 0; y < panelsY; y++) {
      gridCtx.strokeRect(x * panelWidth, y * panelHeight, panelWidth, panelHeight);
    }
  }

  // Highlight the panel with the red border (current selection)
  gridCtx.lineWidth = 2;
  gridCtx.strokeStyle = "red";
  gridCtx.strokeRect(currentPanel.x * panelWidth, currentPanel.y * panelHeight, panelWidth, panelHeight);
}

// Handle panel selection
function handlePanelSelection(x, y) {
  const panelIndex = { x, y };

  const index = selectedPanels.findIndex(p => p.x === panelIndex.x && p.y === panelIndex.y);
  if (index === -1) {
    selectedPanels.push(panelIndex);
    totalPowerConsumption += panelPower;
  } else {
    selectedPanels.splice(index, 1);
    totalPowerConsumption -= panelPower;
  }

  if (totalPowerConsumption > consumptionLimit) {
    connectionLines.push({ panels: selectedPanels, color: getRandomColor() });
    selectedPanels = [];
    totalPowerConsumption = 0;
  }

  redrawGridWithSelections();
}

// Redraw the grid with selections
function redrawGridWithSelections() {
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  drawGrid(panelsX, panelsY, panelWidth, panelHeight);

  gridCtx.fillStyle = "green";
  selectedPanels.forEach(panel => {
    gridCtx.fillRect(panel.x * panelWidth, panel.y * panelHeight, panelWidth, panelHeight);
  });

  connectionLines.forEach(line => {
    gridCtx.strokeStyle = line.color;
    gridCtx.beginPath();
    line.panels.forEach((panel, index) => {
      const x = panel.x * panelWidth + panelWidth / 2;
      const y = panel.y * panelHeight + panelHeight / 2;
      if (index === 0) {
        gridCtx.moveTo(x, y);
      } else {
        gridCtx.lineTo(x, y);
      }
    });
    gridCtx.stroke();
  });

  document.getElementById('wireInfo').textContent = `Número de cables: ${connectionLines.length} | Consumo total: ${totalPowerConsumption}W`;
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Toggle selection mode
document.getElementById("toggleSelectionButton").addEventListener('click', function() {
  selectionEnabled = !selectionEnabled;
  this.textContent = selectionEnabled ? "Desactivar Selección" : "Activar Selección";
});

// Clear the selection
document.getElementById('clearSelectionButton').addEventListener('click', function() {
  selectedPanels = [];
  totalPowerConsumption = 0;
  connectionLines = [];
  redrawGridWithSelections();
});

// Arrow keys for selecting panels and selecting them automatically
window.addEventListener('keydown', (event) => {
  if (selectionEnabled) {
    switch (event.key) {
      case 'ArrowUp':
        if (currentPanel.y > 0) currentPanel.y--;
        break;
      case 'ArrowDown':
        if (currentPanel.y < panelsY - 1) currentPanel.y++;
        break;
      case 'ArrowLeft':
        if (currentPanel.x > 0) currentPanel.x--;
        break;
      case 'ArrowRight':
        if (currentPanel.x < panelsX - 1) currentPanel.x++;
        break;
    }

    // Automatically select the panel as you move
    handlePanelSelection(currentPanel.x, currentPanel.y);

    redrawGridWithSelections();
  }
});

// Mouse click for panel selection
gridCanvas.addEventListener('click', (event) => {
  if (selectionEnabled) {
    const rect = gridCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / panelWidth);
    const y = Math.floor((event.clientY - rect.top) / panelHeight);
    handlePanelSelection(x, y);
    currentPanel = { x, y };  // Update the current position for keyboard navigation
  }
});
