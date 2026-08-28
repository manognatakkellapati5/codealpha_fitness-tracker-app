/**
 * FitPulse Main Application Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // App State
    const state = {
        selectedDate: new Date().toISOString().split("T")[0],
        goals: { step_goal: 10000, calorie_goal: 600, active_minutes_goal: 45, water_goal_ml: 2500 },
        dailySummary: null,
        activities: [],
        filterType: "ALL",
        searchQuery: ""
    };

    // DOM Elements
    const datePicker = document.getElementById("selected-date-picker");
    const btnToday = document.getElementById("btn-today");
    const btnToggleTheme = document.getElementById("btn-toggle-theme");

    // Modal Elements
    const modalLogActivity = document.getElementById("modal-log-activity");
    const modalSetGoals = document.getElementById("modal-set-goals");
    const btnOpenActivityModal = document.getElementById("btn-open-activity-modal");
    const btnOpenGoalsModal = document.getElementById("btn-open-goals-modal");
    const btnCloseActivityModal = document.getElementById("btn-close-activity-modal");
    const btnCloseGoalsModal = document.getElementById("btn-close-goals-modal");
    const btnCancelActivity = document.getElementById("btn-cancel-activity");
    const btnCancelGoals = document.getElementById("btn-cancel-goals");
    const formLogActivity = document.getElementById("form-log-activity");
    const formSetGoals = document.getElementById("form-set-goals");

    // Table & Filter Elements
    const tableBody = document.getElementById("activities-table-body");
    const emptyState = document.getElementById("empty-state");
    const activityCountTag = document.getElementById("activity-count-tag");
    const searchInput = document.getElementById("search-activities");
    const filterTypeSelect = document.getElementById("filter-type-select");

    // Init Application
    init();

    async function init() {
        // Initialize Theme from localStorage if present
        const savedTheme = localStorage.getItem("fitpulse_theme");
        if (savedTheme === "light") {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            btnToggleTheme.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }

        // Set default date picker value
        datePicker.value = state.selectedDate;

        // Set default activity date input
        document.getElementById("activity-date").value = state.selectedDate;
        document.getElementById("activity-time").value = getCurrentTimeStr();

        // Event Listeners Setup
        setupEventListeners();

        // Load & Render Dashboard Data
        await refreshDashboard();
    }

    function getCurrentTimeStr() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
    }

    function setupEventListeners() {
        // Date Navigation
        datePicker.addEventListener("change", async (e) => {
            state.selectedDate = e.target.value;
            await refreshDashboard();
        });

        btnToday.addEventListener("click", async () => {
            state.selectedDate = new Date().toISOString().split("T")[0];
            datePicker.value = state.selectedDate;
            await refreshDashboard();
        });

        // Theme Toggle
        btnToggleTheme.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            document.body.classList.toggle("light-theme");
            const isLight = document.body.classList.contains("light-theme");
            localStorage.setItem("fitpulse_theme", isLight ? "light" : "dark");
            btnToggleTheme.innerHTML = isLight ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            refreshChartsOnly();
        });

        // Modals Toggle
        btnOpenActivityModal.addEventListener("click", () => {
            document.getElementById("activity-date").value = state.selectedDate;
            modalLogActivity.classList.remove("hidden");
        });
        btnCloseActivityModal.addEventListener("click", () => modalLogActivity.classList.add("hidden"));
        btnCancelActivity.addEventListener("click", () => modalLogActivity.classList.add("hidden"));

        btnOpenGoalsModal.addEventListener("click", () => {
            populateGoalsForm();
            modalSetGoals.classList.remove("hidden");
        });
        btnCloseGoalsModal.addEventListener("click", () => modalSetGoals.classList.add("hidden"));
        btnCancelGoals.addEventListener("click", () => modalSetGoals.classList.add("hidden"));

        // Form Submissions
        formLogActivity.addEventListener("submit", handleAddActivitySubmit);
        formSetGoals.addEventListener("submit", handleSetGoalsSubmit);

        // Water Logging Buttons
        document.querySelectorAll(".btn-water-add, .btn-quick-water").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const ml = Number(e.currentTarget.getAttribute("data-ml") || 250);
                await api.addWater(ml, state.selectedDate);
                showToast(`Logged +${ml}ml Water! 💧`);
                await refreshDashboard();
            });
        });

        // Quick Preset Log Buttons
        document.querySelectorAll(".btn-quick-add").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const button = e.currentTarget;
                const type = button.getAttribute("data-type");
                const valSteps = Number(button.getAttribute("data-val") || button.getAttribute("data-steps") || 0);
                const mins = Number(button.getAttribute("data-mins") || 0);
                const cal = Number(button.getAttribute("data-cal") || 0);

                const activityData = {
                    activity_type: type === "Steps" ? "Brisk Walk" : (type === "Run" ? "Morning Run" : "Brisk Walk"),
                    duration_minutes: mins || 15,
                    calories: cal || Math.round(valSteps * 0.04),
                    steps: valSteps,
                    distance_km: Math.round((valSteps * 0.00075) * 10) / 10,
                    date: state.selectedDate,
                    time: getCurrentTimeStr(),
                    notes: `Quick Log: ${type}`
                };

                await api.addActivity(activityData);
                showToast(`Logged quick ${type}! 🏃‍♂️`);
                await refreshDashboard();
            });
        });

        // Table Filtering & Search
        searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value.toLowerCase();
            renderActivitiesTable();
        });

        filterTypeSelect.addEventListener("change", (e) => {
            state.filterType = e.target.value;
            renderActivitiesTable();
        });
    }

    // Refresh core dashboard data & UI
    async function refreshDashboard() {
        // Fetch summary & activities for selected date
        const [summary, activities, weekly] = await Promise.all([
            api.getDailySummary(state.selectedDate),
            api.getActivities(),
            api.getWeeklySummary()
        ]);

        state.dailySummary = summary;
        state.goals = summary.goals;
        state.activities = activities;

        // Render Cards & Progress Rings
        renderKpiCards();

        // Render Table
        renderActivitiesTable();

        // Render Charts
        renderWeeklyTrendsChart(weekly.weekly_trends);
        renderTypeBreakdownChart(weekly.type_breakdown);
    }

    async function refreshChartsOnly() {
        const weekly = await api.getWeeklySummary();
        renderWeeklyTrendsChart(weekly.weekly_trends);
        renderTypeBreakdownChart(weekly.type_breakdown);
    }

    // Render KPI Metric Cards & Rings
    function renderKpiCards() {
        const s = state.dailySummary;
        const g = state.goals;

        // 1. Steps
        const steps = s.total_steps || 0;
        const stepGoal = g.step_goal || 10000;
        const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
        document.getElementById("display-steps").innerText = steps.toLocaleString();
        document.getElementById("display-steps-goal").innerText = stepGoal.toLocaleString();
        document.getElementById("display-distance").innerText = `${s.total_distance_km || (Math.round(steps * 0.00075 * 10)/10)} km`;
        document.getElementById("steps-badge").innerText = `${stepPct}%`;
        setRingOffset("ring-steps", stepPct);

        // 2. Calories
        const calories = s.total_calories || 0;
        const calorieGoal = g.calorie_goal || 600;
        const calPct = Math.min(100, Math.round((calories / calorieGoal) * 100));
        const calRemaining = Math.max(0, calorieGoal - calories);
        document.getElementById("display-calories").innerText = calories.toLocaleString();
        document.getElementById("display-calories-goal").innerText = `${calorieGoal} kcal`;
        document.getElementById("display-calories-remaining").innerText = `${calRemaining} kcal`;
        document.getElementById("calories-badge").innerText = `${calPct}%`;
        setRingOffset("ring-calories", calPct);

        // 3. Active Minutes
        const mins = s.total_active_minutes || 0;
        const minsGoal = g.active_minutes_goal || 45;
        const minsPct = Math.min(100, Math.round((mins / minsGoal) * 100));
        document.getElementById("display-minutes").innerText = mins;
        document.getElementById("display-minutes-goal").innerText = `${minsGoal} mins`;
        document.getElementById("display-workout-count").innerText = `${s.total_workouts || 0} sessions`;
        document.getElementById("minutes-badge").innerText = `${minsPct}%`;
        setRingOffset("ring-minutes", minsPct);

        // 4. Water Intake
        const water = s.water_intake_ml || 0;
        const waterGoal = g.water_goal_ml || 2500;
        const waterPct = Math.min(100, Math.round((water / waterGoal) * 100));
        document.getElementById("display-water").innerText = water.toLocaleString();
        document.getElementById("display-water-goal").innerText = waterGoal.toLocaleString();
        document.getElementById("water-badge").innerText = `${waterPct}%`;
        document.getElementById("water-bar-fill").style.width = `${waterPct}%`;
    }

    // Set SVG Ring Stroke-DashOffset
    function setRingOffset(elementId, percentage) {
        const ring = document.getElementById(elementId);
        if (!ring) return;
        const circumference = 2 * Math.PI * 45; // 282.74
        const offset = circumference - (percentage / 100) * circumference;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        ring.style.strokeDashoffset = offset;
    }

    // Render Activity History Log Table
    function renderActivitiesTable() {
        let filtered = state.activities;

        // Filter by search query
        if (state.searchQuery) {
            filtered = filtered.filter(a =>
                a.activity_type.toLowerCase().includes(state.searchQuery) ||
                (a.notes && a.notes.toLowerCase().includes(state.searchQuery))
            );
        }

        // Filter by Activity Type
        if (state.filterType !== "ALL") {
            filtered = filtered.filter(a => a.activity_type === state.filterType);
        }

        activityCountTag.innerText = `${filtered.length} logged`;

        if (filtered.length === 0) {
            tableBody.innerHTML = "";
            emptyState.classList.remove("hidden");
            return;
        }

        emptyState.classList.add("hidden");
        tableBody.innerHTML = filtered.map(act => {
            const iconClass = getActivityIcon(act.activity_type);
            return `
                <tr>
                    <td>
                        <div class="act-type-cell">
                            <div class="act-icon ${iconClass.bg}">
                                <i class="${iconClass.icon}"></i>
                            </div>
                            <span>${escapeHtml(act.activity_type)}</span>
                        </div>
                    </td>
                    <td>
                        <div style="font-weight:600;">${act.date}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${act.time || '12:00'}</div>
                    </td>
                    <td><strong>${act.duration_minutes}</strong> mins</td>
                    <td><span style="color:var(--accent-orange); font-weight:700;">${act.calories}</span> kcal</td>
                    <td>
                        ${act.steps > 0 ? `<strong>${act.steps.toLocaleString()}</strong> steps` : ''}
                        ${act.distance_km > 0 ? `<div style="font-size:0.75rem; color:var(--text-muted);">${act.distance_km} km</div>` : ''}
                        ${act.steps === 0 && act.distance_km === 0 ? '<span style="color:var(--text-muted);">-</span>' : ''}
                    </td>
                    <td style="max-width: 200px; font-size: 0.85rem; color: var(--text-secondary);">
                        ${escapeHtml(act.notes || '-')}
                    </td>
                    <td class="text-right">
                        <button class="btn-delete-act" data-id="${act.id}" title="Delete Activity">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        // Attach event listeners to delete buttons
        document.querySelectorAll(".btn-delete-act").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = Number(e.currentTarget.getAttribute("data-id"));
                if (confirm("Are you sure you want to delete this activity record?")) {
                    await api.deleteActivity(id);
                    showToast("Activity deleted");
                    await refreshDashboard();
                }
            });
        });
    }

    function getActivityIcon(type) {
        switch (type) {
            case "Morning Run": case "Running": return { icon: "fa-solid fa-person-running", bg: "act-icon-run" };
            case "Brisk Walk": case "Walking": return { icon: "fa-solid fa-person-walking", bg: "act-icon-walk" };
            case "Cycling": return { icon: "fa-solid fa-person-biking", bg: "act-icon-cycle" };
            case "Gym / Weightlifting": return { icon: "fa-solid fa-dumbbell", bg: "act-icon-gym" };
            case "Yoga Session": return { icon: "fa-solid fa-spa", bg: "act-icon-yoga" };
            case "Swimming": return { icon: "fa-solid fa-person-swimming", bg: "act-icon-walk" };
            default: return { icon: "fa-solid fa-heart-pulse", bg: "act-icon-default" };
        }
    }

    // Modal Form Handlers
    async function handleAddActivitySubmit(e) {
        e.preventDefault();
        const activityData = {
            activity_type: document.getElementById("activity-type").value,
            date: document.getElementById("activity-date").value,
            time: document.getElementById("activity-time").value || getCurrentTimeStr(),
            duration_minutes: Number(document.getElementById("activity-duration").value || 0),
            calories: Number(document.getElementById("activity-calories").value || 0),
            steps: Number(document.getElementById("activity-steps").value || 0),
            distance_km: Number(document.getElementById("activity-distance").value || 0),
            notes: document.getElementById("activity-notes").value
        };

        await api.addActivity(activityData);
        modalLogActivity.classList.add("hidden");
        formLogActivity.reset();
        showToast("New activity logged successfully! 🎉");
        await refreshDashboard();
    }

    function populateGoalsForm() {
        const g = state.goals;
        document.getElementById("goal-steps").value = g.step_goal || 10000;
        document.getElementById("goal-calories").value = g.calorie_goal || 600;
        document.getElementById("goal-minutes").value = g.active_minutes_goal || 45;
        document.getElementById("goal-water").value = g.water_goal_ml || 2500;
    }

    async function handleSetGoalsSubmit(e) {
        e.preventDefault();
        const newGoals = {
            step_goal: Number(document.getElementById("goal-steps").value),
            calorie_goal: Number(document.getElementById("goal-calories").value),
            active_minutes_goal: Number(document.getElementById("goal-minutes").value),
            water_goal_ml: Number(document.getElementById("goal-water").value)
        };

        await api.updateGoals(newGoals);
        modalSetGoals.classList.add("hidden");
        showToast("Daily targets updated! 🎯");
        await refreshDashboard();
    }

    // Helper: Toast Notifications
    function showToast(message) {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${escapeHtml(message)}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function escapeHtml(str) {
        return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
});
