/**
 * FitPulse Chart Visualization Module using Chart.js
 */

let weeklyTrendsChartInstance = null;
let typeBreakdownChartInstance = null;

function renderWeeklyTrendsChart(weeklyData) {
    const ctx = document.getElementById("weeklyTrendsChart");
    if (!ctx) return;

    const labels = weeklyData.map(d => `${d.day} (${d.date.slice(5)})`);
    const stepsData = weeklyData.map(d => d.steps);
    const caloriesData = weeklyData.map(d => d.calories);

    if (weeklyTrendsChartInstance) {
        weeklyTrendsChartInstance.destroy();
    }

    const isDark = document.body.classList.contains("dark-theme");
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    const textColor = isDark ? "#94a3b8" : "#475569";

    weeklyTrendsChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Steps",
                    data: stepsData,
                    backgroundColor: "rgba(16, 185, 129, 0.75)",
                    borderColor: "#10b981",
                    borderWidth: 1.5,
                    borderRadius: 6,
                    yAxisID: "ySteps"
                },
                {
                    label: "Calories (kcal)",
                    data: caloriesData,
                    type: "line",
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249, 115, 22, 0.15)",
                    borderWidth: 3,
                    pointBackgroundColor: "#f97316",
                    pointRadius: 4,
                    tension: 0.35,
                    yAxisID: "yCalories",
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: "index",
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
                    bodyFont: { family: 'Plus Jakarta Sans', size: 12 }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
                },
                ySteps: {
                    type: "linear",
                    position: "left",
                    title: { display: true, text: "Steps Count", color: "#10b981", font: { size: 11, weight: 'bold' } },
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                yCalories: {
                    type: "linear",
                    position: "right",
                    title: { display: true, text: "Calories (kcal)", color: "#f97316", font: { size: 11, weight: 'bold' } },
                    grid: { drawOnChartArea: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

function renderTypeBreakdownChart(typeData) {
    const ctx = document.getElementById("typeBreakdownChart");
    if (!ctx) return;

    let labels = [];
    let counts = [];

    if (typeData && typeData.length > 0) {
        labels = typeData.map(t => t.activity_type);
        counts = typeData.map(t => t.count);
    } else {
        labels = ["No Data"];
        counts = [1];
    }

    if (typeBreakdownChartInstance) {
        typeBreakdownChartInstance.destroy();
    }

    const palette = [
        "#10b981", // Emerald
        "#06b6d4", // Cyan
        "#f97316", // Orange
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#6366f1", // Indigo
        "#eab308"  // Yellow
    ];

    const isDark = document.body.classList.contains("dark-theme");
    const textColor = isDark ? "#f8fafc" : "#0f172a";

    typeBreakdownChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: palette.slice(0, labels.length),
                borderWidth: 2,
                borderColor: isDark ? "#1e293b" : "#ffffff",
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw} session(s)`;
                        }
                    }
                }
            },
            cutout: "68%"
        }
    });
}
