import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

# Set page configuration
st.set_page_config(
    page_title="EcoTrack — Carbon Footprint Platform",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling
st.markdown("""
<style>
    /* Dark theme customization */
    .stApp {
        background-color: #0b0f19;
        color: #e2e8f0;
    }
    
    /* Harmonious colors and glassmorphism styling for cards */
    .card {
        background: rgba(17, 24, 39, 0.7);
        border: 1px solid rgba(16, 185, 129, 0.15);
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
        margin-bottom: 20px;
    }
    
    .card-title {
        font-size: 1rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
    }
    
    .card-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #10b981; /* Emerald */
    }
    
    .card-subtitle {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 6px;
    }
    
    /* Customize headers */
    h1, h2, h3, h4 {
        font-family: 'Outfit', sans-serif !important;
        font-weight: 700 !important;
        background: linear-gradient(135deg, #34d399 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    /* Navigation styling */
    .sidebar .sidebar-content {
        background-color: #0f172a;
    }
    
    /* Buttons styling */
    .stButton>button {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        padding: 8px 16px;
        transition: all 0.3s ease;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    /* Alerts and messages */
    .success-alert {
        background-color: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 8px;
        padding: 12px;
        color: #34d399;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# ─── Constant Emission Factors ────────────────────────────────────────────────
TRANSPORT_FACTORS = {
    'ev': 0.053,
    'ice': 0.192,
    'hybrid': 0.108,
    'transit': 0.089,
    'bicycle': 0.0,
    'aviation_short': 0.255,
    'aviation_long': 0.195,
}
AVG_SHORT_HAUL_KM = 800
AVG_LONG_HAUL_KM = 6500
PETROL_KG_CO2E_PER_LITRE = 2.31


ENERGY_FACTORS = {
    'electricityGrid': 0.386,
    'electricityGreen': 0.02,
    'naturalGasM3': 2.204,
    'heatingOilLitre': 2.68,
}

DIET_FACTORS = {
    'vegan': 1.5,
    'vegetarian': 1.7,
    'pescatarian': 2.0,
    'omnivore': 2.5,
    'high_meat': 3.3,
}

FOOD_WASTE_MULTIPLIERS = {
    'very_low': 0.92,
    'low': 0.96,
    'average': 1.0,
    'high': 1.10,
    'very_high': 1.20,
}
LOCAL_FOOD_MAX_DISCOUNT = 0.15
COMPOSTING_ANNUAL_OFFSET_KG = 95

CONSUMPTION_FACTORS = {
    'clothing': 0.028,
    'electronics': 0.035,
    'otherGoods': 0.021,
}
RECYCLING_MULTIPLIERS = {
    'none': 1.0,
    'partial': 0.92,
    'most': 0.83,
    'all': 0.72,
}
SECOND_HAND_DISCOUNT = 0.40
REPAIR_FIRST_DISCOUNT = 0.20

US_NATIONAL_AVERAGE_KG = 14000
PARIS_2030_TARGET_KG = 2000
DAYS_PER_YEAR = 365
WEEKS_PER_YEAR = 52
MONTHS_PER_YEAR = 12

# Food OCR items keyword map to emissions (per kg of item)
FOOD_EMISSION_MAP = {
    'beef': 33.0,
    'steak': 33.0,
    'meat': 20.0,
    'lamb': 24.0,
    'pork': 7.6,
    'chicken': 6.9,
    'poultry': 6.9,
    'turkey': 6.9,
    'fish': 5.4,
    'salmon': 5.4,
    'cheese': 13.5,
    'butter': 12.0,
    'milk': 1.9,
    'dairy': 2.0,
    'eggs': 4.8,
    'rice': 2.7,
    'bread': 0.5,
    'potato': 0.3,
    'apple': 0.4,
    'banana': 0.4,
    'vegetable': 0.4,
    'salad': 0.3,
    'avocado': 1.2,
    'coffee': 17.0,
    'chocolate': 19.0,
}

# ─── Initialize Session State ────────────────────────────────────────────────
if 'initialized' not in st.session_state:
    st.session_state.initialized = True
    st.session_state.transport = {
        'mode': 'ice',
        'dailyDistanceKm': 30,
        'daysPerWeek': 5,
        'shortHaulFlightsPerYear': 2,
        'longHaulFlightsPerYear': 1,
        'fuelEfficiencyL100km': 8.0,
        'evConsumptionKwh100km': 18.0,
        'evGreenEnergyRatio': 0.0
    }
    st.session_state.energy = {
        'monthlyElectricityKwh': 400.0,
        'greenEnergyRatio': 0.0,
        'monthlyNaturalGasM3': 30.0,
        'monthlyHeatingOilL': 0.0,
        'householdSize': 2,
        'hasSolar': False,
        'solarOffsetKwh': 0.0
    }
    st.session_state.diet = {
        'profile': 'omnivore',
        'wasteFrequency': 'average',
        'localFoodRatio': 0.2,
        'composting': False
    }
    st.session_state.consumption = {
        'monthlyClothingSpend': 100.0,
        'monthlyElectronicsSpend': 50.0,
        'monthlyOtherGoodsSpend': 150.0,
        'recyclingHabit': 'partial',
        'buySecondHand': False,
        'repairFirst': False
    }
    st.session_state.historical_log = [
        {'date': (datetime.now() - timedelta(days=6)).strftime('%Y-%m-%d'), 'totalKgCO2e': 6200},
        {'date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'), 'totalKgCO2e': 6100},
        {'date': (datetime.now() - timedelta(days=4)).strftime('%Y-%m-%d'), 'totalKgCO2e': 5900},
        {'date': (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d'), 'totalKgCO2e': 5500},
        {'date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'), 'totalKgCO2e': 5200},
        {'date': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'), 'totalKgCO2e': 5000},
    ]
    st.session_state.tokens = 450
    st.session_state.level = 3
    st.session_state.badges = ['🌱 First Steps', '📉 Below Average', '🔥 7-Day Streak']
    st.session_state.active_recs = []
    st.session_state.plaid_connected = False
    st.session_state.iot_connected = False
    st.session_state.receipt_scanned = False
    st.session_state.scanned_items = []
    st.session_state.total_offset = 0

# ─── Calculation Logic ────────────────────────────────────────────────────────
def calculate_all_emissions():
    # Transport calculation
    trans = st.session_state.transport
    daily_dist = trans['dailyDistanceKm']
    days = trans['daysPerWeek']
    annual_commute_km = daily_dist * 2 * days * WEEKS_PER_YEAR
    
    if trans['mode'] == 'ev':
        green_ratio = trans['evGreenEnergyRatio']
        ev_efficiency = trans['evConsumptionKwh100km'] / 100.0
        blended_factor = ENERGY_FACTORS['electricityGrid'] * (1 - green_ratio) + ENERGY_FACTORS['electricityGreen'] * green_ratio
        commute_emissions = annual_commute_km * ev_efficiency * blended_factor
    elif trans['mode'] == 'ice':
        efficiency = trans['fuelEfficiencyL100km'] / 100.0
        commute_emissions = annual_commute_km * efficiency * PETROL_KG_CO2E_PER_LITRE
    elif trans['mode'] == 'hybrid':
        commute_emissions = annual_commute_km * TRANSPORT_FACTORS['hybrid']
    elif trans['mode'] == 'bicycle':
        commute_emissions = 0.0
    else:
        commute_emissions = annual_commute_km * TRANSPORT_FACTORS['transit']
        
    aviation = (trans['shortHaulFlightsPerYear'] * AVG_SHORT_HAUL_KM * TRANSPORT_FACTORS['aviation_short'] +
                 trans['longHaulFlightsPerYear'] * AVG_LONG_HAUL_KM * TRANSPORT_FACTORS['aviation_long'])
    
    transport_total = commute_emissions + aviation

    # Energy calculation
    eng = st.session_state.energy
    h_size = max(1, eng['householdSize'])
    green_energy = eng['greenEnergyRatio']
    
    elec_kwh = eng['monthlyElectricityKwh'] * MONTHS_PER_YEAR
    solar_offset = eng['solarOffsetKwh'] * (MONTHS_PER_YEAR if eng['hasSolar'] else 0)
    net_elec = max(0.0, elec_kwh - solar_offset)
    
    blended_elec_factor = ENERGY_FACTORS['electricityGrid'] * (1 - green_energy) + ENERGY_FACTORS['electricityGreen'] * green_energy
    elec_emissions = net_elec * blended_elec_factor
    
    gas_emissions = eng['monthlyNaturalGasM3'] * MONTHS_PER_YEAR * ENERGY_FACTORS['naturalGasM3']
    oil_emissions = eng['monthlyHeatingOilL'] * MONTHS_PER_YEAR * ENERGY_FACTORS['heatingOilLitre']
    
    energy_total = (elec_emissions + gas_emissions + oil_emissions) / h_size

    # Diet calculation
    dt = st.session_state.diet
    base_diet = DIET_FACTORS[dt['profile']]
    waste = FOOD_WASTE_MULTIPLIERS[dt['wasteFrequency']]
    local_disc = dt['localFoodRatio'] * LOCAL_FOOD_MAX_DISCOUNT
    diet_annual = base_diet * waste * (1 - local_disc) * DAYS_PER_YEAR
    compost = COMPOSTING_ANNUAL_OFFSET_KG if dt['composting'] else 0
    diet_total = max(0.0, diet_annual - compost)

    # Consumption calculation
    cons = st.session_state.consumption
    clothing = cons['monthlyClothingSpend'] * MONTHS_PER_YEAR
    elec_spend = cons['monthlyElectronicsSpend'] * MONTHS_PER_YEAR
    other = cons['monthlyOtherGoodsSpend'] * MONTHS_PER_YEAR
    
    cons_base = (clothing * CONSUMPTION_FACTORS['clothing'] + 
                 elec_spend * CONSUMPTION_FACTORS['electronics'] + 
                 other * CONSUMPTION_FACTORS['otherGoods'])
    cons_base *= RECYCLING_MULTIPLIERS[cons['recyclingHabit']]
    
    if cons['buySecondHand']:
        cons_base -= clothing * CONSUMPTION_FACTORS['clothing'] * SECOND_HAND_DISCOUNT
    if cons['repairFirst']:
        cons_base -= elec_spend * CONSUMPTION_FACTORS['electronics'] * REPAIR_FIRST_DISCOUNT
        
    consumption_total = max(0.0, cons_base)
    
    net_total = transport_total + energy_total + diet_total + consumption_total - st.session_state.total_offset
    
    return {
        'transport': transport_total,
        'energy': energy_total,
        'diet': diet_total,
        'consumption': consumption_total,
        'net_total': max(0.0, net_total),
        'gross_total': transport_total + energy_total + diet_total + consumption_total
    }

results = calculate_all_emissions()

# ─── Navigation Header ───
st.title("🌱 EcoTrack — Carbon Telemetry Dashboard")
st.caption("Track, calculate, and gamify your carbon footprint in real-time.")

tabs = st.tabs([
    "📊 Dashboard", 
    "🎛️ Calculator Wizard", 
    "💡 What-If Scenario Planner", 
    "🏆 Leagues & Gamification", 
    "🛍️ Offsets & Rewards",
    "📄 Receipt OCR Parser"
])

# ─── Tab 1: Dashboard ─────────────────────────────────────────────────────────
with tabs[0]:
    st.subheader("Your Carbon Telemetry")
    
    # Key metrics row
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Net Annual Carbon Footprint</div>
            <div class="card-value">{results['net_total']/1000.0:.2f} t</div>
            <div class="card-subtitle">Target limit: 2.00 t (Paris 2030)</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Total Offset Balance</div>
            <div class="card-value" style="color: #60a5fa;">{st.session_state.total_offset/1000.0:.2f} t</div>
            <div class="card-subtitle">Through certified projects</div>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Eco-Tokens Wallet</div>
            <div class="card-value" style="color: #fbbf24;">{st.session_state.tokens}</div>
            <div class="card-subtitle">Earned via sustainable behaviors</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown(f"""
        <div class="card">
            <div class="card-title">Profile Level & Status</div>
            <div class="card-value" style="color: #c084fc;">Lv. {st.session_state.level}</div>
            <div class="card-subtitle">{len(st.session_state.badges)} Achievements unlocked</div>
        </div>
        """, unsafe_allow_html=True)
        
    chart_col1, chart_col2 = st.columns([1, 1])
    
    with chart_col1:
        st.write("### Carbon Footprint Breakdown")
        breakdown_df = pd.DataFrame({
            'Category': ['Transport', 'Household Energy', 'Diet & Food', 'Retail Consumption'],
            'Emissions (kg CO2e)': [
                results['transport'], 
                results['energy'], 
                results['diet'], 
                results['consumption']
            ]
        })
        fig = px.pie(
            breakdown_df, 
            values='Emissions (kg CO2e)', 
            names='Category', 
            hole=0.4,
            color_discrete_sequence=['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
        )
        fig.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#cbd5e1',
            showlegend=True
        )
        st.plotly_chart(fig, use_container_width=True)
        
    with chart_col2:
        st.write("### Comparison Benchmarks (Annual tonnes CO₂)")
        comp_df = pd.DataFrame({
            'Standard': ['User Net Footprint', 'Paris Agreement Target', 'US National Average'],
            'Tonnes': [results['net_total']/1000.0, PARIS_2030_TARGET_KG/1000.0, US_NATIONAL_AVERAGE_KG/1000.0]
        })
        fig_bar = px.bar(
            comp_df,
            x='Standard',
            y='Tonnes',
            color='Standard',
            color_discrete_map={
                'User Net Footprint': '#10b981',
                'Paris Agreement Target': '#60a5fa',
                'US National Average': '#ef4444'
            }
        )
        fig_bar.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#cbd5e1',
            showlegend=False
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    # Log current snap action
    st.write("---")
    st.subheader("Carbon Log telemetry")
    log_col, act_col = st.columns([2, 1])
    with log_col:
        historical_df = pd.DataFrame(st.session_state.historical_log)
        fig_line = px.line(
            historical_df,
            x='date',
            y='totalKgCO2e',
            title='Footprint Trend over Time (kgCO₂e)',
            markers=True,
            color_discrete_sequence=['#10b981']
        )
        fig_line.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font_color='#cbd5e1'
        )
        st.plotly_chart(fig_line, use_container_width=True)
    with act_col:
        st.write("### Record snapshot")
        st.write("Log your current calculator configuration to your profile history.")
        if st.button("Log current state to profile"):
            today_str = datetime.now().strftime('%Y-%m-%d')
            # remove duplicates for today if exists
            st.session_state.historical_log = [pt for pt in st.session_state.historical_log if pt['date'] != today_str]
            st.session_state.historical_log.append({
                'date': today_str,
                'totalKgCO2e': results['gross_total']
            })
            st.session_state.tokens += 10 # Reward
            st.toast("Current configuration saved to carbon log! +10 Eco-Tokens.", icon="🌱")
            st.rerun()

# ─── Tab 2: Calculator Wizard ────────────────────────────────────────────────
with tabs[1]:
    st.subheader("Configure Carbon Calculator Wizard")
    st.info("Directly adjust values here to dynamically calculate and optimize your carbon footprint footprint.")
    
    wizard_cat = st.selectbox("Category", ["Transport", "Household Energy", "Diet & Diet/Lifestyle", "Consumption & Retail"])
    
    if wizard_cat == "Transport":
        t = st.session_state.transport
        mode = st.selectbox(
            "Primary commute method", 
            ["ice", "hybrid", "ev", "transit", "bicycle"], 
            index=["ice", "hybrid", "ev", "transit", "bicycle"].index(t['mode']),
            format_func=lambda x: {
                'ice': '🚗 Petrol/Diesel (Combustion)',
                'hybrid': '🔌 Hybrid',
                'ev': '⚡ Electric Vehicle',
                'transit': '🚌 Public Transit (Bus/Train)',
                'bicycle': '🚲 Active Transit (Bike/Walk)'
            }[x]
        )
        st.session_state.transport['mode'] = mode
        
        if mode != 'bicycle':
            st.session_state.transport['dailyDistanceKm'] = st.slider(
                "Daily commute distance (one way, km)", 
                0, 200, t['dailyDistanceKm']
            )
        
        st.session_state.transport['daysPerWeek'] = st.slider(
            "Commute days per week", 
            0, 7, t['daysPerWeek']
        )
        
        if mode in ['ice', 'hybrid']:
            st.session_state.transport['fuelEfficiencyL100km'] = st.slider(
                "Vehicle fuel efficiency (L/100km)", 
                3.0, 30.0, float(t['fuelEfficiencyL100km']), step=0.5
            )
        elif mode == 'ev':
            st.session_state.transport['evConsumptionKwh100km'] = st.slider(
                "EV energy consumption (kWh/100km)", 
                10.0, 40.0, float(t['evConsumptionKwh100km']), step=0.5
            )
            st.session_state.transport['evGreenEnergyRatio'] = st.slider(
                "Charged with renewable energy (%)", 
                0, 100, int(t['evGreenEnergyRatio'] * 100)
            ) / 100.0
            
        st.markdown("**Aviation (Trips per year)**")
        st.session_state.transport['shortHaulFlightsPerYear'] = st.slider(
            "Short-haul flights (< 1,500 km)", 
            0, 30, t['shortHaulFlightsPerYear']
        )
        st.session_state.transport['longHaulFlightsPerYear'] = st.slider(
            "Long-haul flights (> 1,500 km)", 
            0, 20, t['longHaulFlightsPerYear']
        )
        
    elif wizard_cat == "Household Energy":
        e = st.session_state.energy
        st.session_state.energy['householdSize'] = st.number_input(
            "Household Size", 1, 15, int(e['householdSize'])
        )
        st.session_state.energy['monthlyElectricityKwh'] = st.slider(
            "Monthly grid electricity consumption (kWh)", 
            0.0, 2000.0, float(e['monthlyElectricityKwh']), step=20.0
        )
        st.session_state.energy['greenEnergyRatio'] = st.slider(
            "Green/Renewable energy ratio (%)", 
            0, 100, int(e['greenEnergyRatio'] * 100)
        ) / 100.0
        st.session_state.energy['monthlyNaturalGasM3'] = st.slider(
            "Monthly natural gas consumption (m³)", 
            0.0, 500.0, float(e['monthlyNaturalGasM3']), step=5.0
        )
        st.session_state.energy['monthlyHeatingOilL'] = st.slider(
            "Monthly heating oil consumption (litres)", 
            0.0, 1000.0, float(e['monthlyHeatingOilL']), step=10.0
        )
        
        has_solar = st.checkbox("Do you have solar panels?", e['hasSolar'])
        st.session_state.energy['hasSolar'] = has_solar
        if has_solar:
            st.session_state.energy['solarOffsetKwh'] = st.slider(
                "Estimated solar energy generated per month (kWh)", 
                0.0, 1000.0, float(e['solarOffsetKwh']), step=10.0
            )
            
    elif wizard_cat == "Diet & Diet/Lifestyle":
        d = st.session_state.diet
        st.session_state.diet['profile'] = st.selectbox(
            "Diet profile",
            ['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'high_meat'],
            index=['vegan', 'vegetarian', 'pescatarian', 'omnivore', 'high_meat'].index(d['profile']),
            format_func=lambda x: {
                'vegan': '🌱 Vegan (No animal products)',
                'vegetarian': '🥚 Vegetarian (Eggs/Dairy, no meat)',
                'pescatarian': '🐟 Pescatarian (Fish/Eggs/Dairy, no red meat)',
                'omnivore': '🍖 Omnivore (Moderate poultry, meat, dairy)',
                'high_meat': '🥩 High Meat (Heavy red meat consumer)'
            }[x]
        )
        st.session_state.diet['wasteFrequency'] = st.selectbox(
            "Food waste frequency",
            ['very_low', 'low', 'average', 'high', 'very_high'],
            index=['very_low', 'low', 'average', 'high', 'very_high'].index(d['wasteFrequency']),
            format_func=lambda x: {
                'very_low': 'Zero waste / composting',
                'low': 'Rarely waste food',
                'average': 'Average wastage (10-15%)',
                'high': 'Frequent waste',
                'very_high': 'Heavy waste / throw meals often'
            }[x]
        )
        st.session_state.diet['localFoodRatio'] = st.slider(
            "Ratio of locally sourced food (%)", 
            0, 100, int(d['localFoodRatio'] * 100)
        ) / 100.0
        st.session_state.diet['composting'] = st.checkbox(
            "Do you compost organic food waste?", 
            d['composting']
        )
        
    elif wizard_cat == "Consumption & Retail":
        c = st.session_state.consumption
        st.session_state.consumption['monthlyClothingSpend'] = st.slider(
            "Monthly clothing expenditure ($)", 0.0, 1000.0, float(c['monthlyClothingSpend']), step=10.0
        )
        st.session_state.consumption['monthlyElectronicsSpend'] = st.slider(
            "Monthly electronics / gadget expenditure ($)", 0.0, 1000.0, float(c['monthlyElectronicsSpend']), step=10.0
        )
        st.session_state.consumption['monthlyOtherGoodsSpend'] = st.slider(
            "Monthly other physical items spend ($)", 0.0, 2000.0, float(c['monthlyOtherGoodsSpend']), step=10.0
        )
        st.session_state.consumption['recyclingHabit'] = st.selectbox(
            "Recycling habits",
            ['none', 'partial', 'most', 'all'],
            index=['none', 'partial', 'most', 'all'].index(c['recyclingHabit']),
            format_func=lambda x: {
                'none': '❌ Do not recycle',
                'partial': '♻️ Partially recycle basic containers',
                'most': '♻️ Recycle most things',
                'all': '♻️ Strict recycling and sorting'
            }[x]
        )
        st.session_state.consumption['buySecondHand'] = st.checkbox(
            "Prefer second-hand / thrift clothing", c['buySecondHand']
        )
        st.session_state.consumption['repairFirst'] = st.checkbox(
            "Repair electronics and goods instead of buying new", c['repairFirst']
        )

# ─── Tab 3: What-If Scenario Planner ─────────────────────────────────────────
with tabs[2]:
    st.subheader("💡 What-If Carbon Forecast Planner")
    st.write("Toggle proposed recommendations to forecast your carbon savings curve over 52 weeks.")
    
    recs = [
        {"id": "ev", "title": "⚡ Switch to Electric Vehicle", "impact": 1800, "tokens": 100},
        {"id": "green_power", "title": "🔌 Switch to 100% Renewable electricity tariff", "impact": 1200, "tokens": 80},
        {"id": "meat_reduction", "title": "🌱 Reduce Red Meat intake (Low Meat Diet)", "impact": 600, "tokens": 60},
        {"id": "local_food", "title": "🏡 Buy 80% Local Food", "impact": 200, "tokens": 30},
        {"id": "repair_goods", "title": "🛠️ Repair and Reuse lifestyle (Zero Waste)", "impact": 350, "tokens": 50},
    ]
    
    st.write("#### Active Recommendations")
    activated_recs = []
    
    # 2 columns layout
    col_rec_1, col_rec_2 = st.columns([1, 1])
    
    with col_rec_1:
        for r in recs[:3]:
            checked = st.checkbox(f"{r['title']} (-{r['impact']} kg CO₂/yr)", key=f"rec_{r['id']}")
            if checked:
                activated_recs.append(r)
    with col_rec_2:
        for r in recs[3:]:
            checked = st.checkbox(f"{r['title']} (-{r['impact']} kg CO₂/yr)", key=f"rec_{r['id']}")
            if checked:
                activated_recs.append(r)
                
    st.write("### 52-Week Adoption Forecast")
    
    total_savings = sum(r['impact'] for r in activated_recs)
    baseline = results['gross_total']
    optimized = max(0.0, baseline - total_savings)
    
    # Calculate forecast points
    weeks = list(range(53))
    dates = [(datetime.now() + timedelta(weeks=w)).strftime('%Y-%m-%d') for w in weeks]
    
    # Adoption curve model (savings ramp up over 6 weeks)
    baseline_series = [baseline / WEEKS_PER_YEAR] * 53
    optimized_series = []
    for w in weeks:
        ramp = min(1.0, w / 6.0)
        weekly_savings = (total_savings * ramp) / WEEKS_PER_YEAR
        optimized_series.append(max(0.0, (baseline / WEEKS_PER_YEAR) - weekly_savings))
        
    forecast_df = pd.DataFrame({
        'Date': dates * 2,
        'Weekly Emissions (kg)': baseline_series + optimized_series,
        'Scenario': ['Baseline'] * 53 + ['Optimized Adoption'] * 53
    })
    
    fig_forecast = px.area(
        forecast_df,
        x='Date',
        y='Weekly Emissions (kg)',
        color='Scenario',
        line_group='Scenario',
        color_discrete_map={'Baseline': '#ef4444', 'Optimized Adoption': '#10b981'}
    )
    fig_forecast.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font_color='#cbd5e1'
    )
    st.plotly_chart(fig_forecast, use_container_width=True)

# ─── Tab 4: Leagues & Gamification ───────────────────────────────────────────
with tabs[3]:
    st.subheader("🏆 Carbon Leagues & Micro-Rewards")
    st.write("Join multiplayer sustainability challenges, earn levels, and collect badges!")
    
    # Progress ring / card
    st.markdown(f"""
    <div style="display: flex; gap: 20px; align-items: center; background: rgba(17,24,39,0.5); padding: 20px; border-radius: 12px; border: 1px solid rgba(192,132,252,0.2);">
        <div style="font-size: 3rem;">🏅</div>
        <div>
            <h4 style="margin: 0; color: #c084fc;">Level {st.session_state.level} Carbon Hero</h4>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 0.9rem;">You have unlocked {len(st.session_state.badges)} achievement badges. Earn {1000 - st.session_state.tokens % 1000} more tokens for Level {st.session_state.level+1}!</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.write("---")
    st.write("### Active Challenges")
    
    c_col1, c_col2 = st.columns(2)
    with c_col1:
        st.markdown("""
        <div class="card" style="border-color: rgba(245,158,11,0.3);">
            <div class="card-title" style="color: #f59e0b;">🚴 Commute Challenge</div>
            <h4 style="margin-top: 5px;">Bike-to-Work Week</h4>
            <p style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 12px;">Log 4 days of active travel commuting per week.</p>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">Reward: <b>150 Eco-Tokens</b></div>
            <div style="background-color: #334155; border-radius: 6px; height: 10px; width: 100%;">
                <div style="background-color: #f59e0b; border-radius: 6px; height: 10px; width: 75%;"></div>
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">3/4 Days completed</div>
        </div>
        """, unsafe_allow_html=True)
    with c_col2:
        st.markdown("""
        <div class="card" style="border-color: rgba(59,130,246,0.3);">
            <div class="card-title" style="color: #3b82f6;">🥩 Dietary League</div>
            <h4 style="margin-top: 5px;">Zero-Meat March</h4>
            <p style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 12px;">Maintain vegan or vegetarian profile throughout the month.</p>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">Reward: <b>300 Eco-Tokens</b></div>
            <div style="background-color: #334155; border-radius: 6px; height: 10px; width: 100%;">
                <div style="background-color: #3b82f6; border-radius: 6px; height: 10px; width: 45%;"></div>
            </div>
            <div style="text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">14/31 Days completed</div>
        </div>
        """, unsafe_allow_html=True)
        
    st.write("---")
    st.write("### Your Achievement Badges")
    badge_cols = st.columns(len(st.session_state.badges) + 2)
    for i, b in enumerate(st.session_state.badges):
        with badge_cols[i]:
            st.markdown(f"""
            <div style="text-align: center; padding: 15px; border-radius: 10px; background: #1e293b; border: 1px solid #475569;">
                <div style="font-size: 1.8rem; margin-bottom: 8px;">{b.split()[0]}</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: #e2e8f0;">{" ".join(b.split()[1:])}</div>
            </div>
            """, unsafe_allow_html=True)

# ─── Tab 5: Offsets & Rewards ────────────────────────────────────────────────
with tabs[4]:
    st.subheader("🛍️ Offset Portfolio & Partner Rewards")
    st.write("Purchase verified carbon offsets to balance your gross emissions, or spend Eco-Tokens on premium sustainable deals!")
    
    offset_tab, spend_tab = st.tabs(["🌱 Purchase Offsets", "🎁 Spend Eco-Tokens"])
    
    with offset_tab:
        st.write("### Certified Offsetting Projects")
        
        proj1, proj2, proj3 = st.columns(3)
        with proj1:
            st.markdown("""
            <div class="card">
                <div class="card-title">Forestry / Nature</div>
                <h4>Reforestation Project</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Amazonian basin tree planting and biodiversity conservation.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #10b981; margin-bottom: 15px;">$15 / tonne CO₂</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Buy 1 Tonne (Amazon Reforest)", key="btn_amazon"):
                st.session_state.total_offset += 1000
                st.session_state.tokens += 150
                st.toast("Successfully purchased 1 tonne Amazon Reforestation! +150 Eco-Tokens.", icon="🌳")
                st.rerun()
                
        with proj2:
            st.markdown("""
            <div class="card">
                <div class="card-title">Technology / DAC</div>
                <h4>Direct Air Capture</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Permanent geological carbon storage using Climeworks scrubbers.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #10b981; margin-bottom: 15px;">$90 / tonne CO₂</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Buy 1 Tonne (Climeworks DAC)", key="btn_dac"):
                st.session_state.total_offset += 1000
                st.session_state.tokens += 900
                st.toast("Successfully purchased 1 tonne Direct Air Capture! +900 Eco-Tokens.", icon="⚡")
                st.rerun()
                
        with proj3:
            st.markdown("""
            <div class="card">
                <div class="card-title">Renewables</div>
                <h4>Wind Farm Turbine</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Fossil-fuel displacement projects via clean energy grid development.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #10b981; margin-bottom: 15px;">$8 / tonne CO₂</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Buy 1 Tonne (Wind Turbine)", key="btn_wind"):
                st.session_state.total_offset += 1000
                st.session_state.tokens += 80
                st.toast("Successfully purchased 1 tonne Wind Farm project! +80 Eco-Tokens.", icon="💨")
                st.rerun()

    with spend_tab:
        st.write("### Marketplace Rewards (Spend Tokens)")
        
        rew1, rew2, rew3 = st.columns(3)
        with rew1:
            st.markdown("""
            <div class="card">
                <div class="card-title">Partner Deal</div>
                <h4>-20% Sustainable Wear</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Redeem discount coupon code for eco-conscious clothing retailer.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24; margin-bottom: 15px;">200 Tokens</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Redeem wear discount", key="btn_rew1"):
                if st.session_state.tokens >= 200:
                    st.session_state.tokens -= 200
                    st.success("Successfully redeemed coupon: ECOWEAR20")
                    st.rerun()
                else:
                    st.error("Insufficient Eco-Tokens.")
                    
        with rew2:
            st.markdown("""
            <div class="card">
                <div class="card-title">Zero Waste Shop</div>
                <h4>Free Bamboo Toothbrush</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Redeem a free premium organic biodegradable bamboo toothbrush.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24; margin-bottom: 15px;">300 Tokens</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Redeem Bamboo Brush", key="btn_rew2"):
                if st.session_state.tokens >= 300:
                    st.session_state.tokens -= 300
                    st.success("Successfully redeemed coupon: FREEMBOO")
                    st.rerun()
                else:
                    st.error("Insufficient Eco-Tokens.")
                    
        with rew3:
            st.markdown("""
            <div class="card">
                <div class="card-title">Plaid Finance</div>
                <h4>Zero Premium Sync</h4>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 15px;">Unlock automated bank transaction sync for 1 month.</p>
                <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24; margin-bottom: 15px;">400 Tokens</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Unlock Plaid Premium Sync", key="btn_rew3"):
                if st.session_state.tokens >= 400:
                    st.session_state.tokens -= 400
                    st.session_state.plaid_connected = True
                    st.success("Plaid Premium Sync unlocked for 30 days!")
                    st.rerun()
                else:
                    st.error("Insufficient Eco-Tokens.")

# ─── Tab 6: Receipt OCR Parser ────────────────────────────────────────────────
with tabs[5]:
    st.subheader("📄 Simulated Receipt OCR Scanner")
    st.write("Upload or paste grocery receipts. The scanner parses food items and maps them to GHG Protocol emission factors.")
    
    ocr_mode = st.radio("Input Method", ["Paste Receipt Text", "Upload Receipt Image / Mock Image"])
    
    if ocr_mode == "Paste Receipt Text":
        sample_receipt = """WHOLE FOODS MARKET - SAN FRANCISCO
1x ORGANIC NY STRIP STEAK $24.99
2x BONELESS CHICKEN BREAST $14.50
1x ORGANIC HONEYCRISP APPLES (1.2 kg) $5.40
1x ORGANIC MILK 1/2 GAL $4.29
TOTAL $49.18"""
        
        receipt_text = st.text_area("Paste receipt text content here:", value=sample_receipt, height=200)
        
        if st.button("Scan and Calculate Food CO₂"):
            # Simple keyword text parsing
            found_items = []
            total_co2 = 0
            
            lines = receipt_text.lower().split('\n')
            for line in lines:
                for keyword, factor in FOOD_EMISSION_MAP.items():
                    if keyword in line:
                        # Estimate weight: default is 0.5 kg if not specified
                        weight = 0.5
                        if "kg" in line:
                            try:
                                # try to extract weight e.g., (1.2 kg)
                                idx = line.index("kg")
                                words = line[:idx].split()
                                if words:
                                    weight = float(words[-1].replace('(', ''))
                            except:
                                pass
                        elif "gal" in line or "milk" in keyword:
                            weight = 1.0 # Gal/Litre approx
                            
                        item_co2 = weight * factor
                        found_items.append({
                            'item': line.strip(),
                            'category': keyword,
                            'weight_kg': weight,
                            'factor': factor,
                            'co2_kg': item_co2
                        })
                        total_co2 += item_co2
                        break # match one keyword per line max
            
            if found_items:
                st.session_state.receipt_scanned = True
                st.session_state.scanned_items = found_items
                st.session_state.tokens += 50
                st.toast("OCR Receipt Parsed! +50 Eco-Tokens.", icon="📄")
            else:
                st.warning("No matching food keywords found in the receipt text. Try adding 'steak', 'chicken', 'milk', 'apple' to test.")
                
    else:
        st.write("Select a mock receipt image to simulate OCR extraction:")
        mock_option = st.selectbox(
            "Select Receipt Preset", 
            ["Whole Foods Receipt (Heavy Beef & Meat)", "Trader Joe's (Vegan/Vegetarian Greens)"]
        )
        
        if st.button("Simulate OCR Scanning"):
            if "Heavy Beef" in mock_option:
                st.session_state.scanned_items = [
                    {'item': 'NY Strip Beef Steak (0.8 kg)', 'category': 'beef', 'weight_kg': 0.8, 'factor': 33.0, 'co2_kg': 26.4},
                    {'item': 'Chicken Breast (1.2 kg)', 'category': 'chicken', 'weight_kg': 1.2, 'factor': 6.9, 'co2_kg': 8.28},
                    {'item': 'Whole Organic Milk (1.0 kg)', 'category': 'milk', 'weight_kg': 1.0, 'factor': 1.9, 'co2_kg': 1.9}
                ]
            else:
                st.session_state.scanned_items = [
                    {'item': 'Organic Tofu (0.6 kg)', 'category': 'vegetable', 'weight_kg': 0.6, 'factor': 0.4, 'co2_kg': 0.24},
                    {'item': 'Spinach & Greens (0.5 kg)', 'category': 'vegetable', 'weight_kg': 0.5, 'factor': 0.4, 'co2_kg': 0.2},
                    {'item': 'Avocados (0.4 kg)', 'category': 'avocado', 'weight_kg': 0.4, 'factor': 1.2, 'co2_kg': 0.48},
                    {'item': 'Apples & Bananas (1.5 kg)', 'category': 'apple', 'weight_kg': 1.5, 'factor': 0.4, 'co2_kg': 0.6}
                ]
            st.session_state.receipt_scanned = True
            st.session_state.tokens += 50
            st.toast("OCR Receipt Parsed! +50 Eco-Tokens.", icon="📄")
            st.rerun()

    if st.session_state.receipt_scanned and st.session_state.scanned_items:
        st.write("### OCR Scan Result Summary")
        scanned_df = pd.DataFrame(st.session_state.scanned_items)
        st.table(scanned_df[['item', 'category', 'weight_kg', 'factor', 'co2_kg']])
        
        tot_receipt_co2 = scanned_df['co2_kg'].sum()
        st.markdown(f"""
        <div style="background-color: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="margin: 0; color: #ef4444;">Calculated Carbon Footprint: {tot_receipt_co2:.2f} kg CO₂e</h4>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #94a3b8;">This grocery trip contributes {tot_receipt_co2/results['net_total']*100:.1f}% to your projected annual diet emissions.</p>
        </div>
        """, unsafe_allow_html=True)
        
        if st.button("Clear OCR results"):
            st.session_state.receipt_scanned = False
            st.session_state.scanned_items = []
            st.rerun()
