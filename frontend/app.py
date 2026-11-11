from __future__ import annotations

import base64
import io
from typing import Any

import folium
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image, ImageDraw
from streamlit_folium import st_folium


DEMO_EMAIL = "admin"
DEMO_PASSWORD = "admin123"

LOCATIONS: dict[str, dict[str, Any]] = {
    "Bengaluru, India": {
        "coordinates": (12.9716, 77.5946),
        "risk": "High",
        "dump_sites": 24,
        "area": "48.2 km²",
        "updated": "Today, 08:42",
        "trend": [8, 11, 13, 16, 18, 19, 21, 20, 22, 23, 24, 24],
        "reports": [
            ("North Bengaluru transfer road", "High", "Detected 2 days ago", "18.5 t"),
            ("Bellandur lake perimeter", "High", "Detected 8 days ago", "11.2 t"),
            ("Hoodi industrial edge", "Medium", "Detected 14 days ago", "6.8 t"),
        ],
    },
    "Chennai, India": {
        "coordinates": (13.0827, 80.2707),
        "risk": "Medium",
        "dump_sites": 16,
        "area": "35.7 km²",
        "updated": "Yesterday, 16:20",
        "trend": [13, 12, 14, 14, 13, 15, 17, 16, 18, 17, 16, 16],
        "reports": [
            ("Perungudi marsh boundary", "High", "Detected 4 days ago", "9.4 t"),
            ("Manali logistics corridor", "Medium", "Detected 12 days ago", "4.1 t"),
        ],
    },
    "Pune, India": {
        "coordinates": (18.5204, 73.8567),
        "risk": "Low",
        "dump_sites": 9,
        "area": "27.1 km²",
        "updated": "3 days ago, 11:10",
        "trend": [12, 13, 11, 10, 12, 11, 10, 9, 10, 9, 9, 9],
        "reports": [
            ("Wagholi construction belt", "Medium", "Detected 9 days ago", "3.6 t"),
            ("Mula-Mutha river bank", "Low", "Detected 19 days ago", "1.8 t"),
        ],
    },
}


