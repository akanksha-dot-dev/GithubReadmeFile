import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Bot, Play, Sparkles, User, Cpu } from 'lucide-react';

const PRESETS = [
  {
    q: "Tell me about Akanksha's current role",
    logs: [
      "Initializing Agent session...",
      "PLANNER: Parsing query context for 'current role' and 'experience'",
      "RETRIEVER: Querying career_history vector space...",
      "RETRIEVER: Found matching document: Samsung_SDS_Senior_Executive_Engineer.json",
      "LLM: Synthesizing professional summary...",
      "EVALUATOR: Validating details: 3.9 years experience, Gurugram, India... [PASSED]",
      "AGENT: Response constructed. Initiating stream..."
    ],
    a: "Akanksha is a results-driven Senior Executive Engineer at Samsung SDS with 3.9 years of software engineering experience. She specializes in building autonomous AI agents using the ADK framework, production-grade RAG pipelines, and automated QA systems. She operates out of Gurugram, India, and is passionate about optimizing data workflows and scaling intelligent enterprise integrations."
  },
  {
    q: "Explain her Advanced RAG pipeline",
    logs: [
      "Initializing Agent session...",
      "PLANNER: Locating project documentation for 'RAG' / 'GMFT'",
      "RETRIEVER: Searching repository metadata for document retrieval systems...",
      "RETRIEVER: Found file: annual_report_retriever_architecture.pdf (Partitions: GMFT)",
      "LLM: Formatting engineering architecture description...",
      "EVALUATOR: Cross-checking tech stack dependencies: pgvector, Chroma, FastAPI... [PASSED]",
      "AGENT: Response constructed. Initiating stream..."
    ],
    a: "She developed an end-to-end RAG system tailored for annual and financial reports. To solve the problem of messy PDF structures, she implemented advanced PDF partitioning using GMFT to extract tables, hierarchies, and text. The clean data is embedded and indexed in Vector DBs (Chroma/pgvector), and retrieved using a divide-and-conquer strategy with token-optimized LLM role assignments."
  },
  {
    q: "What is her core Tech Stack?",
    logs: [
      "Initializing Agent session...",
      "PLANNER: Extracting skills taxonomy...",
      "RETRIEVER: Loading skillicons profile metadata...",
      "LLM: Grouping technologies by competency areas...",
      "AGENT: Response constructed. Initiating stream..."
    ],
    a: "Akanksha's tech stack is highly specialized. For AI & Data, she uses Python, PyTorch, Scikit-Learn, SpaCy, LangChain, Pandas, NumPy, Matplotlib, pgvector, and Chroma. On the Backend & Infrastructure side, she is fluent in FastAPI, Django, Flask, PostgreSQL, MySQL, Docker, AWS, Azure, Bash, PowerShell, Selenium, and PyTest."
  },
  {
    q: "What is her engineering philosophy?",
    logs: [
      "Initializing Agent session...",
      "PLANNER: Accessing personal alignment files...",
      "RETRIEVER: Reading engineering_philosophy.yaml...",
      "LLM: Compiling guiding principles...",
      "AGENT: Response constructed. Initiating stream..."
    ],
    a: "Her core philosophy centers on three active pillars: (1) Architect: Design for scale, not just for now. (2) Automate: If a task runs twice, script and automate it. (3) Validate: Test early, test often, and ship safe. She believes every bug is an educational lesson and that sharing knowledge multiplies its value."
  }
];

