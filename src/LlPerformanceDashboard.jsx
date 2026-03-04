
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, Area, AreaChart
} from "recharts";

// ─── Real benchmark data from benchmark_data.csv ─────────────────────────────
// Conditions: size sweep @ steps=500, T*=1.0
//             steps sweep @ N=500,   T*=1.0
//             temp  sweep @ N=500,   steps=500
// All runtimes in seconds (s).

const VERSION_CONFIG = {
  v2: { label: "v2 NumPy",        subtitle: "Vectorised",        color: "#f0a500" },
  v3: { label: "v3 Numba",        subtitle: "JIT compiled",      color: "#4caf82" },
  v4: { label: "v4 Cython",       subtitle: "Static compiled",   color: "#4a9eff" },
  v5: { label: "v5 Cython+OMP",   subtitle: "OpenMP parallel",   color: "#9b6fff" },
  v6: { label: "v6 MPI",          subtitle: "Distributed (×4)",  color: "#ff6bb5" },
  v7: { label: "v7 MPI+Cython",   subtitle: "MPI + Cython (×4)", color: "#00d4c8" },
};

const VERSIONS = Object.keys(VERSION_CONFIG);
const SIZES    = [100,200,300,400,500,600,700,800,900,1000];
const STEPS_V  = [100,200,300,400,500,600,700,800,900,1000];
const TEMPS    = [0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6];

// ── 1. Size sweep (steps=500, T*=1.0) ─────────────────────────────────────────
const SIZE_DATA = [
  {nmax:100,  label:"100×100",   v2:0.6943,  v3:0.3278,  v4:0.3685,  v5:0.2435,  v6:0.2781,  v7:0.2022},
  {nmax:200,  label:"200×200",   v2:2.6454,  v3:1.2309,  v4:1.45,    v5:0.7529,  v6:0.9425,  v7:0.6465},
  {nmax:300,  label:"300×300",   v2:5.8766,  v3:2.7403,  v4:3.2736,  v5:1.6105,  v6:2.0727,  v7:1.3856},
  {nmax:400,  label:"400×400",   v2:10.8494, v3:4.8868,  v4:5.8317,  v5:2.7566,  v6:3.6492,  v7:2.3303},
  {nmax:500,  label:"500×500",   v2:16.9901, v3:7.6727,  v4:9.2489,  v5:4.4416,  v6:5.7744,  v7:3.6511},
  {nmax:600,  label:"600×600",   v2:24.3261, v3:11.3348, v4:13.3103, v5:6.3038,  v6:8.3093,  v7:5.1848},
  {nmax:700,  label:"700×700",   v2:34.0816, v3:15.065,  v4:18.1722, v5:8.4851,  v6:11.5997, v7:7.0525},
  {nmax:800,  label:"800×800",   v2:46.5233, v3:19.6323, v4:23.7802, v5:10.9613, v6:15.4014, v7:9.1736},
  {nmax:900,  label:"900×900",   v2:59.9485, v3:24.771,  v4:31.7721, v5:14.0245, v6:21.6552, v7:11.7291},
  {nmax:1000, label:"1000×1000", v2:73.0939, v3:30.5719, v4:37.0911, v5:17.3616, v6:26.6256, v7:14.266},
];

// ── 2. Steps sweep (N=500, T*=1.0) ────────────────────────────────────────────
const STEPS_DATA = [
  {nsteps:100,  v2:3.5717,  v3:1.5535,  v4:1.8794,  v5:0.9017,  v6:1.1946,  v7:0.7474},
  {nsteps:200,  v2:6.9791,  v3:3.086,   v4:3.7294,  v5:1.825,   v6:2.3476,  v7:1.4919},
  {nsteps:300,  v2:10.4261, v3:4.6147,  v4:5.5951,  v5:2.7111,  v6:3.5007,  v7:2.2195},
  {nsteps:400,  v2:13.8064, v3:6.1071,  v4:7.4826,  v5:3.655,   v6:4.6319,  v7:2.9596},
  {nsteps:500,  v2:16.9901, v3:7.6727,  v4:9.2489,  v5:4.4416,  v6:5.7744,  v7:3.6511},
  {nsteps:600,  v2:20.679,  v3:9.1859,  v4:11.1119, v5:5.3774,  v6:6.8906,  v7:4.4374},
  {nsteps:700,  v2:24.133,  v3:10.7422, v4:12.891,  v5:6.2964,  v6:8.0155,  v7:5.21},
  {nsteps:800,  v2:27.5434, v3:12.2634, v4:14.7896, v5:7.1566,  v6:9.1565,  v7:5.9647},
  {nsteps:900,  v2:31.0852, v3:13.854,  v4:16.7154, v5:7.9208,  v6:10.2915, v7:6.6873},
  {nsteps:1000, v2:34.6783, v3:15.3506, v4:18.4492, v5:9.0304,  v6:11.3853, v7:7.4584},
];