def mock_report_image(title: str, accent: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (900, 420), (22, 31, 48))
    draw = ImageDraw.Draw(image)
    for x in range(0, 900, 60):
        draw.line((x, 0, x + 140, 420), fill=(31, 53, 70), width=2)
    for y in range(0, 420, 60):
        draw.line((0, y, 900, y), fill=(31, 53, 70), width=2)
    draw.rounded_rectangle((310, 120, 690, 315), radius=18, outline=accent, width=8)
    draw.ellipse((410, 165, 590, 290), fill=accent)
    draw.text((28, 24), title, fill="white")
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def login_page() -> None:
    st.markdown(
        """
        <div class="hero">
          <div class="eyebrow">SATELLITE INTELLIGENCE PLATFORM</div>
          <h1>See the waste.<br><span>Change the future.</span></h1>
          <p>WasteWatch helps cities find, track, and act on illegal dumping
          with AI-powered satellite monitoring.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    left, right = st.columns([1.2, 0.8], gap="large")
    with left:
        st.markdown("### From pixels to action")
        st.markdown(
            "Monitor dumping hotspots, compare locations over time, and turn "
            "satellite evidence into faster environmental action."
        )
        st.image(mock_report_image("AI CHANGE DETECTION • DEMO VIEW", (51, 211, 153)), use_container_width=True)
    with right:
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown("### Welcome back")
        st.caption("Sign in to your WasteWatch workspace")
        email = st.text_input("Email", placeholder="you@organization.com")
        password = st.text_input("Password", type="password")
        if st.button("Enter dashboard  →", type="primary", use_container_width=True):
            if email == DEMO_EMAIL and password == DEMO_PASSWORD:
                st.session_state.authenticated = True
                st.rerun()
            st.error("Invalid demo credentials.")
        st.info(f"Demo access\n\n**ID:** `{DEMO_EMAIL}`\n\n**Password:** `{DEMO_PASSWORD}`")
        st.markdown("</div>", unsafe_allow_html=True)


def make_map(location: dict[str, Any]) -> folium.Map:
    latitude, longitude = location["coordinates"]
    satellite_map = folium.Map(location=[latitude, longitude], zoom_start=12, tiles=None)
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/"
        "World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Esri",
        name="Satellite imagery",
    ).add_to(satellite_map)
    folium.TileLayer("CartoDB positron", name="Street map").add_to(satellite_map)
    for index in range(location["dump_sites"]):
        offset = ((index % 5) - 2) * 0.008
        folium.CircleMarker(
            [latitude + offset, longitude + ((index % 4) - 1.5) * 0.01],
            radius=7 if index < 4 else 5,
            color="#ff6b5f",
            fill=True,
            fill_color="#ff6b5f",
            fill_opacity=0.78,
            tooltip=f"Dump site #{index + 1} • Confidence {82 + index % 16}%",
        ).add_to(satellite_map)
    folium.Marker(
        [latitude, longitude],
        tooltip="Selected monitoring area",
        icon=folium.Icon(color="green", icon="crosshairs"),
    ).add_to(satellite_map)
    folium.LayerControl().add_to(satellite_map)
    return satellite_map


def dashboard() -> None:
    st.sidebar.markdown("## 🛰️ WasteWatch")
    st.sidebar.caption("City intelligence console")
    selected_name = st.sidebar.selectbox("Monitoring area", list(LOCATIONS))
    if st.sidebar.button("↪  Sign out", use_container_width=True):
        st.session_state.authenticated = False
        st.rerun()
    location = LOCATIONS[selected_name]

    st.markdown(
        f'<div class="topbar"><div><div class="eyebrow">OVERVIEW / {selected_name.upper()}</div>'
        f'<h1>Good morning, Analyst</h1><p>Here is what changed in your monitoring area.</p></div>'
        f'<div class="status-pill">● LIVE DEMO DATA</div></div>',
        unsafe_allow_html=True,
    )

    with st.form("place-search", border=False):
        search_col, button_col = st.columns([5, 1])
        with search_col:
            query = st.text_input(
                "Search a place",
                placeholder="Search Bengaluru, Chennai, or Pune...",
                label_visibility="collapsed",
            )
        with button_col:
            submitted = st.form_submit_button("Search", use_container_width=True)
    if submitted:
        st.session_state.search_query = query
    query = st.session_state.get("search_query", "")
    if query:
        matching = [name for name in LOCATIONS if query.lower() in name.lower()]
        if matching:
            search_name = matching[0]
            search_location = LOCATIONS[search_name]
            st.success(f"Report found for **{search_name}**")
            search_left, search_right = st.columns([1.2, 1])
            with search_left:
                st.image(
                    mock_report_image(f"LATEST WASTE REPORT • {search_name.upper()}", (255, 107, 95)),
                    use_container_width=True,
                )
                st.caption(
                    f"{search_location['dump_sites']} suspected sites • "
                    f"{search_location['risk']} risk • Updated {search_location['updated']}"
                )
            with search_right:
                st.markdown("**Yearly detection trend**")
                yearly = pd.DataFrame(
                    {
                        "Month": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        "Detected sites": search_location["trend"],
                    }
                ).set_index("Month")
                st.line_chart(yearly, color="#ff6b5f", height=230)
        else:
            st.warning("No mock report found. Future versions will search the live geospatial database.")

    st.markdown("### Area health")
    metrics = st.columns(4)
    cards = [
        ("Active dump sites", str(location["dump_sites"]), "↑ 8.4% vs last month", "bad"),
        ("Area monitored", location["area"], "Across 12 satellite passes", "good"),
        ("High-risk alerts", "07", "↓ 2 resolved this week", "good"),
        ("Model confidence", "91.8%", "↑ 3.2% after calibration", "good"),
    ]
    for column, (label, value, note, state) in zip(metrics, cards):
        with column:
            st.markdown(
                f'<div class="metric-card"><div class="metric-label">{label}</div>'
                f'<div class="metric-value">{value}</div><div class="{state}">{note}</div></div>',
                unsafe_allow_html=True,
            )

    left, right = st.columns([1.45, 1], gap="large")
    with left:
        st.markdown("### Satellite activity map")
        st.caption(f"Last imagery refresh: {location['updated']} • Red markers show suspected dump sites")
        st_folium(make_map(location), height=440, use_container_width=True, returned_objects=[])
    with right:
        st.markdown("### Detection trend")
        st.caption("Suspected locations detected over the last 12 months")
        trend = pd.DataFrame(
            {"Month": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
             "Dump sites": location["trend"]}
        ).set_index("Month")
        st.area_chart(trend, color="#39d39b", height=265)
        st.markdown(
            f'<div class="insight"><b>AI insight</b><br/>Dumping activity is '
            f'<strong>{"increasing" if location["trend"][-1] > location["trend"][0] else "decreasing"}</strong> '
            "in this area compared with January.</div>",
            unsafe_allow_html=True,
        )

    st.markdown("### Recent detection reports")
    for title, risk, detected, weight in location["reports"]:
        report_left, report_mid, report_right = st.columns([2.2, 1, 1])
        with report_left:
            st.markdown(f"**{title}**")
            st.caption(f"{detected} • Estimated waste volume {weight}")
        with report_mid:
            color = "🔴" if risk == "High" else "🟡" if risk == "Medium" else "🟢"
            st.markdown(f"{color} **{risk} risk**")
        with report_right:
            st.button("View report", key=f"{selected_name}-{title}")
        st.divider()

    st.markdown("### Evidence gallery")
    gallery = st.columns(3)
    for index, column in enumerate(gallery):
        with column:
            st.image(
                mock_report_image(
                    f"PASS {index + 1} • {selected_name.upper()}",
                    [(255, 107, 95), (255, 190, 92), (51, 211, 153)][index],
                ),
                use_container_width=True,
            )
            st.caption(["Current detection", "Previous pass", "Change overlay"][index])

    st.markdown("### Data coverage")
    coverage = pd.DataFrame(
        {"Source": ["Satellite passes", "AI detections", "Reviewed reports", "Resolved alerts"],
         "Count": [38, location["dump_sites"], max(3, location["dump_sites"] // 3), 12]}
    ).set_index("Source")
    st.bar_chart(coverage, color="#ffbe5c", height=220)
    st.caption("All values are mock data for interface demonstration. Live satellite, geospatial, and report integrations will replace this layer.")


st.set_page_config(page_title="WasteWatch", page_icon="🛰️", layout="wide", initial_sidebar_state="expanded")
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;600;700;800&display=swap');
    :root { --ink:#f4f7fb; --muted:#91a0b7; --panel:#111a2b; --line:#213049; --green:#39d39b; }
    .stApp { background: #0a1120; color: var(--ink); font-family: 'Manrope', sans-serif; }
    [data-testid="stSidebar"] { background: #0d1728; border-right: 1px solid var(--line); }
    h1 { font-weight:800; letter-spacing:-.04em; } h2,h3 { letter-spacing:-.02em; }
    .hero { padding: 3rem 0 1.5rem; } .hero h1 { font-size: clamp(2.5rem,5vw,4.7rem); line-height:1.04; margin:.6rem 0 1.2rem; }
    .hero h1 span { color:var(--green); } .hero p { color:var(--muted); font-size:1.12rem; max-width:540px; line-height:1.7; }
    .eyebrow { color:var(--green); font:500 .72rem 'DM Mono', monospace; letter-spacing:.14em; }
    .login-card,.metric-card,.insight { background:var(--panel); border:1px solid var(--line); border-radius:16px; padding:1.35rem; }
    .login-card { margin-top:1rem; } .login-card h3 { margin-top:0; }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin:1.2rem 0 2rem; }
    .topbar h1 { margin:.35rem 0 .25rem; } .topbar p,.stCaption { color:var(--muted); }
    .status-pill { color:var(--green); border:1px solid #285f4e; background:#123229; border-radius:99px; padding:.45rem .8rem; font:500 .7rem 'DM Mono',monospace; }
    .metric-label { color:var(--muted); font-size:.8rem; } .metric-value { font-size:2rem; font-weight:800; margin:.35rem 0; }
    .good { color:var(--green); font-size:.72rem; } .bad { color:#ff8176; font-size:.72rem; }
    .insight { border-color:#245740; color:#b8c6d9; font-size:.82rem; line-height:1.6; } .insight b { color:var(--green); }
    [data-testid="stMetricValue"] { color:var(--green); } .stButton button[kind="primary"] { background:var(--green); color:#071318; border:0; }
    </style>
    """,
    unsafe_allow_html=True,
)

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if st.session_state.authenticated:
    dashboard()
else:
    login_page()
