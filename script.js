console.log("JavaScript is running!");

const API_KEY = "AIzaSyACUP_X4i97zQK_o6irgzdsVVonqK6lTKk";
const SPREADSHEET_ID = "1Y7c8vdUF0r-3IBnn_th92SgFXg8pBWVMHXicKA5GuM0";
const RANGE = "inventory_data!A1:H";

const statusEl = document.getElementById("status");

const parseNumber = (value) => {
    if (value === undefined || value === null || value === "") {
        return 0;
    }

    const cleanValue = String(value).replace(/[$,%\s]/g, "").trim();
    const parsedValue = Number(cleanValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const parseStoreRow = (row = []) => ({
    store_id: row[0] || "",
    store_name: row[1] || "",
    region: row[2] || "",
    product_id: row[3] || "",
    inventory_level: parseNumber(row[4]),
    units_sold: parseNumber(row[5]),
    price: parseNumber(row[6]),
    last_restock_date: row[7] || ""
});

const renderDashboard = (stores) => {
    const totalStores = stores.length;
    const totalInventory = stores.reduce((total, store) => total + store.inventory_level, 0);
    const totalUnitsSold = stores.reduce((total, store) => total + store.units_sold, 0);
    const criticalStoreCount = stores.filter(store => store.inventory_level < 100).length;
    const averageInventory = totalStores > 0 ? totalInventory / totalStores : 0;
    const totalRevenue = stores.reduce((sum,store) => {
        return sum + (Number(store.units_sold) * Number(store.price));
    }, 0)

    document.getElementById("totalInventory").textContent = totalInventory.toLocaleString();
    document.getElementById("totalUnitsSold").textContent = totalUnitsSold.toLocaleString();
    document.getElementById("totalStores").textContent = totalStores.toLocaleString();
    document.getElementById("criticalStoreCount").textContent = criticalStoreCount.toLocaleString();
    document.getElementById("averageInventory").textContent = Math.round(averageInventory).toLocaleString();
    document.getElementById("totalRevenue").textContent = "$" + totalRevenue.toLocaleString();
    statusEl.textContent = "Data successfully loaded!";
};

const drawInventoryChart = (stores) => {
    const canvas = document.getElementById("inventoryChart");

    if (!canvas) {
        console.error("Inventory chart canvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        console.error("Canvas 2D context is unavailable.");
        return;
    }

    const labels = stores.map(store => store.store_name || "Store");
    const values = stores.map(store => store.inventory_level);

    const chartWidth = canvas.width;
    const chartHeight = canvas.height;
    const padding = 40;

    ctx.clearRect(0, 0, chartWidth, chartHeight);

    const maxValue = Math.max(...values, 100);
    const barWidth = (chartWidth - padding * 2) / values.length - 10;

    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(padding, padding, chartWidth - padding * 2, chartHeight - padding * 2);

    values.forEach((value, index) => {
        const x = padding + index * ((chartWidth - padding * 2) / values.length);
        const barHeight = ((value / maxValue) * (chartHeight - padding * 2));
        const y = chartHeight - padding - barHeight;

        ctx.fillStyle = "#4f46e5";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#374151";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(labels[index], x + barWidth / 2, chartHeight - 15);
    });
};

if (!API_KEY || API_KEY === "YOUR_GOOGLE_SHEETS_API_KEY") {
    statusEl.textContent = "Add a valid Google Sheets API key before running this dashboard.";
    throw new Error("Missing or placeholder Google Sheets API key.");
}

const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}?key=${API_KEY}`;

fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        return response.json();
    })
    .then(data => {
        if (!data.values || data.values.length === 0) {
            throw new Error("The Google Sheet is empty or missing data.");
        }

        const rows = data.values;
        const headers = rows[0];

        console.log("Headers:", headers);

        const stores = rows
            .slice(1)
            .filter(row => Array.isArray(row) && row.some(cell => cell !== undefined && cell !== ""))
            .map(parseStoreRow);

        if (stores.length === 0) {
            throw new Error("No valid rows were found in the inventory data.");
        }

        renderDashboard(stores);
        drawInventoryChart(stores);
    })
    .catch(error => {
        console.error(error);
        statusEl.textContent = "Error loading data.";
    });