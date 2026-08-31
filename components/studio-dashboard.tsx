"use client";

import { useState } from "react";
import {
  AlertTriangle, CalendarDays, Check, ChevronRight, CircleDollarSign, CloudRain,
  ExternalLink, Film, LogOut, MapPin, Menu, Radio, Search, Send, Sparkles, Users, X
} from "lucide-react";
import { signOut } from "firebase/auth";
import { demoProduction } from "@/lib/demo-data";
import { clientAuth } from "@/lib/firebase-client";
import type { AgentFinding, DecisionResponse } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { AuthScreen } from "./auth-screen";
import { ProductionModules } from "./production-modules";

const quickQuestions = [
  "Can we move Thursday's outdoor shoot to Saturday?",
  "What risks do we have for Thursday's shoot?",
  "What will a one-day delay cost?"
];

const agentIcons = {
  production: CalendarDays,
  research: Search,
  weather: CloudRain,
  crew: Users,
  budget: CircleDollarSign,
  decision: Sparkles
};

function AgentResult({ finding }: { finding: AgentFinding }) {
  const Icon = agentIcons[finding.agent];
  return (
    <article className="agent-result">
      <div className={"agent-icon " + finding.agent}><Icon size={17} /></div>
      <div>
        <div className="agent-title">
          <strong>{finding.label}</strong>
          <span className={"agent-status " + finding.status}>
            {finding.status === "complete" ? <Check size={12} /> : <AlertTriangle size={12} />}
            {finding.status}
          </span>
        </div>
        <p>{finding.summary}</p>
        {finding.evidence.length > 0 && <small>{finding.evidence.join(" · ")}</small>}
      </div>
    </article>
  );
}