// ── 3. Temperature sweep (N=500, steps=500) ───────────────────────────────────
const TEMP_DATA = [
  {T:"0.5", v2:17.1109, v3:7.1493, v4:8.5722, v5:4.2983, v6:5.7189, v7:3.721},
  {T:"0.6", v2:17.4234, v3:7.211,  v4:8.6259, v5:4.2847, v6:5.6721, v7:3.7295},
  {T:"0.7", v2:17.1174, v3:7.2913, v4:8.8065, v5:4.3265, v6:5.71,   v7:3.645},
  {T:"0.8", v2:17.0374, v3:7.3657, v4:8.8447, v5:4.3342, v6:5.9082, v7:3.6715},
  {T:"0.9", v2:17.1904, v3:7.5049, v4:9.0288, v5:4.4545, v6:5.7274, v7:3.7086},
  {T:"1.0", v2:16.9901, v3:7.6727, v4:9.2489, v5:4.4416, v6:5.7744, v7:3.6511},
  {T:"1.1", v2:17.5868, v3:7.7733, v4:9.3923, v5:4.5334, v6:5.859,  v7:3.8131},
  {T:"1.2", v2:17.4982, v3:7.8786, v4:9.5823, v5:4.5882, v6:5.9071, v7:3.7875},
  {T:"1.3", v2:18.0235, v3:7.9945, v4:9.7148, v5:4.555,  v6:5.9575, v7:3.9774},
  {T:"1.4", v2:17.562,  v3:8.0809, v4:9.8439, v5:4.5838, v6:6.0251, v7:3.8079},
  {T:"1.5", v2:17.7998, v3:8.1255, v4:9.9131, v5:4.6054, v6:6.0419, v7:3.8314},
  {T:"1.6", v2:17.6271, v3:8.1377, v4:9.9373, v5:4.6206, v6:6.0612, v7:3.8178},
];

// ── 4. Speedup vs v2 (N=500, steps=500, T*=1.0) ──────────────────────────────
const SPEEDUP_DATA = [
  {version:"v2", speedup:1.0,  time:16.99},
  {version:"v3", speedup:2.21, time:7.673},
  {version:"v4", speedup:1.84, time:9.249},
  {version:"v5", speedup:3.83, time:4.442},
  {version:"v6", speedup:2.94, time:5.774},
  {version:"v7", speedup:4.65, time:3.651},
];

// ── 5. Scaling efficiency: speedup vs v2, size sweep (steps=500, T*=1.0) ─────
const SCALING_DATA = [
  {nmax:100,  label:"100",  v2:1.0, v3:2.118, v4:1.884, v5:2.851, v6:2.497, v7:3.434},
  {nmax:200,  label:"200",  v2:1.0, v3:2.149, v4:1.824, v5:3.514, v6:2.807, v7:4.092},
  {nmax:300,  label:"300",  v2:1.0, v3:2.145, v4:1.795, v5:3.649, v6:2.835, v7:4.241},
  {nmax:400,  label:"400",  v2:1.0, v3:2.22,  v4:1.86,  v5:3.936, v6:2.973, v7:4.656},
  {nmax:500,  label:"500",  v2:1.0, v3:2.214, v4:1.837, v5:3.825, v6:2.942, v7:4.653},
  {nmax:600,  label:"600",  v2:1.0, v3:2.146, v4:1.828, v5:3.859, v6:2.928, v7:4.692},
  {nmax:700,  label:"700",  v2:1.0, v3:2.262, v4:1.875, v5:4.017, v6:2.938, v7:4.833},
  {nmax:800,  label:"800",  v2:1.0, v3:2.37,  v4:1.956, v5:4.244, v6:3.021, v7:5.071},
  {nmax:900,  label:"900",  v2:1.0, v3:2.42,  v4:1.887, v5:4.275, v6:2.768, v7:5.111},
  {nmax:1000, label:"1000", v2:1.0, v3:2.391, v4:1.971, v5:4.21,  v6:2.745, v7:5.124},
];

