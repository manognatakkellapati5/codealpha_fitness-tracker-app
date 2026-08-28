/**
 * FitPulse API Abstraction Module
 * Connects to Python FastAPI backend with intelligent LocalStorage fallback.
 */

const API_BASE = "/api";

class FitnessAPI {
    constructor() {
        this.useLocalStorageFallback = false;
        this.initLocalStorage();
    }

    // Initialize default local storage schema if empty
    initLocalStorage() {
        if (!localStorage.getItem("fitpulse_activities")) {
            const today = new Date().toISOString().split("T")[0];
            const sampleActivities = [
                { id: 1, activity_type: "Morning Run", duration_minutes: 35, calories: 380, steps: 4500, distance_km: 4.2, date: today, time: "07:30", notes: "Refreshing jog in the park" },
                { id: 2, activity_type: "Brisk Walk", duration_minutes: 25, calories: 120, steps: 2800, distance_km: 2.1, date: today, time: "12:15", notes: "Lunch walk" },
                { id: 3, activity_type: "Cycling", duration_minutes: 45, calories: 420, steps: 0, distance_km: 12.5, date: getPastDate(1), time: "18:00", notes: "Evening bike ride" }
            ];
            localStorage.setItem("fitpulse_activities", JSON.stringify(sampleActivities));
        }

        if (!localStorage.getItem("fitpulse_goals")) {
            const defaultGoals = { step_goal: 10000, calorie_goal: 600, active_minutes_goal: 45, water_goal_ml: 2500 };
            localStorage.setItem("fitpulse_goals", JSON.stringify(defaultGoals));
        }

        if (!localStorage.getItem("fitpulse_water")) {
            localStorage.setItem("fitpulse_water", JSON.stringify({}));
        }
    }

    // Helper fetch wrapper
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: { "Content-Type": "application/json" },
                ...options
            });
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (err) {
            console.warn(`Backend API unreachable at ${endpoint}, utilizing LocalStorage fallback:`, err.message);
            this.useLocalStorageFallback = true;
            return null;
        }
    }

    // --- Activities API ---
    async getActivities(dateStr = null) {
        const result = await this.request(`/activities${dateStr ? `?date=${dateStr}` : ""}`);
        if (result !== null) return result;

        // LocalStorage fallback
        let activities = JSON.parse(localStorage.getItem("fitpulse_activities") || "[]");
        if (dateStr) {
            activities = activities.filter(a => a.date === dateStr);
        }
        return activities.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    }

    async addActivity(activityData) {
        const result = await this.request("/activities", {
            method: "POST",
            body: JSON.stringify(activityData)
        });
        if (result !== null) return result;

        // LocalStorage fallback
        const activities = JSON.parse(localStorage.getItem("fitpulse_activities") || "[]");
        const newActivity = {
            id: Date.now(),
            ...activityData,
            created_at: new Date().toISOString()
        };
        activities.push(newActivity);
        localStorage.setItem("fitpulse_activities", JSON.stringify(activities));
        return newActivity;
    }

    async deleteActivity(id) {
        const result = await this.request(`/activities/${id}`, { method: "DELETE" });
        if (result !== null) return result;

        // LocalStorage fallback
        let activities = JSON.parse(localStorage.getItem("fitpulse_activities") || "[]");
        activities = activities.filter(a => a.id !== id);
        localStorage.setItem("fitpulse_activities", JSON.stringify(activities));
        return { message: "Deleted from local storage" };
    }

    // --- Goals API ---
    async getGoals() {
        const result = await this.request("/goals");
        if (result !== null) return result;

        return JSON.parse(localStorage.getItem("fitpulse_goals"));
    }

    async updateGoals(goalsData) {
        const result = await this.request("/goals", {
            method: "PUT",
            body: JSON.stringify(goalsData)
        });
        if (result !== null) return result;

        localStorage.setItem("fitpulse_goals", JSON.stringify(goalsData));
        return goalsData;
    }

    // --- Water Log API ---
    async addWater(amountMl, dateStr) {
        const result = await this.request("/water", {
            method: "POST",
            body: JSON.stringify({ amount_ml: amountMl, date: dateStr })
        });
        if (result !== null) return result;

        const waterMap = JSON.parse(localStorage.getItem("fitpulse_water") || "{}");
        const current = waterMap[dateStr] || 0;
        const newTotal = current + amountMl;
        waterMap[dateStr] = newTotal;
        localStorage.setItem("fitpulse_water", JSON.stringify(waterMap));
        return { total_water_ml: newTotal };
    }

    // --- Summaries & Aggregations ---
    async getDailySummary(dateStr) {
        const result = await this.request(`/summary/daily?date=${dateStr}`);
        if (result !== null) return result;

        // LocalStorage calculated fallback
        const activities = await this.getActivities(dateStr);
        const goals = await this.getGoals();
        const waterMap = JSON.parse(localStorage.getItem("fitpulse_water") || "{}");

        const total_steps = activities.reduce((sum, a) => sum + (Number(a.steps) || 0), 0);
        const total_calories = activities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0);
        const total_active_minutes = activities.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0);
        const total_distance_km = activities.reduce((sum, a) => sum + (Number(a.distance_km) || 0), 0);

        return {
            total_steps,
            total_calories,
            total_active_minutes,
            total_distance_km: Math.round(total_distance_km * 10) / 10,
            total_workouts: activities.length,
            water_intake_ml: waterMap[dateStr] || 0,
            goals
        };
    }

    async getWeeklySummary() {
        const result = await this.request("/summary/weekly");
        if (result !== null) return result;

        // LocalStorage calculate 7 days trend fallback
        const allActivities = JSON.parse(localStorage.getItem("fitpulse_activities") || "[]");
        const dates = [];
        const todayObj = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayObj);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

            const dayActs = allActivities.filter(a => a.date === dateStr);
            const steps = dayActs.reduce((sum, a) => sum + (Number(a.steps) || 0), 0);
            const calories = dayActs.reduce((sum, a) => sum + (Number(a.calories) || 0), 0);
            const minutes = dayActs.reduce((sum, a) => sum + (Number(a.duration_minutes) || 0), 0);

            dates.push({ date: dateStr, day: dayLabel, steps, calories, minutes });
        }

        // Breakdown by type
        const typeMap = {};
        allActivities.forEach(a => {
            const t = a.activity_type || "Other";
            typeMap[t] = (typeMap[t] || 0) + 1;
        });

        const type_breakdown = Object.keys(typeMap).map(k => ({
            activity_type: k,
            count: typeMap[k]
        }));

        return { weekly_trends: dates, type_breakdown };
    }
}

function getPastDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
}

const api = new FitnessAPI();