export function StudioDashboard() {
  const { user, loading: authLoading, token } = useAuth();
  const [message, setMessage] = useState(quickQuestions[0]);
  const [response, setResponse] = useState<DecisionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  if (authLoading) return <main className="auth-shell"><div className="module-loading">Checking your session…</div></main>;
  if (!user) return <AuthScreen />;

  async function askDecisionAgent() {
    if (loading || message.trim().length < 3) return;
    setLoading(true);
    setError("");
    try {
      const authToken = await token();
      const request = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ message, productionId: demoProduction.id })
      });
      const data = await request.json();
      if (!request.ok) throw new Error(data.error || "Analysis failed");
      setResponse(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <aside className={mobileNav ? "sidebar open" : "sidebar"} aria-label="Primary navigation">
        <div className="brand"><span><Film size={20} /></span>StudioCopilot</div>
        <button className="nav-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button>
        <nav>
          <a className="active" href="#overview"><Sparkles size={18} />Command centre</a>
          <a href="#schedule-module"><CalendarDays size={18} />Schedule</a>
          <a href="#crew-module"><Users size={18} />Crew</a>
          <a href="#locations-module"><MapPin size={18} />Locations</a>
          <a href="#risks"><AlertTriangle size={18} />Risk reports</a>
        </nav>
        <div className="production-switcher">
          <small>ACTIVE PRODUCTION</small>
          <strong>{demoProduction.name}</strong>
          <span>Principal photography · Day 8 of 24</span>
        </div>
        <div className="powered">
          <div><Radio size={14} /> Live integrations</div>
          <span>Gemini on Vertex AI</span>
          <span>Parallel Search API</span>
          <button className="sign-out" onClick={() => signOut(clientAuth)}><LogOut size={13} />Sign out</button>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <button className="menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button>
          <div><span className="eyebrow">PRODUCTION INTELLIGENCE</span><h1>Good morning, Alex</h1></div>
          <div className="shoot-badge"><span>Next shoot</span><strong>Thu 3 Sep · 06:30</strong></div>
          <div className="avatar">AM</div>
        </header>

        <div className="content">
          <section className="hero" id="overview">
            <div>
              <span className="hero-kicker"><Sparkles size={15} /> DECISION AGENT</span>
              <h2>What does the production<br />need to decide?</h2>
              <p>Coordinate schedule, crew, cost, risk and current location intelligence in one evidence-backed answer.</p>
            </div>
            <div className="weather-card">
              <div><CloudRain /><span><small>THURSDAY · CASTLEFIELD</small><strong>Rain risk</strong></span></div>
              <b>High</b>
              <p>Run live analysis for current forecast evidence.</p>
            </div>
          </section>

          <section className="question-card" aria-label="Ask the decision agent">
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1200}
              aria-label="Production question" onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) askDecisionAgent();
              }} />
            <div className="question-actions">
              <span>⌘ Enter to send</span>
              <button onClick={askDecisionAgent} disabled={loading || message.trim().length < 3}>
                {loading ? <span className="spinner" /> : <Send size={16} />}
                {loading ? "Coordinating agents…" : "Analyse decision"}
              </button>
            </div>
          </section>

          <div className="quick-row">
            <span>Try asking</span>
            {quickQuestions.slice(1).map((question) => <button key={question} onClick={() => setMessage(question)}>{question}</button>)}
          </div>

          {error && <div className="error-banner" role="alert"><AlertTriangle size={18} /><div><strong>Analysis unavailable</strong><p>{error}</p></div></div>}

          {response && (
            <section className="decision-output" aria-live="polite">
              <div className="output-heading">
                <div>
                  <span className={"mode-badge " + response.mode}><Radio size={12} />{response.mode === "live" ? "LIVE ANALYSIS" : "DEMO ANALYSIS"}</span>
                  <h3>{response.recommendation}</h3>
                  <p>{response.summary}</p>
                </div>
                <div className="confidence"><span>{Math.round(response.confidence * 100)}%</span><small>confidence</small></div>
              </div>
              {response.mode === "demo" && <div className="demo-notice">Sample result only. It contains no live weather, permit, or web-search claims.</div>}
              <div className="agent-grid">{response.agents.map((finding) => <AgentResult key={finding.agent} finding={finding} />)}</div>
              <div className="decision-columns">
                <div><h4>Key risks</h4>{response.risks.map((risk) => <p key={risk}><AlertTriangle size={14} />{risk}</p>)}</div>
                <div><h4>Recommended actions</h4>{response.actions.map((action) => <p key={action}><ChevronRight size={14} />{action}</p>)}</div>
              </div>
              {response.sources.length > 0 && <div className="sources"><h4>Parallel research sources</h4>{response.sources.map((source) =>
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={12} /></a>)}</div>}
            </section>
          )}

          <section className="dashboard-grid">
            <article className="panel" id="schedule">
              <div className="panel-heading"><div><small>SHOOT SCHEDULE</small><h3>Coming up</h3></div><button>View schedule <ChevronRight size={14} /></button></div>
              {demoProduction.shootDays.map((day, index) => <div className="shoot-row" key={day.id}>
                <div className="date-box"><strong>{new Date(day.date + "T12:00:00").getDate()}</strong><span>SEP</span></div>
                <div className="shoot-info"><strong>{day.title}</strong><span><MapPin size={12} />{day.location}</span></div>
                <span className={"type-pill " + day.type.toLowerCase()}>{day.type}</span>
                <span className="scenes">{day.scenes.length} scenes</span>
                {index === 0 && <span className="risk-dot">2 risks</span>}
              </div>)}
            </article>

            <article className="panel" id="crew">
              <div className="panel-heading"><div><small>CREW COVERAGE</small><h3>Thursday call</h3></div><span className="coverage">100%</span></div>
              <div className="crew-stack">{demoProduction.crew.slice(0, 5).map((member) => <span title={member.name} key={member.id}>{member.name.split(" ").map((part) => part[0]).join("")}</span>)}<b>+1</b></div>
              <div className="coverage-bar"><i /></div>
              <p className="coverage-copy"><Check size={15} /> All 6 essential roles confirmed</p>
            </article>
          </section>
          <ProductionModules />
        </div>
      </section>
    </main>
  );
}