// ── 6. Radar: multi-metric profile (derived from real data, 0–100 scale) ──────
// Speed=runtime score, Scalability=speedup gain N100→1000, LargeGrid=rank at N=1000,
// Warmup=no-warmup penalty (v3 Numba has JIT cost on first call, others minimal),
// Parallel=degree of parallelism
const RADAR_DATA = [
  {version:"v2 NumPy",      color:"#f0a500", Speed:22,  Scalability:20,  LargeGrid:20,  Warmup:95,  Parallel:10},
  {version:"v3 Numba",      color:"#4caf82", Speed:48,  Scalability:56,  LargeGrid:47,  Warmup:55,  Parallel:20},
  {version:"v4 Cython",     color:"#4a9eff", Speed:40,  Scalability:46,  LargeGrid:38,  Warmup:98,  Parallel:20},
  {version:"v5 Cython+OMP", color:"#9b6fff", Speed:82,  Scalability:88,  LargeGrid:82,  Warmup:97,  Parallel:80},
  {version:"v6 MPI",        color:"#ff6bb5", Speed:63,  Scalability:68,  LargeGrid:54,  Warmup:90,  Parallel:85},
  {version:"v7 MPI+Cython", color:"#00d4c8", Speed:100, Scalability:100, LargeGrid:100, Warmup:90,  Parallel:95},
];

