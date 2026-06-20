import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Terminal, 
  Briefcase, 
  Code, 
  Cpu, 
  Award, 
  BookOpen, 
  Send, 
  ChevronDown, 
  Check, 
  Bot, 
  Search, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Cloud,
  FileCode,
  Settings
} from 'lucide-react';

const Github = ({ size = 20 }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const Linkedin = ({ size = 20 }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

import AgentSimulator from './components/AgentSimulator';
import ProjectCard from './components/ProjectCard';

// Projects list based on profile README.md
const PROJECTS = [
  {
    title: "AgenticAI Workshop",
    desc: "Multi-agent AI orchestration framework with Model Context Protocol (MCP) integration and custom tool-use agent loops.",
    link: "https://github.com/imaakanksha/AgenticAI-Workshop",
    tags: ["Python", "LangChain", "Gen AI", "MCP"],
    category: "Gen AI & Agents"
  },
  {
    title: "o9 Optimizer Agent",
    desc: "AI-powered report optimization, syntax mapping, and diagnostic advisory suite built for o9 Solutions platform integrations.",
    link: "https://github.com/imaakanksha/o9OptimizerAgent",
    tags: ["Python", "AI Agent", "Enterprise", "o9"],
    category: "Gen AI & Agents"
  },
  {
    title: "Multi-Agent Research System",
    desc: "Production-grade multi-agent research framework with safety guardrails, evaluators, and asynchronous execution pipelines.",
    link: "https://github.com/imaakanksha/Multi-Agent-For-MGT",
    tags: ["Python", "FastAPI", "Async", "AI Agent"],
    category: "Gen AI & Agents"
  },
  {
    title: "ProductivityAnalyzer",
    desc: "Enterprise-grade team analytics platform featuring real-time interactive tracking dashboards and custom metrics processing.",
    link: "https://github.com/imaakanksha/ProductivityAnalyzer",
    tags: ["Python", "Data Viz", "Analytics", "Power BI"],
    category: "Data Viz & Analytics"
  },
  {
    title: "Near Miss Incident Analysis",
    desc: "Predictive knowledge graph web app leveraging NLP models for near-miss industrial incident risk analysis and prevention.",
    link: "https://github.com/imaakanksha/Urban-Intelligence-Dashboard-Final",
    tags: ["Python", "NLP", "ML", "Knowledge Graph"],
    category: "Data Viz & Analytics"
  },
  {
    title: "ATS Resume Optimizer",
    desc: "AI-driven resume optimization engine that parses CVs and maps skill scores to maximize ATS compatibility using NLP.",
    link: "https://github.com/imaakanksha/ATS-Master-Resume-Optimizer",
    tags: ["Python", "NLP", "AI", "FastAPI"],
    category: "Gen AI & Agents"
  }
];

const SKILLS = [
  { name: "Gen AI Orchestration (ADK, LangChain)", category: "ai", val: 95 },
  { name: "RAG & Vector DBs (Chroma, pgvector)", category: "ai", val: 90 },
  { name: "NLP & ML (SpaCy, PyTorch, Scikit-Learn)", category: "ai", val: 85 },
  { name: "FastAPI / Django / Flask", category: "backend", val: 90 },
  { name: "SQL & Relational Databases (Postgres, MySQL)", category: "backend", val: 88 },
  { name: "QA Automation (Selenium, PyTest)", category: "devops", val: 92 },
  { name: "DevOps & Cloud (Docker, AWS, Azure)", category: "devops", val: 80 },
  { name: "Scripting (Bash, PowerShell)", category: "devops", val: 85 }
];

export default function App() {
  // Navigation active state
  const [activeSec, setActiveSec] = useState('home');
  // System config console tab state
  const [consoleTab, setConsoleTab] = useState('yaml');
  // Skill category filter state
  const [skillCat, setSkillCat] = useState('all');
  // Project category filter state
  const [projectCat, setProjectCat] = useState('all');
  // Project search query state
  const [projectSearch, setProjectSearch] = useState('');
  
  // Interactive timeline expand state
  const [expandedTimeline, setExpandedTimeline] = useState('samsung');

  // Contact Form states
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle'); // idle, typing, logs, sent
  const [formLogs, setFormLogs] = useState([]);

  // Typewriter effect state
  const [typewriterText, setTypewriterText] = useState('');
  const typingLines = [
    "Building autonomous AI agents...",
    "Engineering production-grade RAG pipelines...",
    "Shipping robust backend applications...",
    "Optimizing data workflows & integrations..."
  ];
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect logic
  useEffect(() => {
    let timer;
    const currentLine = typingLines[lineIdx];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setTypewriterText(currentLine.substring(0, charIdx - 1));
        setCharIdx(prev => prev - 1);
      }, 30);
    } else {
      timer = setTimeout(() => {
        setTypewriterText(currentLine.substring(0, charIdx + 1));
        setCharIdx(prev => prev + 1);
      }, 70);
    }

    if (!isDeleting && charIdx === currentLine.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setLineIdx(prev => (prev + 1) % typingLines.length);
    }

    return () => clearTimeout(timer);
  }, [charIdx, isDeleting, lineIdx]);

  // Handle active navigation highlighting on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'agent', 'experience', 'skills', 'projects', 'achievements', 'contact'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSec(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setFormStatus('logs');
    setFormLogs([]);

    const logMessages = [
      "[SYS] Initiating contact dispatch framework...",
      "[VAL] Validating input parameters (email check, spam filter)... [OK]",
      "[NLP] Formatting message payload for destination delivery...",
      "[NET] Establishing secure SSL channel to summiakanksha123@gmail.com...",
      "[SYS] Message dispatched successfully!"
    ];

    for (let i = 0; i < logMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setFormLogs(prev => [...prev, logMessages[i]]);
    }

    setFormStatus('sent');
    setFormData({ name: '', email: '', message: '' });
  };

  // Profile data representations
  const yamlContent = `identity:
  name: Akanksha
  pronouns: she/her
  location: Gurugram, India 🇮🇳
  
facts:
  experience: 3.9 Years
  languages: [Python, SQL]
  career_path:
    - Samsung SDS
    - HCLTech
  focus:
    - Autonomous AI Agents
    - Advanced RAG (GMFT)
    - QA Automation Engines`;

  const jsonContent = `{
  "identity": {
    "name": "Akanksha",
    "pronouns": "she/her",
    "location": "Gurugram, India"
  },
  "facts": {
    "experience": "3.9 Years",
    "languages": ["Python", "SQL"],
    "career_path": ["Samsung SDS", "HCLTech"],
    "focus": [
      "Autonomous AI Agents",
      "Advanced RAG",
      "QA Automation"
    ]
  }
}`;

  const bioContent = `Akanksha is a Senior Executive Engineer at Samsung SDS. Over her 3.9 years of experience, she has specialized in:
• Designing autonomous AI agents (ADK framework)
• Implementing RAG engines with PDF partitioning (GMFT)
• Building self-healing automated QA testing rigs
• Integrating custom Python modules into enterprise platforms (o9 Solutions)

Formerly a Software Engineer at HCLTech, where she managed web service reliability (98%) and resolved 500+ production incidents.`;

  // Filter skills based on tab selection
  const filteredSkills = SKILLS.filter(s => skillCat === 'all' || s.category === skillCat);

  // Filter projects based on search and category tab
  const filteredProjects = PROJECTS.filter(p => {
    const matchesCat = projectCat === 'all' || p.category === projectCat;
    const matchesSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
                          p.desc.toLowerCase().includes(projectSearch.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(projectSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Floating Navbar */}
      <nav className="glass-panel" style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '1100px',
        zIndex: 100,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '9999px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }} className="logo-link">
          <Terminal size={18} style={{ color: 'var(--primary)' }} />
          <span>AKANKSHA<span style={{ color: 'var(--primary)' }}>.</span></span>
        </a>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem', fontWeight: '500' }} className="nav-links">
          {[
            { id: 'about', label: 'About' },
            { id: 'agent', label: 'AI Agent' },
            { id: 'experience', label: 'Experience' },
            { id: 'skills', label: 'Skills' },
            { id: 'projects', label: 'Projects' },
            { id: 'achievements', label: 'Impact' },
            { id: 'contact', label: 'Contact' }
          ].map(item => (
            <a 
              key={item.id} 
              href={`#${item.id}`} 
              style={{ 
                color: activeSec === item.id ? 'var(--primary)' : 'var(--text-secondary)',
                position: 'relative'
              }}
              className="nav-link"
            >
              {item.label}
              {activeSec === item.id && (
                <span style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '0',
                  width: '100%',
                  height: '2px',
                  background: 'var(--gradient-primary)',
                  borderRadius: '2px'
                }}></span>
              )}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="https://github.com/imaakanksha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="social-nav-link">
            <Github size={18} />
          </a>
          <a href="https://www.linkedin.com/in/iamakanksha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="social-nav-link">
            <Linkedin size={18} />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{ paddingTop: '160px', paddingBottom: '80px', position: 'relative' }} className="container">
        
        {/* Decorative background glows */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'hsla(262, 83%, 68%, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'hsla(245, 80%, 65%, 0.15)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }}></div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          
          <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Bot size={14} /> Senior Executive Engineer @ Samsung SDS
          </div>

          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', fontFamily: 'var(--font-heading)', fontWeight: '800', maxWidth: '800px' }}>
            Hey there, I'm <span className="gradient-text">Akanksha</span>
          </h1>

          <div style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.25rem', 
            color: 'var(--accent)', 
            height: '40px',
            fontWeight: '600'
          }} className="blink-cursor">
            {typewriterText}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            I design stateful AI agentic workflows, orchestrate advanced retrieval architectures, and deploy production-grade backend APIs.
          </p>

          <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
            <a href="#agent" className="btn btn-primary">
              <Sparkles size={16} /> Intercept AI Sandbox
            </a>
            <a href="#projects" className="btn btn-secondary">
              Explore Projects
            </a>
          </div>

          {/* Quick Metrics Badges */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginTop: '40px',
            maxWidth: '900px'
          }}>
            {[
              { label: "Experience", value: "3.9 Years", icon: Briefcase },
              { label: "AI/ML Features", value: "10+", icon: Cpu },
              { label: "Incidents Resolved", value: "500+", icon: Settings },
              { label: "Service Uptime", value: "98%", icon: Database },
              { label: "Downtime Reduced", value: "30%", icon: Sparkles }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="glass-panel" style={{
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  textAlign: 'left',
                  borderRadius: '12px',
                  minWidth: '160px'
                }}>
                  <div style={{ 
                    background: 'var(--primary-glow)', 
                    color: 'var(--primary)', 
                    borderRadius: '8px', 
                    padding: '8px',
                    display: 'flex'
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{metric.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* About & Console Section */}
      <section id="about" style={{ padding: '80px 0' }} className="container">
        <div className="section-header">
          <h2>About Me</h2>
          <p>The combination of software engineering discipline and intelligent AI design.</p>
        </div>

        <div className="grid-cols-2" style={{ display: 'grid', gap: '32px', alignItems: 'stretch' }}>
          
          {/* Summary Box */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              ⚡ Professional Summary
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
              I am an engineering impact-driven professional with **3.9 years** of enterprise software development experience. In my current role at **Samsung SDS**, my work converges on designing autonomous **AI agents**, production-ready **RAG systems** utilizing GMFT PDF layout models, and building self-correcting validation pipelines.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.7' }}>
              My background at **HCLTech** honed my software architecture capabilities in managing high-availability web applications, automating system health checkers, deploying predictive NLP parsers, and scaling backend pipelines across cloud environments.
            </p>
            <blockquote style={{ 
              borderLeft: '4px solid var(--primary)', 
              paddingLeft: '16px', 
              fontStyle: 'italic', 
              color: 'var(--accent)',
              fontFamily: 'var(--font-heading)',
              fontSize: '1.1rem',
              background: 'var(--primary-glow)',
              padding: '12px 16px',
              borderRadius: '0 8px 8px 0'
            }}>
              "Automate the mundane, engineer the extraordinary ⚡"
            </blockquote>
          </div>

          {/* System Config Console */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Terminal size={14} /> profile_config.config
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['yaml', 'json', 'bio'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setConsoleTab(tab)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      background: consoleTab === tab ? 'var(--primary-glow)' : 'transparent',
                      border: '1px solid ' + (consoleTab === tab ? 'var(--primary)' : 'var(--border-color)'),
                      color: consoleTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ flex: '1', display: 'flex' }}>
              <pre style={{
                width: '100%',
                background: 'hsl(250, 24%, 4%)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: consoleTab === 'yaml' ? 'hsl(200, 100%, 75%)' : consoleTab === 'json' ? 'hsl(45, 100%, 70%)' : 'var(--text-primary)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                textAlign: 'left',
                lineHeight: '1.5'
              }}>
                {consoleTab === 'yaml' ? yamlContent : consoleTab === 'json' ? jsonContent : bioContent}
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* AI Agent simulator Section */}
      <section id="agent" style={{ padding: '80px 0', background: 'hsla(250, 24%, 4%, 0.4)' }}>
        <div className="container">
          <div className="section-header">
            <h2>AI Agent Sandbox</h2>
            <p>Test drive an autonomous agent simulator trained on Akanksha's professional credentials.</p>
          </div>
          <AgentSimulator />
        </div>
      </section>

      {/* Professional Journey Timeline Section */}
      <section id="experience" style={{ padding: '80px 0' }} className="container">
        <div className="section-header">
          <h2>Professional Journey</h2>
          <p>Chronological breakdown of software engineering impact at enterprise scale.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="grid-timeline">
          
          {/* Vertical Navigation / Summaries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Samsung SDS */}
            <div 
              className={`glass-panel ${expandedTimeline === 'samsung' ? 'glow-effect' : ''}`}
              onClick={() => setExpandedTimeline('samsung')}
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderLeft: '4px solid ' + (expandedTimeline === 'samsung' ? 'var(--primary)' : 'var(--border-color)'),
                background: expandedTimeline === 'samsung' ? 'var(--card-bg-hover)' : 'var(--card-bg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Senior Executive Engineer</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem', marginTop: '2px' }}>Samsung SDS</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-primary">2024 – Present</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Gurugram, India</div>
                </div>
              </div>
              {expandedTimeline === 'samsung' && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }} className="timeline-bullets">
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', listStyle: 'square' }}>
                    <li>🤖 Designed stateful AI agents using the <strong>ADK framework</strong> for content automation & evaluations.</li>
                    <li>📊 Developed an advanced **RAG pipeline** with layout-aware PDF extraction (GMFT) for quarterly reports.</li>
                    <li>🧪 Engineered an automated self-healing <strong>QA testing engine</strong>, improving diagnostic cycles.</li>
                    <li>🔌 Wrote custom Python plugin integrations and automation on the <strong>o9 Solutions Platform</strong>.</li>
                    <li>🚀 Scaled LLM workflows through divide-and-conquer token partitioning schemas.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* HCLTech */}
            <div 
              className={`glass-panel ${expandedTimeline === 'hcl' ? 'glow-effect' : ''}`}
              onClick={() => setExpandedTimeline('hcl')}
              style={{
                padding: '24px',
                cursor: 'pointer',
                borderLeft: '4px solid ' + (expandedTimeline === 'hcl' ? 'var(--primary)' : 'var(--border-color)'),
                background: expandedTimeline === 'hcl' ? 'var(--card-bg-hover)' : 'var(--card-bg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Software Engineer</h3>
                  <div style={{ color: 'var(--secondary)', fontWeight: '600', fontSize: '0.9rem', marginTop: '2px' }}>HCLTech</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge">2022 – 2024</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Noida, India</div>
                </div>
              </div>
              {expandedTimeline === 'hcl' && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }} className="timeline-bullets">
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', listStyle: 'square' }}>
                    <li>🌐 Developed and supported key web services for internal recruitment and job rotations.</li>
                    <li>📈 Built automated pipeline tracking dashboards using **Power BI** for process management.</li>
                    <li>🤖 Deployed ML classifiers for semantic resume parsing, candidate mapping, and vector searching.</li>
                    <li>🛠️ Resolved over <strong>500+ production incidents</strong>, decreasing service downtime metrics by 30%.</li>
                    <li>☁️ Supported reliable service hosting on **AWS and Azure** environments, preserving 98% uptime.</li>
                  </ul>
                </div>
              )}
            </div>

          </div>

        </div>

        <style>{`
          .timeline-bullets ul {
            text-align: left !important;
          }
        `}</style>
      </section>

      {/* Tech Arsenal Skills Section */}
      <section id="skills" style={{ padding: '80px 0', background: 'hsla(250, 24%, 4%, 0.4)' }} className="container">
        <div className="section-header">
          <h2>Tech Arsenal</h2>
          <p>Highly tailored skill set bridging machine learning, API development, and automation.</p>
        </div>

        {/* Skill filters */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
          {[
            { id: 'all', label: 'All Tech' },
            { id: 'ai', label: 'AI & Data Science' },
            { id: 'backend', label: 'Backend Development' },
            { id: 'devops', label: 'DevOps & Testing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSkillCat(tab.id)}
              className={`btn ${skillCat === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Skill Bars */}
        <div className="grid-cols-2" style={{ display: 'grid', gap: '20px' }}>
          {filteredSkills.map((skill, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{skill.name}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>{skill.val}%</span>
              </div>
              <div style={{ height: '8px', background: 'hsla(250, 20%, 20%, 0.5)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${skill.val}%`, 
                  background: 'var(--gradient-primary)',
                  borderRadius: '4px',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Skill Icons Section */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1rem', fontWeight: '600' }}>Tech Stack Badges</h4>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {['Python', 'SQL', 'FastAPI', 'Django', 'Flask', 'PostgreSQL', 'MySQL', 'Docker', 'AWS', 'Azure', 'PyTorch', 'Git', 'Bash', 'PowerShell', 'Selenium', 'PyTest', 'Postman'].map((name, i) => (
              <span key={i} className="badge" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" style={{ padding: '80px 0' }} className="container">
        <div className="section-header">
          <h2>Featured Projects</h2>
          <p>Production-grade AI solutions and analytical software architectures.</p>
        </div>

        {/* Project search & category selectors */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          marginBottom: '32px',
          alignItems: 'center'
        }}>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search projects or tags (e.g. Python, RAG)..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'Gen AI & Agents', label: 'Gen AI & Agents' },
              { id: 'Data Viz & Analytics', label: 'Analytics & Viz' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setProjectCat(tab.id)}
                className={`btn ${projectCat === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Projects Grid */}
        <div className="grid-cols-3">
          {filteredProjects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
              No projects match your search/filters.
            </div>
          ) : (
            filteredProjects.map((p, idx) => (
              <ProjectCard 
                key={idx}
                title={p.title}
                desc={p.desc}
                link={p.link}
                tags={p.tags}
              />
            ))
          )}
        </div>
      </section>

      {/* Impact & Achievements Section */}
      <section id="achievements" style={{ padding: '80px 0', background: 'hsla(250, 24%, 4%, 0.4)' }} className="container">
        <div className="section-header">
          <h2>Impact & Achievements</h2>
          <p>Key awards, certifications, and educational credentials.</p>
        </div>

        <div className="grid-cols-2" style={{ display: 'grid', gap: '32px' }}>
          
          {/* Achievements List */}
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-heading)' }}>
              <Award size={22} style={{ color: 'var(--primary)' }} /> Key Achievements
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: "1st Place — National Science Day 2022", desc: "Awarded by BCST, Government of Bihar for scientific project innovations." },
                { title: "1st Place — AI & ML Hackathon", desc: "Won top honors during the EdgeFX Technologies AI/ML intensive program." },
                { title: "1st Place — Boot Camp & Hackathon", desc: "Placed first in the Emerging Technology Hackathon sponsored by TEQIP-III." },
                { title: "NPTEL Star & Domain Scholar", desc: "Recognized as a Star Student and Discipline Scholar across engineering courses (2021/2022)." }
              ].map((ach, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '50%', padding: '6px', display: 'flex', marginTop: '2px' }}>
                    <Check size={14} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{ach.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Certs */}
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-heading)' }}>
              <BookOpen size={22} style={{ color: 'var(--secondary)' }} /> Credentials & Education
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: "AI Programming with Python Nanodegree", issuer: "Udacity Nano Degree Program", date: "Credential ID: AI-PY" },
                { title: "Full Stack Web Development Certification", issuer: "E & ICT Academy, IIT Kanpur", date: "Intensive Full Stack Engineering Course" },
                { title: "B.Tech in Computer Science & Engineering", issuer: "Aryabhatta Knowledge University", date: "Class of 2022 | GPA Honors" },
                { title: "Diploma in Computer Application", issuer: "ARCADE Academy", date: "Class of 2018" }
              ].map((edu, idx) => (
                <div key={idx} style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-6px',
                    top: '6px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--secondary)'
                  }}></div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{edu.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{edu.issuer}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{edu.date}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '80px 0' }} className="container">
        <div className="section-header">
          <h2>Let's Connect</h2>
          <p>Get in touch for collaborations, AI agent design consulting, or recruitment inquiries.</p>
        </div>

        <div className="grid-cols-2" style={{ display: 'grid', gap: '32px', alignItems: 'center' }}>
          
          {/* Info Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              Let's build something <span className="gradient-text">amazing</span> together.
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
              I'm open to consulting on custom multi-agent workflows (ADK, LangChain), optimizing retrieval mechanisms (RAG / PDF layout parsing), or speaking about enterprise data workflows.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '8px', padding: '10px', display: 'flex' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct Email</div>
                  <a href="mailto:summiakanksha123@gmail.com" style={{ fontSize: '0.95rem', fontWeight: '600' }} className="hover-link">summiakanksha123@gmail.com</a>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '8px', padding: '10px', display: 'flex' }}>
                  <Linkedin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LinkedIn Network</div>
                  <a href="https://www.linkedin.com/in/iamakanksha" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', fontWeight: '600' }} className="hover-link">linkedin.com/in/iamakanksha</a>
                </div>
              </div>
            </div>
          </div>

          {/* Connect Form with custom validation & simulated agent output */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            {formStatus !== 'sent' ? (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    className="input-field"
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Your Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    className="input-field"
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Your Message</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your project description or inquiry here..."
                    className="input-field"
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>

                {formStatus === 'logs' && (
                  <div style={{ 
                    background: 'hsl(250, 24%, 4%)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    fontFamily: 'var(--font-mono)', 
                    fontSize: '0.75rem', 
                    color: 'hsl(120, 100%, 75%)',
                    textAlign: 'left',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {formLogs.map((log, i) => <div key={i}>{log}</div>)}
                    <div style={{ color: 'var(--primary)' }} className="blink-cursor">[SYS] Dispatching payload...</div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={formStatus === 'logs'}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <Send size={16} /> Send Message
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'var(--primary-glow)', color: 'hsl(140, 100%, 70%)', border: '1px solid hsl(140, 100%, 70%)', borderRadius: '50%', padding: '16px', display: 'flex' }}>
                  <Check size={32} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Message Logged!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
                  Your submission has been intercepted and simulated delivery succeeded. I will reach out to you shortly.
                </p>
                <button onClick={() => setFormStatus('idle')} className="btn btn-secondary" style={{ marginTop: '10px' }}>
                  Send Another Message
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--border-color)', 
        padding: '40px 0', 
        marginTop: 'auto',
        background: 'hsl(250, 24%, 3%)'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://github.com/imaakanksha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="hover-link">
              <Github size={20} />
            </a>
            <a href="https://www.linkedin.com/in/iamakanksha" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }} className="hover-link">
              <Linkedin size={20} />
            </a>
            <a href="mailto:summiakanksha123@gmail.com" style={{ color: 'var(--text-secondary)' }} className="hover-link">
              <Mail size={20} />
            </a>
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', maxWidth: '400px', textAlign: 'center' }}>
            "First, solve the problem. Then, write the code." — John Johnson
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>
            © {new Date().getFullYear()} Akanksha. Built with React + Vite. All Rights Reserved.
          </div>

        </div>
      </footer>

      <style>{`
        .logo-link:hover {
          color: var(--primary) !important;
        }
        .nav-link:hover {
          color: var(--primary) !important;
        }
        .social-nav-link:hover {
          color: var(--primary) !important;
          transform: scale(1.1);
        }
        .hover-link:hover {
          color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