export default function AgentSimulator() {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState([]);
  const [output, setOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const logContainerRef = useRef(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const simulateAgent = async (preset) => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setOutput('');
    setIsTyping(true);

    // Step 1: Stream logs one by one
    for (let i = 0; i < preset.logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350 + Math.random() * 250));
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${timestamp}] ${preset.logs[i]}`]);
    }

    // Step 2: Stream answer letter by letter
    await new Promise(resolve => setTimeout(resolve, 400));
    setIsTyping(false);
    
    let currentText = '';
    const textToStream = preset.a;
    for (let i = 0; i < textToStream.length; i++) {
      currentText += textToStream[i];
      setOutput(currentText);
      await new Promise(resolve => setTimeout(resolve, 8 + Math.random() * 12));
    }
    
    setIsRunning(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isRunning) return;

    const lowerQuery = query.toLowerCase();
    let selectedPreset = null;

    if (lowerQuery.includes('role') || lowerQuery.includes('experience') || lowerQuery.includes('samsung') || lowerQuery.includes('job')) {
      selectedPreset = PRESETS[0];
    } else if (lowerQuery.includes('rag') || lowerQuery.includes('pdf') || lowerQuery.includes('annual') || lowerQuery.includes('retrieve')) {
      selectedPreset = PRESETS[1];
    } else if (lowerQuery.includes('tech') || lowerQuery.includes('stack') || lowerQuery.includes('skills') || lowerQuery.includes('python')) {
      selectedPreset = PRESETS[2];
    } else if (lowerQuery.includes('philosophy') || lowerQuery.includes('principle') || lowerQuery.includes('motto')) {
      selectedPreset = PRESETS[3];
    } else {
      selectedPreset = {
        q: query,
        logs: [
          "Initializing Agent session...",
          "PLANNER: Analyzing custom query: '" + query + "'",
          "RETRIEVER: Searching developer portfolio index...",
          "LLM: Query matches general profile context. Creating tailored reply...",
          "EVALUATOR: Reviewing contact fallback rules... [PASSED]",
          "AGENT: Response constructed. Initiating stream..."
        ],
        a: `I've scanned Akanksha's profile database! She is a Senior Executive Engineer at Samsung SDS specializing in autonomous AI Agents (using the ADK framework), Advanced RAG pipelines (with GMFT PDF parser), and QA Automation. If you have custom questions about her projects or would like to collaborate, you can connect with her on LinkedIn (linkedin.com/in/iamakanksha) or drop a message via the form below!`
      };
    }

    simulateAgent(selectedPreset);
    setQuery('');
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Terminal Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} /> akanksha-agent-evaluator ~ bash
          </span>
        </div>
        <div className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
          <Sparkles size={12} /> ONLINE
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="grid-md-layout">
        
        {/* Preset Queries Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
            <Cpu size={16} className="gradient-text" /> Query Presets
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => simulateAgent(p)}
                disabled={isRunning}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: 'hsla(250, 20%, 15%, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}
                className="hover-preset-btn"
              >
                <span>{p.q}</span>
                <Play size={12} style={{ opacity: 0.6 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Console Console Screen */}
        <div style={{ background: 'hsl(250, 24%, 4%)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '320px' }}>
          {/* Logs Terminal Area */}
          <div 
            ref={logContainerRef}
            style={{ 
              flex: '1', 
              padding: '16px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.8rem', 
              color: 'hsl(120, 100%, 75%)', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                <Bot size={32} style={{ opacity: 0.5 }} />
                <span>Select a preset query or type below to run the AI Agent simulator.</span>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{
                  color: log.includes('SYSTEM') ? 'var(--text-muted)' : 
                         log.includes('PLANNER') ? 'hsl(200, 100%, 70%)' :
                         log.includes('RETRIEVER') ? 'hsl(45, 100%, 70%)' :
                         log.includes('LLM') ? 'hsl(280, 100%, 80%)' :
                         log.includes('EVALUATOR') ? 'hsl(150, 100%, 70%)' : 'hsl(120, 100%, 85%)'
                }}>
                  {log}
                </div>
              ))
            )}
            {isTyping && (
              <div style={{ color: 'var(--primary)' }} className="blink-cursor">
                [SYSTEM] Thinking
              </div>
            )}
          </div>

          {/* Response Output Area */}
          <div style={{ padding: '16px', minHeight: '120px', background: 'hsla(250, 24%, 3%, 0.6)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '50%', padding: '6px', display: 'flex', color: 'var(--accent)' }}>
              <Bot size={16} />
            </div>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ADK Agent Response</span>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: '1.5' }}>
                {output || (isRunning ? "Streaming..." : "Waiting for prompt...")}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Input Bar */}
      <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <User size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isRunning}
            placeholder="Ask the Agent about Akanksha's projects, RAG engine, Python backend..."
            className="input-field"
            style={{ paddingLeft: '40px', width: '100%', fontSize: '0.9rem' }}
          />
        </div>
        <button type="submit" disabled={isRunning || !query.trim()} className="btn btn-primary" style={{ padding: '0 20px' }}>
          <Send size={16} />
        </button>
      </form>

      {/* Inline styles for custom hover effects */}
      <style>{`
        .hover-preset-btn:hover {
          background: hsla(250, 40%, 25%, 0.6) !important;
          border-color: var(--primary) !important;
          color: var(--text-primary) !important;
          transform: translateX(4px);
        }
        @media (min-width: 768px) {
          .grid-md-layout {
            grid-template-columns: 260px 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