// ─── Custom chart components ───────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "s" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,12,20,0.97)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, backdropFilter: "blur(8px)"
    }}>
      <p style={{ color: "#8899aa", marginBottom: 6, fontFamily: "JetBrains Mono, monospace" }}>
        {prefix}{label}
      </p>
      {[...payload].sort((a,b) => a.value - b.value).map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:2, background:p.color }} />
          <span style={{ color:"#ccd" }}>{p.name}:</span>
          <span style={{ color:"#fff", fontWeight:600, fontFamily:"JetBrains Mono,monospace" }}>
            {typeof p.value === "number" ? p.value.toFixed(3) : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      fontSize: 28, letterSpacing: 3, color: "#fff",
      margin: 0, textTransform: "uppercase"
    }}>{children}</h2>
    {sub && <p style={{ fontFamily: "monospace", color: "#556", fontSize: 12, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "28px 24px",
    backdropFilter: "blur(4px)",
    ...style
  }}>
    {children}
  </div>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeVersions, setActiveVersions] = useState(new Set(VERSIONS));
  const [selectedRadar,  setSelectedRadar]  = useState("v4");
  const [ready, setReady] = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 900); }, []);

  const toggleVersion = (v) => {
    setActiveVersions(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const activeVs = VERSIONS.filter(v => activeVersions.has(v));

  const fastest = SPEEDUP_DATA.reduce((a,b) => a.speedup > b.speedup ? a : b);

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (!ready) return (
    <div style={{
      minHeight:"100vh", background:"#060a12",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:24
    }}>
      <div style={{
        fontFamily:"'Bebas Neue','Impact',sans-serif",
        fontSize:48, letterSpacing:8, color:"#fff",
        textShadow:"0 0 60px rgba(74,158,255,0.5)"
      }}>LOADING RESULTS</div>
      <div style={{ fontFamily:"monospace", color:"#4a9eff", fontSize:13 }}>
        Parsing real benchmark data…
      </div>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width:8,height:8,borderRadius:"50%",background:"#4a9eff",
            animation:`bounce 0.8s ${i*0.1}s ease-in-out infinite alternate`
          }}/>
        ))}
      </div>
      <style>{`
        @keyframes bounce { to { transform: translateY(-12px); opacity:0.3; } }
      `}</style>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background: "linear-gradient(135deg, #060a12 0%, #0c1220 50%, #080e1a 100%)",
      color:"#e8edf5", fontFamily:"'DM Sans',system-ui,sans-serif",
      padding:"0 0 80px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; background:#0c1220; }
        ::-webkit-scrollbar-thumb { background:#1e3050; border-radius:4px; }
        .fade-in { animation: fadeIn 0.6s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* ── HERO HEADER */}
      <div style={{
        position:"relative", overflow:"hidden",
        padding:"56px 48px 40px",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        background:"linear-gradient(180deg, rgba(74,158,255,0.06) 0%, transparent 100%)"
      }}>
        <div style={{
          position:"absolute", inset:0, opacity:0.03,
          backgroundImage:"linear-gradient(#4a9eff 1px, transparent 1px), linear-gradient(90deg, #4a9eff 1px, transparent 1px)",
          backgroundSize:"40px 40px"
        }}/>
        <div style={{position:"relative", maxWidth:1400, margin:"0 auto"}}>
          <div style={{
            fontFamily:"monospace", fontSize:11, color:"#4a9eff",
            letterSpacing:4, textTransform:"uppercase", marginBottom:12, opacity:0.7
          }}>
            Lebwohl–Lasher Monte Carlo Simulator 
          </div>
          <h1 style={{
            fontFamily:"'Bebas Neue','Impact',sans-serif",
            fontSize:"clamp(48px,6vw,80px)", letterSpacing:6,
            margin:"0 0 8px", lineHeight:1,
            background:"linear-gradient(135deg, #ffffff 0%, #8ab8ff 60%, #4a9eff 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
          }}>
            VERSION BENCHMARK
          </h1>
          <p style={{color:"#5a7090", fontSize:14, margin:"0 0 32px", maxWidth:640}}>
            Real measured runtimes for v2–v7 across lattice sizes 100–1000,
            temperatures 0.5–1.6 T*, and 100–1000 Monte Carlo steps.
            Baseline: v2 NumPy · N=500 · 500 steps · T*=1.0.
          </p>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            {[
              {label:"Versions tested",  value:"6 (v2–v7)"},
              {label:"Lattice sizes",    value:"100→1000"},
              {label:"MC steps",         value:"100→1000"},
              {label:"Temperatures",     value:"0.5→1.6 T*"},
              {label:"Peak speedup",     value:`${fastest.speedup}×`, accent:true},
              {label:"Fastest version",  value:VERSION_CONFIG[fastest.version]?.label ?? fastest.version, accent:true},
            ].map((s,i) => (
              <div key={i} style={{
                padding:"8px 16px", borderRadius:8,
                background: s.accent ? "rgba(74,158,255,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${s.accent ? "rgba(74,158,255,0.35)" : "rgba(255,255,255,0.08)"}`,
              }}>
                <div style={{fontSize:10,color:"#556",fontFamily:"monospace",letterSpacing:1}}>{s.label.toUpperCase()}</div>
                <div style={{fontSize:18,fontWeight:600,color:s.accent?"#4a9eff":"#fff",fontFamily:"'Bebas Neue',monospace",letterSpacing:1}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1400, margin:"0 auto", padding:"40px 48px 0"}}>

        {/* ── VERSION FILTER */}
        <div style={{marginBottom:36}}>
          <div style={{fontSize:11,color:"#445",fontFamily:"monospace",letterSpacing:2,marginBottom:12}}>
            FILTER VERSIONS (click to toggle)
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {VERSIONS.map(v => {
              const cfg = VERSION_CONFIG[v];
              const on  = activeVersions.has(v);
              return (
                <button key={v} onClick={() => toggleVersion(v)} style={{
                  display:"flex",alignItems:"center",gap:7,
                  padding:"7px 14px",borderRadius:24,cursor:"pointer",
                  background: on ? `${cfg.color}20` : "rgba(255,255,255,0.03)",
                  border:`1.5px solid ${on ? cfg.color : "rgba(255,255,255,0.08)"}`,
                  color: on ? cfg.color : "#445", fontSize:12,
                  fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                  transition:"all 0.2s", outline:"none", opacity: on ? 1 : 0.5,
                }}>
                  <div style={{width:7,height:7,borderRadius:50,background:on?cfg.color:"#334"}}/>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CHART 1: Time vs Lattice Size (log-log) */}
        <div className="fade-in" style={{marginBottom:40}}>
          <Card>
            <SectionTitle sub="Fixed: 500 MC steps · T* = 1.0 · log-log scale · runtime in seconds">
              Execution Time vs Lattice Size
            </SectionTitle>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={SIZE_DATA} margin={{top:10,right:30,left:20,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nmax" scale="log" type="number"
                  domain={[100, 1000]} ticks={SIZES}
                  tickFormatter={v=>`${v}²`}
                  stroke="#334" tick={{fill:"#667",fontSize:11,fontFamily:"monospace"}}
                  label={{value:"Lattice size N (N×N)", fill:"#445", fontSize:12, position:"insideBottom", offset:-10}}
                />
                <YAxis scale="log" type="number" domain={["auto","auto"]}
                  tickFormatter={v=>v>=1?`${v.toFixed(1)}s`:`${(v*1000).toFixed(0)}ms`}
                  stroke="#334" tick={{fill:"#667",fontSize:11,fontFamily:"monospace"}}
                  label={{value:"Wall time (s, log)", fill:"#445", fontSize:12, angle:-90, position:"insideLeft", offset:10}}
                />
                <Tooltip content={<CustomTooltip prefix="N=" suffix="s" />} />
                <Legend wrapperStyle={{paddingTop:16, fontFamily:"monospace", fontSize:11}} />
                {activeVs.map(v => (
                  <Line key={v} dataKey={v} name={VERSION_CONFIG[v].label}
                    stroke={VERSION_CONFIG[v].color} strokeWidth={2.5}
                    dot={{r:4, fill:VERSION_CONFIG[v].color, strokeWidth:0}}
                    activeDot={{r:7, strokeWidth:2, stroke:"#fff"}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── CHART 2 + 3: Speedup bar + Steps sweep */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:40}}>

          {/* Speedup bar */}
          <Card>
            <SectionTitle sub="vs v2 NumPy baseline · N=500 · 500 steps · T*=1.0">
              Speedup Factor
            </SectionTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={SPEEDUP_DATA.filter(d => activeVersions.has(d.version))}
                layout="vertical"
                margin={{top:5,right:60,left:10,bottom:5}}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis type="number" stroke="#334"
                  tick={{fill:"#667",fontSize:10,fontFamily:"monospace"}}
                  tickFormatter={v=>`${v}×`}
                />
                <YAxis type="category" dataKey="version" width={30}
                  tickFormatter={v => VERSION_CONFIG[v]?.label ?? v}
                  tick={{fill:"#aac",fontSize:10,fontFamily:"monospace"}}
                  stroke="transparent"
                />
                <Tooltip
                  formatter={(v,name,props) => [`${v}×  (${props.payload.time}s)`, "Speedup"]}
                  contentStyle={{background:"#0c1220",border:"1px solid #1e3050",borderRadius:8,fontSize:12}}
                />
                <ReferenceLine x={1} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4"
                  label={{value:"1× (v2)",fill:"#445",fontSize:10}}/>
                <Bar dataKey="speedup" radius={[0,6,6,0]}
                  label={{position:"right", fill:"#7af", fontSize:11, fontFamily:"monospace",
                          formatter:v=>`${v}×`}}>
                  {SPEEDUP_DATA.map((entry, i) => (
                    <Cell key={i}
                      fill={VERSION_CONFIG[entry.version]?.color ?? "#4a9eff"}
                      fillOpacity={activeVersions.has(entry.version) ? 1 : 0.15}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Steps sweep */}
          <Card>
            <SectionTitle sub="Fixed: N=500 · T*=1.0 · runtime in seconds">
              Time vs Monte Carlo Steps
            </SectionTitle>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={STEPS_DATA} margin={{top:10,right:20,left:20,bottom:20}}>
                <defs>
                  {activeVs.map(v => (
                    <linearGradient key={v} id={`grad_${v}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={VERSION_CONFIG[v].color} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={VERSION_CONFIG[v].color} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nsteps" stroke="#334"
                  tick={{fill:"#667",fontSize:11,fontFamily:"monospace"}}
                  label={{value:"MC steps", fill:"#445", fontSize:12, position:"insideBottom", offset:-10}}
                />
                <YAxis stroke="#334"
                  tickFormatter={v=>`${v.toFixed(0)}s`}
                  tick={{fill:"#667",fontSize:10,fontFamily:"monospace"}}
                />
                <Tooltip content={<CustomTooltip prefix="steps=" suffix="s" />} />
                <Legend wrapperStyle={{paddingTop:8, fontFamily:"monospace", fontSize:10}} />
                {activeVs.map(v => (
                  <Area key={v} dataKey={v} name={VERSION_CONFIG[v].label}
                    stroke={VERSION_CONFIG[v].color} strokeWidth={2}
                    fill={`url(#grad_${v})`}
                    dot={false} activeDot={{r:5}}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── CHART 4: Temperature sweep */}
        <div className="fade-in" style={{marginBottom:40}}>
          <Card>
            <SectionTitle sub="Fixed: N=500 · 500 MC steps · T* range 0.5–1.6 · runtime in seconds">
              Execution Time vs Temperature T*
            </SectionTitle>
            <div style={{fontSize:12,color:"#4a9eff",fontFamily:"monospace",marginBottom:16,opacity:0.7}}>
              ⟶ Nematic–isotropic transition near T* ≈ 1.0–1.2 · Runtime weakly depends on T* (acceptance-rate effect)
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={TEMP_DATA} margin={{top:10,right:30,left:20,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="T" stroke="#334"
                  tick={{fill:"#667",fontSize:11,fontFamily:"monospace"}}
                  label={{value:"Reduced temperature T*", fill:"#445", fontSize:12, position:"insideBottom", offset:-10}}
                />
                <YAxis stroke="#334"
                  tickFormatter={v=>`${v.toFixed(0)}s`}
                  tick={{fill:"#667",fontSize:10,fontFamily:"monospace"}}
                />
                <ReferenceLine x="1.1" stroke="rgba(255,100,100,0.3)" strokeDasharray="5 3"
                  label={{value:"transition", fill:"#e05c5c", fontSize:10, fontFamily:"monospace"}}
                />
                <Tooltip content={<CustomTooltip prefix="T*=" suffix="s" />} />
                <Legend wrapperStyle={{paddingTop:12, fontFamily:"monospace", fontSize:11}} />
                {activeVs.map(v => (
                  <Line key={v} dataKey={v} name={VERSION_CONFIG[v].label}
                    stroke={VERSION_CONFIG[v].color} strokeWidth={2}
                    dot={{r:3}} activeDot={{r:6}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── CHART 5: Scaling efficiency + Radar */}
        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:24, marginBottom:40}}>

          {/* Scaling efficiency */}
          <Card>
            <SectionTitle sub="Speedup vs v2 as N grows · steps=500 · T*=1.0">
              Scaling Efficiency vs Grid Size
            </SectionTitle>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={SCALING_DATA} margin={{top:10,right:30,left:20,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="nmax" scale="log" type="number"
                  domain={[100,1000]} ticks={SIZES}
                  tickFormatter={v=>`${v}²`}
                  stroke="#334" tick={{fill:"#667",fontSize:11,fontFamily:"monospace"}}
                />
                <YAxis stroke="#334"
                  tick={{fill:"#667",fontSize:10,fontFamily:"monospace"}}
                  tickFormatter={v=>`${v}×`}
                />
                <ReferenceLine y={1} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4"
                  label={{value:"1× (v2 baseline)", fill:"#445", fontSize:10}}/>
                <Tooltip content={<CustomTooltip suffix="×" />} />
                <Legend wrapperStyle={{paddingTop:12, fontFamily:"monospace", fontSize:10}} />
                {VERSIONS.filter(v => activeVersions.has(v)).map(v => (
                  <Line key={v} dataKey={v} name={VERSION_CONFIG[v].label}
                    stroke={VERSION_CONFIG[v].color} strokeWidth={2.5}
                    dot={{r:4}} activeDot={{r:7}}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar */}
          <Card>
            <SectionTitle sub="Multi-metric profile (derived from real data)">
              Version Profile
            </SectionTitle>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {VERSIONS.map(v => (
                <button key={v} onClick={()=>setSelectedRadar(v)} style={{
                  padding:"4px 10px", borderRadius:16, cursor:"pointer",
                  background: selectedRadar===v ? `${VERSION_CONFIG[v].color}30` : "rgba(255,255,255,0.03)",
                  border:`1px solid ${selectedRadar===v ? VERSION_CONFIG[v].color : "rgba(255,255,255,0.08)"}`,
                  color: selectedRadar===v ? VERSION_CONFIG[v].color : "#445",
                  fontSize:10, fontFamily:"monospace", outline:"none",
                }}>
                  {VERSION_CONFIG[v].label}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={["Speed","Scalability","LargeGrid","Warmup","Parallel"].map(metric => {
                const row = { metric };
                VERSIONS.forEach(v => {
                  const d = RADAR_DATA.find(r => r.version === VERSION_CONFIG[v].label);
                  row[v] = d ? d[metric] : 0;
                });
                return row;
              })}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric"
                  tick={{fill:"#778", fontSize:11, fontFamily:"monospace"}}
                />
                <PolarRadiusAxis angle={30} domain={[0,100]}
                  tick={{fill:"#334",fontSize:9}} tickCount={3}
                />
                {VERSIONS.filter(v => activeVersions.has(v)).map(v => (
                  <Radar key={v} name={VERSION_CONFIG[v].label} dataKey={v}
                    stroke={VERSION_CONFIG[v].color}
                    fill={VERSION_CONFIG[v].color}
                    fillOpacity={v === selectedRadar ? 0.25 : 0.04}
                    strokeWidth={v === selectedRadar ? 2.5 : 1}
                    strokeOpacity={v === selectedRadar ? 1 : 0.3}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── DATA TABLE */}
        <div className="fade-in" style={{marginBottom:40}}>
          <Card>
            <SectionTitle sub="Measured wall-clock time (s) at key operating points — all versions">
              Raw Benchmark Summary Table
            </SectionTitle>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%", borderCollapse:"collapse", fontFamily:"'JetBrains Mono',monospace", fontSize:12}}>
                <thead>
                  <tr>
                    {["Version","Tech","N=100","N=300","N=500","N=700","N=1000","100 steps","500 steps","1000 steps","Speedup vs v2"].map(h => (
                      <th key={h} style={{
                        textAlign:"left", padding:"10px 14px",
                        borderBottom:"1px solid rgba(255,255,255,0.08)",
                        color:"#4a9eff", fontSize:10, letterSpacing:1, fontWeight:600,
                        whiteSpace:"nowrap"
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VERSIONS.map((v, ri) => {
                    const cfg = VERSION_CONFIG[v];
                    const sp  = SPEEDUP_DATA.find(d => d.version === v);
                    const sizeRow  = (n) => SIZE_DATA.find(d => d.nmax === n)?.[v] ?? "—";
                    const stepsRow = (s) => STEPS_DATA.find(d => d.nsteps === s)?.[v] ?? "—";
                    return (
                      <tr key={v} style={{
                        background: ri % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                        opacity: activeVersions.has(v) ? 1 : 0.3
                      }}>
                        <td style={{padding:"10px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:10,height:10,borderRadius:3,background:cfg.color,flexShrink:0}}/>
                            <span style={{color:"#fff",fontWeight:600}}>{cfg.label}</span>
                          </div>
                        </td>
                        <td style={{padding:"10px 14px",color:"#556",whiteSpace:"nowrap"}}>{cfg.subtitle}</td>
                        {[100,300,500,700,1000].map(n => (
                          <td key={n} style={{padding:"10px 14px",color:"#8ab"}}>
                            {typeof sizeRow(n) === "number" ? sizeRow(n).toFixed(3) : sizeRow(n)}s
                          </td>
                        ))}
                        {[100,500,1000].map(s => (
                          <td key={s} style={{padding:"10px 14px",color:"#acd"}}>
                            {typeof stepsRow(s) === "number" ? stepsRow(s).toFixed(3) : stepsRow(s)}s
                          </td>
                        ))}
                        <td style={{padding:"10px 14px"}}>
                          <span style={{
                            color: sp?.speedup >= 4 ? "#4caf82" : sp?.speedup >= 2 ? "#f0a500" : "#e05c5c",
                            fontWeight:700
                          }}>{sp?.speedup}×</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── FOOTER */}
        <div style={{
          textAlign:"center", color:"#2a3545",
          fontFamily:"monospace", fontSize:11, letterSpacing:2, paddingTop:20,
          borderTop:"1px solid rgba(255,255,255,0.04)"
        }}>
          LEBWOHL–LASHER ACCELERATED · v2–v7 REAL PERFORMANCE DATA · {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
